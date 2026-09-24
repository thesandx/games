# Deployment runbook

The operator-facing guide: set up once, then deploy by merging to `main`.

---

## Prerequisites

- A Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- `roles/owner` or equivalent on the project for the one-time setup
- Admin access to the GitHub repository (to set secrets and variables)

---

## One-time setup

### The fast path

```bash
./scripts/gcp-bootstrap.sh \
  --project my-gcp-project \
  --region asia-south1 \
  --repo thesandx/my-app \
  --service my-app
```

The script enables APIs and creates the Artifact Registry repository. It sets up Workload Identity Federation and creates the deployer and runtime service accounts with least-privilege roles. It creates the Firestore database `<service>-db` in Native mode, in the same region, with point-in-time recovery and daily backups. Then it prints the exact GitHub secrets and variables to configure. Re-running it is safe: every step is idempotent.

> **A Firestore database location is permanent.** Check the region before you run the script. To move later, you create a second database and copy every document.

Then set what it printed:

```bash
gh secret set WIF_PROVIDER        --body "projects/123456789/locations/global/workloadIdentityPools/github/providers/github"
gh secret set WIF_SERVICE_ACCOUNT --body "github-deployer@my-gcp-project.iam.gserviceaccount.com"

gh variable set GCP_PROJECT_ID      --body "my-gcp-project"
gh variable set GCP_REGION          --body "asia-south1"
gh variable set ARTIFACT_REPOSITORY --body "containers"
gh variable set CLOUD_RUN_SERVICE   --body "my-app"
gh variable set APP_SLUG            --body "my-app"
gh variable set RUNTIME_SERVICE_ACCOUNT --body "my-app-runtime@my-gcp-project.iam.gserviceaccount.com"
gh variable set FIRESTORE_DATABASE_ID   --body "my-app-db"
```

Skip to [Deploying](#deploying).

### The manual path

Useful when you need to understand or audit what the script does, or when org policy requires each step to be reviewed.

```bash
export PROJECT_ID="my-gcp-project"
export REGION="asia-south1"
export REPO="thesandx/my-app"          # GitHub owner/name
export SERVICE="my-app"
export AR_REPO="containers"

gcloud config set project "$PROJECT_ID"
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
```

**1. Enable APIs**

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  firebaserules.googleapis.com
```

**2. Create the Artifact Registry repository**

```bash
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Container images for $SERVICE"
```

**3. Create the deployer service account**: the identity GitHub Actions impersonates.

```bash
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions deployer"

export DEPLOYER="github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Push images
gcloud artifacts repositories add-iam-policy-binding "$AR_REPO" \
  --location="$REGION" \
  --member="serviceAccount:${DEPLOYER}" \
  --role="roles/artifactregistry.writer"

# Manage Cloud Run services
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER}" \
  --role="roles/run.admin"
```

**4. Create the runtime service account**: the identity the _application_ runs as. Separate from the deployer on purpose: the pipeline should not inherit the app's data access, and the app should not be able to deploy itself.

```bash
gcloud iam service-accounts create "${SERVICE}-runtime" \
  --display-name="Runtime identity for $SERVICE"

export RUNTIME="${SERVICE}-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

# The deployer must be allowed to assign this identity to a revision.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" \
  --member="serviceAccount:${DEPLOYER}" \
  --role="roles/iam.serviceAccountUser"
```

Grant the runtime account only what the application needs. It starts with nothing, and step 5 gives it one database.

**5. Create the Firestore database**: named, in Native mode, in the same region as Cloud Run.

```bash
export DATABASE="${SERVICE}-db"

gcloud firestore databases create \
  --database="$DATABASE" \
  --location="$REGION" \
  --type=firestore-native

# The runtime account may use THIS database and no other. Without the
# condition, datastore.user grants every database in the project.
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME}" \
  --role="roles/datastore.user" \
  --condition="title=only-${DATABASE},expression=resource.name.startsWith('projects/${PROJECT_ID}/databases/${DATABASE}')"

# The deployer publishes indexes and TTL policies. It still cannot read data.
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER}" \
  --role="roles/datastore.indexAdmin" \
  --condition="title=only-${DATABASE}-indexes,expression=resource.name.startsWith('projects/${PROJECT_ID}/databases/${DATABASE}')"
