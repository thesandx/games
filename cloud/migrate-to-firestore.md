# Migrate to Firestore in asia-south1

This runbook moves a live Playroom deployment from the old setup to the new one, in one pass.

|           | Before                                          | After                                    |
| --------- | ----------------------------------------------- | ---------------------------------------- |
| Rooms API | FastAPI in `anuvia`, at `api.sandeep.app/games` | This app, at `/api/v1`                   |
| Database  | Neon Postgres                                   | Firestore `games-db`, Native mode        |
| Region    | `asia-southeast1` (Singapore)                   | `asia-south1` (Mumbai)                   |
| Domain    | Cloud Run domain mapping, or none               | Firebase Hosting, rewriting to Cloud Run |
| Runs as   | The default compute service account             | `games-runtime`, limited to one database |

The plan accepts downtime. There are no active users, and a room lives two hours at most, so no data moves. Neon holds nothing that the new app reads.

**The names below assume the defaults.** The service is `games` (the repository name), so the database is `games-db` and the runtime account is `games-runtime`. If the `CLOUD_RUN_SERVICE` variable names another service, use that name everywhere, including `serviceId` in `firebase.json`.

---

## 0. Record what exists now

Keep this output. It is your way back until step 7.

```bash
export PROJECT=my-gcp-project

gcloud run services list --project "$PROJECT" --format='table(metadata.name,region,status.url)'
gcloud beta run domain-mappings list --project "$PROJECT" --region asia-southeast1
gcloud firestore databases list --project "$PROJECT" --format='table(name,locationId,type)'
gh variable list
gh secret list
```

---

## 1. Correct the GitHub variables

**Do this before you merge.** A repository variable overrides the workflow default. An old value silently deploys the new code to the old place.

```bash
gh variable set GCP_REGION --body "asia-south1"

# The old build called the anuvia service. The new defaults are right, so remove both.
gh variable delete PLAYROOM_API_URL
gh variable delete PLAYROOM_TRANSPORT

# The domain is not in front of the new service yet. Remove it until step 6.
gh variable delete APP_URL
```

`gh variable delete` fails for a variable that does not exist. That is correct: skip it.

---

## 2. Run bootstrap in the new region

```bash
./scripts/gcp-bootstrap.sh \
  --project "$PROJECT" \
  --region asia-south1 \
  --repo thesandx/games \
  --service games
```

It is idempotent. On this project it:

- creates the Artifact Registry repository in `asia-south1`;
- creates the Firestore database `games-db` in `asia-south1`, with point-in-time recovery and daily backups;
- grants `games-runtime` access to `games-db` only, under an IAM condition;
- grants the deployer the right to publish indexes, TTL policies and rules;
- widens an old repository-pinned Workload Identity provider to the owner, if it finds one. See ADR-0007.

**Check the region in the confirmation prompt.** A Firestore location is permanent.

Then set the variables it prints:

```bash
gh variable set APP_SLUG                --body "games"
gh variable set FIRESTORE_DATABASE_ID   --body "games-db"
gh variable set RUNTIME_SERVICE_ACCOUNT --body "games-runtime@${PROJECT}.iam.gserviceaccount.com"
```

---

## 3. Merge, and let the pipeline deploy

Merge the pull request. `deploy.yml` then:

1. publishes `firestore.rules`, the index exemptions and the TTL policy on `rooms.expireAt`;
2. builds the image with `NEXT_PUBLIC_PLAYROOM_TRANSPORT=remote` and `NEXT_PUBLIC_PLAYROOM_API_URL=/api/v1`;
3. deploys a **new** service `games` in `asia-south1`, as `games-runtime`;
4. probes `/api/health`.

The old service in `asia-southeast1` keeps running. It is a separate service in another region, and nothing here touches it.

If step 1 of the pipeline fails with `Firestore database 'games-db' does not exist`, bootstrap did not finish. Run step 2 again.

---

## 4. Verify the new service on its own URL

```bash
URL=$(gcloud run services describe games --project "$PROJECT" --region asia-south1 --format='value(status.url)')

curl -s "$URL/api/health" | jq          # region must be asia-south1
API="$URL/api/v1" pnpm check:rooms-api  # 24 checks against real Firestore

gcloud run services describe games --project "$PROJECT" --region asia-south1 \
  --format='value(spec.template.spec.serviceAccountName)'   # must be games-runtime@...
```

**A green health probe does not prove Firestore works.** `/api/health` does not touch it on purpose. `pnpm check:rooms-api` does.

