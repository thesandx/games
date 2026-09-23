# Local development

## Prerequisites

| Tool       | Version         | Notes                                                    |
| ---------- | --------------- | -------------------------------------------------------- |
| Node.js    | 22 LTS or newer | Pinned in `.nvmrc`; `nvm use` picks it up                |
| pnpm       | 10 or newer     | `corepack enable` installs the version in `package.json` |
| Docker     | any recent      | Only needed for container work                           |
| gcloud CLI | any recent      | For deployment work, and for the Firestore emulator      |
| Java       | 21 or newer     | Only for the Firestore emulator                          |

```bash
# Node via nvm
nvm install && nvm use

# pnpm via corepack (ships with Node: do not npm install -g pnpm)
corepack enable
```

Corepack reads the `packageManager` field in `package.json`, so everyone gets the same pnpm version, with nothing extra to keep in sync.

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>.

## Scripts

| Command                | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `pnpm dev`             | Dev server with hot reload                                     |
| `pnpm build`           | Production build                                               |
| `pnpm start`           | Serve the production build (run `build` first)                 |
| `pnpm typecheck`       | `tsc --noEmit`, **run `build` at least once first**, see below |
| `pnpm lint`            | ESLint                                                         |
| `pnpm lint:fix`        | ESLint with `--fix`, including import sorting                  |
| `pnpm format`          | Prettier, writing changes                                      |
| `pnpm format:check`    | Prettier, verifying only (what CI runs)                        |
| `pnpm test`            | Vitest, once                                                   |
| `pnpm test:watch`      | Vitest in watch mode                                           |
| `pnpm test:coverage`   | Vitest with a coverage report                                  |
| `pnpm validate`        | Everything CI runs, in one command                             |
| `pnpm db:emulator`     | Start a local Firestore emulator on port 8085                  |
| `pnpm test:emulator`   | Start the emulator, run `*.emulator.test.ts`, stop it          |
| `pnpm check:rooms-api` | Check a running app against the rooms API wire contract        |
| `pnpm db:deploy`       | Publish rules, indexes and TTL policies to a real database     |
| `pnpm docker:build`    | Build the production image locally                             |
| `pnpm docker:run`      | Run it and wait for health                                     |
| `pnpm clean`           | Remove `.next`, `coverage`, `node_modules`                     |

> **`pnpm typecheck` on a fresh clone fails until you have built once.** `next build` generates `next-env.d.ts` and `.next/types/**`, which `tsc` needs to resolve JSX and typed routes. Both are gitignored. `pnpm dev` also generates them. CI runs `build` before `typecheck` for the same reason.

## Editor setup

VS Code picks up the recommended extensions and settings from `.vscode/`. The two that matter:

- **ESLint**: inline lint errors, fix on save
- **Prettier**: format on save

For other editors: enable format-on-save with Prettier, and point your LSP at the workspace TypeScript version (`node_modules/typescript`), not a globally installed one. A version mismatch produces errors that nobody else sees.

## The development loop

```
edit → hot reload → pnpm validate → commit → PR
```

Run `pnpm validate` before pushing. It is exactly what CI runs, so a green local run means a green PR. It also catches the format-check failure that otherwise costs an extra push.

## Rooms: in the browser, or in Firestore

A fresh checkout keeps rooms in the browser (`NEXT_PUBLIC_PLAYROOM_TRANSPORT=local`). Two tabs can play a real game, and no database is necessary.

To run the real rooms API, the one the deployed app uses, give it a Firestore.

### Against the emulator (no Google Cloud account)

Install the emulator once:

```bash
gcloud components install cloud-firestore-emulator
```

Then, in one terminal:

```bash
pnpm db:emulator
```

And in `.env.local`:

```bash
NEXT_PUBLIC_PLAYROOM_TRANSPORT=remote
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
```

Then `pnpm dev`. The emulator keeps data in memory, so a restart clears every room.

To play across devices, open the app from another device on the same network at `http://<your-laptop-ip>:3000`.

### Against the real database

Add the values bootstrap printed to `.env.local`, and authenticate once:

```bash
NEXT_PUBLIC_PLAYROOM_TRANSPORT=remote
APP_SLUG=my-app
GCP_PROJECT_ID=my-gcp-project
```

```bash
gcloud auth application-default login
```

Your own Google account then needs access to the database. Prefer the emulator: a laptop that writes to the production database can break real rooms.

### Checking the wire contract

With the app running on the remote transport:

```bash
pnpm check:rooms-api
```

It creates a room, plays part of a round, reads the stream, and checks each response against the shape the client reads.

## Working with the container

The dev server is not what production runs. Before touching anything in `Dockerfile`, `next.config.ts`, or the environment model, verify against the real image:

```bash
docker compose up --build
curl localhost:8080/api/health
docker compose ps          # should say "healthy", not just "running"
docker compose down
```

Or without Compose:

```bash
pnpm docker:build
pnpm docker:run
```

Problems that appear only here: wrong `PORT` handling, binding to localhost, missing static assets, permission errors from the non-root user, and slow cold starts.

## Environment variables

```bash
cp .env.example .env.local   # gitignored
```

Next.js loads `.env.local` automatically. Precedence, highest first: shell environment → `.env.local` → `.env.$NODE_ENV` → `.env`.

Adding a variable? All four steps, same PR: see [`cloud/environment-variables.md`](../cloud/environment-variables.md#adding-a-variable).

## Adding a dependency

Read [rule 8](../.github/instructions/coding-rules.md#8-avoid-unnecessary-dependencies) first. If it is still justified:

```bash
pnpm add <package>              # runtime
pnpm add -D <package>           # build/test only
```

Two pnpm safety nets may stop you, and both are deliberate:

- **`Ignored build scripts`**: the package wants to run an install script. Add it to `allowBuilds` in `pnpm-workspace.yaml` and say why in the PR.
- **`minimumReleaseAge` violation**: the version is less than 24 hours old. pnpm adds an entry to `minimumReleaseAgeExclude` for you; commit it, and prune it once the version has aged past the window.

Neither is a nuisance to switch off. They are supply-chain controls. See [troubleshooting](./troubleshooting.md#err_pnpm_minimum_release_age_violation--lockfile-failed-supply-chain-policy-check).

Commit the updated `pnpm-lock.yaml`. CI installs with `--frozen-lockfile` and will fail without it.

## Troubleshooting

| Symptom                                                      | Fix                                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `Cannot find module '@/...'`                                 | Restart the TS server; check the path matches a real file from the repository root             |
| Type errors that VS Code shows but `pnpm typecheck` does not | Editor is using a different TypeScript, select "Use Workspace Version"                         |
| `pnpm typecheck` fails on a fresh clone                      | Run `pnpm build` once (see the note above)                                                     |
| Port 3000 in use                                             | `PORT=3001 pnpm dev`                                                                           |
| Stale build after a config change                            | `rm -rf .next && pnpm dev`                                                                     |
| `ERR_PNPM_OUTDATED_LOCKFILE` in CI                           | `pnpm install` locally and commit the lockfile                                                 |
| Hydration mismatch warning                                   | Something renders differently on server and client, usually `Date`, `Math.random`, or `window` |

More in [troubleshooting.md](./troubleshooting.md).