```

The bootstrap script also enables point-in-time recovery and a daily backup schedule. See `scripts/gcp-bootstrap.sh`.

**6. Create the Workload Identity Pool and provider**

```bash
gcloud iam workload-identity-pools create github \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github \
  --location=global \
  --workload-identity-pool=github \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == '${REPO}'"
```

> **The `--attribute-condition` is the security control.** Without it, _any_ GitHub repository in the world can exchange a token for access to your project. It is not optional, and Google refuses to create the provider without one.

**7. Let the pool impersonate the deployer**

```bash
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${REPO}"
```

**8. Collect the provider resource name**

```bash
gcloud iam workload-identity-pools providers describe github \
  --location=global \
  --workload-identity-pool=github \
  --format='value(name)'
```

Set that as the `WIF_PROVIDER` secret, and `$DEPLOYER` as `WIF_SERVICE_ACCOUNT`.

---

## GitHub configuration

**Secrets**: Settings → Secrets and variables → Actions → Secrets

| Secret                | Value                                                                              |
| --------------------- | ---------------------------------------------------------------------------------- |
| `WIF_PROVIDER`        | `projects/<number>/locations/global/workloadIdentityPools/github/providers/github` |
| `WIF_SERVICE_ACCOUNT` | `github-deployer@<project>.iam.gserviceaccount.com`                                |

Neither is a credential. Both are resource identifiers, useless without a valid OIDC token from this repository. They are stored as secrets to avoid publishing your project structure, not because disclosure would be catastrophic.

**Variables**: same page, Variables tab

| Variable                  | Required | Default                  | Purpose                                           |
| ------------------------- | -------- | ------------------------ | ------------------------------------------------- |
| `GCP_PROJECT_ID`          | **yes**  | -                        | Target project                                    |
| `GCP_REGION`              | no       | `asia-south1`            | Cloud Run, Artifact Registry and Firestore region |
| `ARTIFACT_REPOSITORY`     | no       | `containers`             | Artifact Registry repository name                 |
| `CLOUD_RUN_SERVICE`       | no       | repository name          | Cloud Run service name                            |
| `APP_SLUG`                | no       | service name             | Names the runtime account and database            |
| `FIRESTORE_DATABASE_ID`   | no       | `<app-slug>-db`          | Firestore database the app uses                   |
| `RUNTIME_SERVICE_ACCOUNT` | no       | `<app-slug>-runtime@...` | Identity the revision runs as                     |
| `PLAYROOM_TRANSPORT`      | no       | `remote`                 | `local` ships a browser-only build                |
| `PLAYROOM_API_URL`        | no       | `/api/v1`                | Rooms API base, inlined at build time             |
| `APP_URL`                 | no       | -                        | Public URL, inlined at build time                 |
| `APP_NAME`                | no       | `Next.js on Cloud Run`   | Display name                                      |
| `LOG_LEVEL`               | no       | `info`                   | Runtime log verbosity                             |
| `MIN_INSTANCES`           | no       | `0`                      | `1` removes cold starts, at a cost                |
| `MAX_INSTANCES`           | no       | `10`                     | Scaling and bill ceiling                          |

**Environment**: Settings → Environments → New environment → `production`

Optional but recommended: add required reviewers so a deploy pauses for human approval, and restrict the environment to the `main` branch.

---

## Deploying

Merge to `main`. That is the whole procedure.

```
merge PR ──▶ deploy.yml ──▶ build ──▶ push ──▶ deploy ──▶ health check ──▶ ✅
```

Manual redeploy of current `main`:

```bash
gh workflow run deploy.yml -f reason="Redeploy after config change"
gh run watch
```

### First deploy

The first deploy has one extra step: you cannot know `APP_URL` until the service exists, because Cloud Run generates the URL.

1. Deploy once with `APP_URL` unset.
2. Read the URL from the workflow summary, or:
   ```bash
   gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
   ```
3. `gh variable set APP_URL --body "https://..."`
4. Redeploy so the value is inlined into the client bundle.

---

## Verifying a deploy

```bash
# What the pipeline already checked
curl -s https://<service-url>/api/health | jq

# Which revision is serving, and from which image
gcloud run services describe "$SERVICE" --region "$REGION" \
  --format='value(status.latestReadyRevisionName, spec.template.spec.containers[0].image)'

# Recent logs
gcloud run services logs read "$SERVICE" --region "$REGION" --limit 50
```

The `version` field in the health payload is the commit SHA. If it does not match what you merged, the deploy did not land.

---

## Rolling back

The previous revision still exists and the previous image is still in Artifact Registry, so rollback is a traffic shift: seconds, not a rebuild.

```bash
# 1. Find a known-good revision
gcloud run revisions list --service "$SERVICE" --region "$REGION" --limit 10

