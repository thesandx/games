/**
 * Typed, validated access to environment variables.
 *
 * Why this file exists: `process.env.FOO` is `string | undefined` everywhere,
 * so a missing variable surfaces as a confusing runtime error deep in a request
 * handler: often only in production. Validating once, at module load, turns
 * that into a loud failure at container start, which Cloud Run reports as a
 * failed revision instead of silently serving broken traffic.
 *
 * Rules:
 *   - Every variable the app reads MUST be declared here and in `.env.example`.
 *   - Never read `process.env` directly outside this file.
 *   - Server-only values must never be re-exported into a Client Component.
 *     Anything the browser may see has to be prefixed `NEXT_PUBLIC_`.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time, so those reads are
 * written out literally below rather than looked up dynamically.
 *
 * Data-layer configuration (`APP_SLUG`, `GCP_PROJECT_ID`, `FIRESTORE_DATABASE_ID`)
 * is derived, not repeated. Set `APP_SLUG` and `GCP_PROJECT_ID` and the database
 * id follows the naming convention `<app-slug>-db`. Override it explicitly when
 * an existing database has another name.
 */

type NodeEnv = 'development' | 'production' | 'test';

const VALID_NODE_ENVS: readonly NodeEnv[] = ['development', 'production', 'test'];
const VALID_LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
const VALID_TRANSPORTS = ['local', 'remote'] as const;

export type LogLevel = (typeof VALID_LOG_LEVELS)[number];

/** Where room state lives. See NEXT_PUBLIC_PLAYROOM_TRANSPORT in .env.example. */
export type PlayroomTransport = (typeof VALID_TRANSPORTS)[number];

/**
 * Identifier shapes, checked here so a typo fails the revision at start rather
 * than as a `NOT_FOUND` from Google an hour later. Each mirrors the provider's
 * own published constraint.
 */

/** Same rule as `scripts/rename-project.sh`: valid for npm and Cloud Run alike. */
const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,48}$/;

/** GCP project ids: 6-30 chars, lowercase letters, digits and hyphens. */
const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;

/** Firestore database ids: 4-63 chars, or the literal `(default)`. */
const DATABASE_ID_PATTERN = /^(\(default\)|[a-z][a-z0-9-]{2,61}[a-z0-9])$/;