Then play one real game on two devices, not two tabs, on `$URL`. There must be no "Preview mode" banner. The banner means the build is `local`: go back to step 1.

---

## 5. Put Firebase Hosting in front

Cloud Run domain mapping does not exist in `asia-south1`. Firebase Hosting rewrites the domain to the service instead. It is free and adds a CDN.

**a. Add Firebase to the same project.** Open [console.firebase.google.com](https://console.firebase.google.com/), select **Add project**, and pick `$PROJECT` from the list. Do not create a new project. Google Analytics is optional.

**b. Check `firebase.json`.** `serviceId` must be `games` and `region` must be `asia-south1`. A wrong value returns a bare `404`.

**c. Publish the rewrite.**

```bash
npx firebase-tools login
npx firebase-tools deploy --only hosting --project "$PROJECT"
```

**d. Verify on the `web.app` address before you touch DNS.**

```bash
curl -s "https://${PROJECT}.web.app/api/health" | jq
API="https://${PROJECT}.web.app/api/v1" pnpm check:rooms-api
```

Play one game through `https://${PROJECT}.web.app`. The live stream is slower behind Hosting: see [the stream behind Hosting](#the-stream-behind-hosting).

---

## 6. Move the domain

Downtime is acceptable, so this order is the simplest one. It takes the domain off the old service first.

1. **Lower the TTL** of the domain's DNS records to 300 seconds. Wait for the old TTL to run out. Otherwise Firebase reads a cached record and verification fails with an ACME challenge `404`.
2. **Delete the old domain mapping**, if step 0 listed one:

   ```bash
   gcloud beta run domain-mappings delete --domain games.example.com \
     --project "$PROJECT" --region asia-southeast1
   ```

3. **Add the domain in Firebase**: Hosting, then **Add custom domain**. Firebase prints the records.
4. **Replace the DNS records** at the registrar with the Firebase records. A Cloud Run mapping used a `CNAME` to `ghs.googlehosted.com`, or `A` records. Remove those. DNS cannot hold a `CNAME` and other records on one name.
5. **Wait for the certificate.** Minutes to hours.

On `.app` and `.dev` domains, such as `sandeep.app`, the time between the DNS change and the certificate is a hard outage. Browsers refuse plain HTTP on those domains. That is acceptable here, and it ends when the certificate issues.

```bash
dig +short games.example.com
curl -sI https://games.example.com/api/health
```

Then build the domain into the app:

```bash
gh variable set APP_URL --body "https://games.example.com"
gh workflow run deploy.yml -f reason="Inline the custom domain"
```

---

## 7. Retire the old setup

Do this only after step 6 works. Until then, the old service is your way back.

```bash
# The old Cloud Run service
gcloud run services delete games --project "$PROJECT" --region asia-southeast1

# Old images, in the old region. The repository can be shared with other
# apps in the project, so list what it holds first.
gcloud artifacts docker images list \
  "asia-southeast1-docker.pkg.dev/${PROJECT}/containers" --format='value(package)' | sort -u
```

If the list shows only `games` images, delete the repository:

```bash
gcloud artifacts repositories delete containers --project "$PROJECT" --location asia-southeast1
```

If other apps use it, delete only the `games` package:

```bash
gcloud artifacts docker images delete \
  "asia-southeast1-docker.pkg.dev/${PROJECT}/containers/games" --delete-tags
```

Outside this repository:

- **The `playroom` app in `anuvia`.** Nothing calls it now. Remove it, or at least its route at `api.sandeep.app/games`.
- **The Neon database.** It holds expired rooms and analytics events only. Export it first if you want the old events, then delete it.

---

## Rolling back

| After step | To go back                                                                              |
| ---------- | --------------------------------------------------------------------------------------- |
| 3 or 4     | Nothing to undo for users. The old service still serves the old domain.                 |
| 6          | Put the old DNS records back, and create the domain mapping again in `asia-southeast1`. |
| 7          | There is no way back. Deploy again from the old commit to recreate the old service.     |

---

## The stream behind Hosting

Behind Firebase Hosting, a request to Cloud Run has a 60-second limit, and Hosting can hold a streamed response until it ends. So the live room stream arrives late or closes after a minute. Play still works: the client polls every two seconds and connects the stream again by itself. Moves then show up within about two seconds, not at once.

For instant updates on the domain, put a Global External Application Load Balancer in front instead. It costs about US$18 to 25 a month. See [`cloud/deployment.md`](./deployment.md#custom-domain).