# 2. Send all traffic to it
gcloud run services update-traffic "$SERVICE" --region "$REGION" \
  --to-revisions "${SERVICE}-<good-sha>=100"

# 3. Confirm
curl -s https://<service-url>/api/health | jq .version
```

Then fix forward with a normal PR. You can also revert the commit and let CI redeploy, but that is slower while the site is broken.

### Gradual rollout

For a riskier change, split traffic instead of switching it:

```bash
gcloud run services update-traffic "$SERVICE" --region "$REGION" \
  --to-revisions "${SERVICE}-<new>=10,${SERVICE}-<old>=90"
```

Watch error rates in Cloud Monitoring, then move to 100%.

---

## Custom domain

> **Moving the live app?** Follow [`migrate-to-firestore.md`](./migrate-to-firestore.md). It orders these steps for this app's move from `asia-southeast1`.

**Check your region first.** Cloud Run domain mappings work in only a handful of regions, and `asia-south1`, this template's default, is **not** one of them. Google has said it has no plan to add it. Run this before you plan around it:

```bash
gcloud run domain-mappings list --region "$REGION"   # errors if unsupported
```

Three options, in the order most projects should consider them.

### 1. Firebase Hosting: free, and covers `asia-south1`

The cheapest path to a custom domain with a managed certificate, and it includes a CDN. Firebase Hosting rewrites to Cloud Run cover most regions, `asia-south1` and `asia-southeast1` among them, but the list is not every region, so check yours against [Serve dynamic content with Cloud Run](https://firebase.google.com/docs/hosting/cloud-run) before planning around it.

`firebase.json` is tracked in the repository:

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "run": { "serviceId": "games", "region": "asia-south1" } }]
  }
}
```

`serviceId` is the Cloud Run service name, and `region` is the region it runs in. Hosting config has no variables, so both are literals. **Two cases need an edit, and neither fails loudly:**

- The `CLOUD_RUN_SERVICE` variable names a service other than `games`.
- The service does not run in `asia-south1`.

A rewrite that names a service or region that does not exist returns a bare **404**, not a readable error.

`.firebaserc` and `.firebase/` are not tracked: the first names your GCP project, the second is the CLI's local cache. Pass `--project` instead.

```bash
npx firebase-tools login
npx firebase-tools deploy --only hosting --project my-gcp-project
```

That publishes to `my-gcp-project.web.app`. Check it works there first:

```bash
curl -s https://my-gcp-project.web.app/api/health | jq
```

Then add your own domain: **Firebase console → Hosting → Add custom domain**. It verifies ownership, then prints the records to add at your registrar, a `TXT` record to prove ownership, then `A` records pointing at Firebase.

Add them wherever the domain's DNS lives (Hostinger, Namecheap, Cloudflare). Certificate issuance takes minutes to hours.

```bash
dig +short app.example.com
curl -sI https://app.example.com
```

Next.js sets `Cache-Control: public, max-age=31536000, immutable` on `/_next/static/**`, so those assets cache at the edge. Dynamic pages and route handlers return `no-store` and reach Cloud Run on every request, a CDN cannot change that, whichever one you use.

Good for a single service. It adds a hop, and it is another product to reason about.

**The live room stream through Firebase Hosting.** A Hosting rewrite to Cloud Run has a request limit of 60 seconds, and Hosting can hold a streamed response until it ends. So `GET /api/v1/rooms/{key}/stream` can arrive late or close after a minute. Play still works: the client polls every two seconds and reconnects the stream by itself. For instant updates on a custom domain, use option 2, which does not buffer. The `run.app` address always streams directly.

### 2. Global External Application Load Balancer: the production answer

Works in every region, and it is what you would end up with anyway once you want Cloud CDN, Cloud Armor, a WAF, or several backends behind one domain. A serverless NEG points the load balancer at the Cloud Run service.

```bash
gcloud compute network-endpoint-groups create "$SERVICE-neg" \
  --region "$REGION" \
  --network-endpoint-type=serverless \
  --cloud-run-service="$SERVICE"
```