class EnvValidationError extends Error {
  constructor(issues: readonly string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}\n\n` +
        'See .env.example for the full list of supported variables.',
    );
    this.name = 'EnvValidationError';
  }
}

const issues: string[] = [];

function optional(value: string | undefined, fallback: string): string {
  return value === undefined || value.trim() === '' ? fallback : value;
}

function oneOf<T extends string>(
  name: string,
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value === undefined || value.trim() === '') return fallback;
  if (!allowed.includes(value as T)) {
    issues.push(`${name} must be one of [${allowed.join(', ')}] but was "${value}"`);
    return fallback;
  }
  return value as T;
}

function port(name: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    issues.push(`${name} must be an integer between 1 and 65535 but was "${value}"`);
    return fallback;
  }
  return parsed;
}

/**
 * Checks a value against an identifier shape. Returns `''` for an unset value
 * (and for an invalid one, after recording the issue) so callers can treat
 * "absent" and "rejected" the same way. The thrown error then lists every
 * problem at once rather than one per restart.
 */
function pattern(
  name: string,
  value: string | undefined,
  regex: RegExp,
  requirement: string,
  fallback = '',
): string {
  const resolved = optional(value, fallback);
  if (resolved === '') return '';
  if (!regex.test(resolved)) {
    issues.push(`${name} ${requirement} but was "${resolved}"`);
    return '';
  }
  return resolved;
}

const nodeEnv = oneOf('NODE_ENV', process.env.NODE_ENV, VALID_NODE_ENVS, 'development');

// Order matters below: the database id defaults to a value derived from the
// slug, so the slug is resolved first.
const appSlug = pattern(
  'APP_SLUG',
  process.env.APP_SLUG,
  SLUG_PATTERN,
  'must start with a lowercase letter and contain only lowercase letters, digits and hyphens (max 49 characters)',
);

const gcpProjectId = pattern(
  'GCP_PROJECT_ID',
  process.env.GCP_PROJECT_ID,
  PROJECT_ID_PATTERN,
  'must be a valid GCP project id (6-30 lowercase letters, digits and hyphens)',
);

const firestoreDatabaseId = pattern(
  'FIRESTORE_DATABASE_ID',
  process.env.FIRESTORE_DATABASE_ID,
  DATABASE_ID_PATTERN,
  'must be 4-63 lowercase letters, digits and hyphens, or the literal "(default)"',
  appSlug === '' ? '' : `${appSlug}-db`,
);

export const env = {
  /** Node runtime mode. Set by the tooling; never override it by hand. */
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',

  /** Injected by Cloud Run. The server MUST bind to this, not a hardcoded 3000. */
  port: port('PORT', process.env.PORT, 3000),

  /** Interface to bind. `0.0.0.0` is required inside a container. */
  host: optional(process.env.HOSTNAME, '0.0.0.0'),

  /** Verbosity floor for application logs. */
  logLevel: oneOf('LOG_LEVEL', process.env.LOG_LEVEL, VALID_LOG_LEVELS, 'info'),

  /** Public origin of the deployment, used for canonical URLs and metadata. */
  appUrl: optional(process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000'),

  /** Human-readable name shown in the UI and in page titles. */
  appName: optional(process.env.NEXT_PUBLIC_APP_NAME, 'Next.js on Cloud Run'),

  /** Commit SHA of the running build. Surfaced by /api/health for traceability. */
  appVersion: optional(process.env.NEXT_PUBLIC_APP_VERSION, 'dev'),

  /**
   * Machine name of this application. One slug names the Cloud Run service,
   * the runtime service account and the Firestore database, so a second app in
   * the same project never collides with this one.
   */
  appSlug,

  /** GCP project id. Injected by the deploy workflow; absent locally. */
  gcpProjectId,

  /** Cloud Run region, e.g. `asia-south1`. */
  gcpRegion: optional(process.env.GCP_REGION, ''),

  /**
   * Firestore database the rooms API reads and writes. A NAMED database, never
   * `(default)`: the runtime service account is granted `roles/datastore.user`
   * under an IAM condition pinned to this exact name, so one app in a shared
   * project cannot reach another app's data. Defaults to `<app-slug>-db`.
   */
  firestoreDatabaseId,

  /**
   * Set by the Firestore emulator (`pnpm db:emulator`). When present, the
   * Firestore client talks to the emulator and sends no credentials. Never set
   * this in a deployed environment: it would silently route production reads
   * to a host that does not exist.
   */
  firestoreEmulatorHost: optional(process.env.FIRESTORE_EMULATOR_HOST, ''),

  /**
   * UTC time of the last deploy (ISO-8601), injected by the deploy workflow.
   * Empty locally. Surfaced by /api/health, rendered in IST, so a deploy is
   * visible without opening GitHub.
   */
  deployedAt: optional(process.env.DEPLOYED_AT, ''),

  /**
   * Base URL of the Playroom rooms API, including its `/v1` prefix. Every path
   * in `services/playroom-api.ts` is appended to this, so it carries no
   * trailing slash.
   *
   * The API is served by this application, from `app/api/v1/`, so the default
   * is a same-origin path. No CORS, no second service, no second region.
   */
  playroomApiUrl: optional(process.env.NEXT_PUBLIC_PLAYROOM_API_URL, '/api/v1').replace(/\/+$/, ''),

  /**
   * Which transport backs rooms. `local` keeps state in the browser; `remote`
   * calls `playroomApiUrl`, which is backed by Firestore.
   * Defaults to `local` so a fresh checkout is playable with no Google Cloud
   * account and no emulator. The deploy workflow builds with `remote`.
   */
  playroomTransport: oneOf(
    'NEXT_PUBLIC_PLAYROOM_TRANSPORT',
    process.env.NEXT_PUBLIC_PLAYROOM_TRANSPORT,
    VALID_TRANSPORTS,
    'local',
  ),
} as const;

/**
 * Variables the data layer cannot work without.
 *
 * Checked only in production, and only on the server:
 *   - locally and in tests they are optional, so `pnpm dev` and `pnpm test`
 *     work on a clean checkout with no Google Cloud account;
 *   - the guard is skipped in the browser because Next.js replaces a
 *     non-`NEXT_PUBLIC_` read with `undefined` in the client bundle. Without
 *     the guard, a Client Component that imports this file would throw on every
 *     page load in production while the server was healthy;
 *   - the guard is skipped during `next build`, which runs with
 *     NODE_ENV=production and imports every route to collect page metadata.
 *     Without the phase check the Docker builder stage and CI would demand
 *     production database configuration in order to compile.
 *
 * The deploy workflow always sets all three, so a missing one means a
 * misconfigured pipeline. Failing here makes Cloud Run reject the revision and
 * keep serving the previous one, which is the outcome you want.
 */
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const REQUIRED_IN_PRODUCTION: ReadonlyArray<readonly [string, string]> = [
  ['APP_SLUG', appSlug],
  ['GCP_PROJECT_ID', gcpProjectId],
  ['FIRESTORE_DATABASE_ID', firestoreDatabaseId],
];

if (nodeEnv === 'production' && typeof window === 'undefined' && !isBuildPhase) {
  for (const [name, value] of REQUIRED_IN_PRODUCTION) {
    if (value === '') {
      issues.push(`${name} is required in production but is missing or was rejected above`);
    }
  }
}

/**
 * `NEXT_PUBLIC_APP_URL` is intentionally NOT required. Cloud Run only generates
 * the service URL after the first deploy, and `NEXT_PUBLIC_*` values are inlined
 * at build time, so making it mandatory would fail the first deploy's health
 * check before the URL can exist. `appUrl` above falls back to a safe default,
 * and the deploy workflow inlines the real value on the next build.
 */

if (issues.length > 0) {
  throw new EnvValidationError(issues);
}

export type Env = typeof env;