Then a backend service, a URL map, a managed certificate and a global forwarding rule. Full walkthrough: [Serverless network endpoint groups](https://cloud.google.com/load-balancing/docs/negs/serverless-neg-concepts).

It is not free. Budget roughly **US$18 to 25/month** for the forwarding rule before traffic, confirm against the [pricing calculator](https://cloud.google.com/products/calculator), because this is the one line item that turns a scale-to-zero service into a fixed monthly bill.

A load balancer also **improves** latency independently of your region: TLS terminates at the Google edge nearest the user, and the rest of the trip runs over Google's private backbone rather than the public internet.

### Moving a domain that is already live

Different problem from setting one up. The domain already serves users, and DNS decides which backend answers.

**You cannot run both at once.** A Cloud Run domain mapping on a subdomain is a `CNAME` to `ghs.googlehosted.com`. Firebase Hosting wants `A` records. DNS forbids a `CNAME` and an `A` record on the same hostname, so the switch is a single atomic edit, not a gradual shift.

**There is a gap.** After DNS points at the new backend, its certificate is not issued yet. Minutes usually, hours sometimes. On an HSTS-preloaded TLD such as `.app` or `.dev`, that gap is a hard outage, browsers refuse HTTP outright, so there is no degraded fallback.

Rehearse on a throwaway subdomain, so the only unknown left is propagation:

**1. Lower the TTL, well ahead.** Caches hold the old record for its full TTL. Drop it to 300 the day before, or the cutover drags for hours.

```bash
dig +noall +answer hello.example.com     # shows the current record and TTL
```

**2. Prove the new path on a subdomain nobody uses.** Add `staging.example.com` in the Firebase console, point it at Firebase, and confirm it serves. Nothing about the live domain changes.

```bash
curl -sI https://staging.example.com
```

**3. Verify ownership of the real domain early.** Firebase may ask for a `TXT` record. `TXT` coexists with the live `CNAME`, so add it now and let verification finish before the cutover.

**4. Cut over.** Delete the `CNAME`, add the `A` records Firebase gives you. One edit, at a quiet hour.

**5. Watch the certificate.**

```bash
until curl -sfI "https://hello.example.com" >/dev/null 2>&1; do sleep 30; done; echo "live"
```

**6. Only now delete the old mapping.** Leaving it is harmless, DNS already decided, so there is no reason to remove it before the new path is proven.

```bash
gcloud beta run domain-mappings delete --domain hello.example.com --region asia-southeast1
```

Deleting the mapping first does not speed anything up. It only removes your way back.

### 3. Domain mapping: only where it is supported

```bash
gcloud beta run domain-mappings create \
  --service "$SERVICE" \
  --domain www.example.com \
  --region "$REGION"
```

Add the DNS records it prints. The managed certificate takes up to ~15 minutes to provision.

Simplest and free, but regionally limited, and it gives you no CDN, no WAF and no path-based routing.

---

Whichever you pick, afterwards update the `APP_URL` repository variable and redeploy, so canonical URLs and metadata use the real domain. `NEXT_PUBLIC_APP_URL` is inlined at build time, a Cloud Run env var change alone does nothing.

---

## Making the service private

Remove `--allow-unauthenticated` from the `flags:` in `.github/workflows/deploy.yml`, then grant invoker access explicitly:

```bash
gcloud run services remove-iam-policy-binding "$SERVICE" --region "$REGION" \
  --member="allUsers" --role="roles/run.invoker"

gcloud run services add-iam-policy-binding "$SERVICE" --region "$REGION" \
  --member="serviceAccount:caller@project.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

---

## Monitoring

```bash
# Uptime check against the health endpoint
gcloud monitoring uptime create "$SERVICE-health" \
  --resource-type=uptime-url \
  --resource-labels=host=<service-host>,project_id="$PROJECT_ID" \
  --path=/api/health \
  --period=5
```

Worth alerting on, in priority order: 5xx rate, p95 latency, instance count pinned at `--max-instances` (you are being throttled), and monthly spend against a budget.

---

## Cleanup

```bash
gcloud run services delete "$SERVICE" --region "$REGION"
gcloud artifacts repositories delete "$AR_REPO" --location "$REGION"
gcloud iam workload-identity-pools delete github --location=global
gcloud iam service-accounts delete "$DEPLOYER"
gcloud iam service-accounts delete "$RUNTIME"
```

Google soft-deletes Workload Identity Pools for 30 days, and the name stays reserved. If you recreate one with the same id before then, it fails, undelete it instead:

```bash
gcloud iam workload-identity-pools undelete github --location=global
```
