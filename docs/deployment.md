# Deployment — local Docker (test) and Google Cloud Run (production)

The app is a single small container: Node 22 + the app files, **no npm dependencies**, about 260 MB including the base image. It listens on `$PORT` (8080), exposes `/healthz`, and saves the show state to `$STATE_FILE` so a restart resumes the show where it stopped.

| Setting | Meaning | Local default | Cloud Run |
|---|---|---|---|
| `HOST_PIN` | PIN for `/host` and the screen controls | empty = no PIN | from Secret Manager (`jezisek-host-pin`) |
| `PUBLIC_URL` | Address encoded in the QR code | auto (the address the screen is opened with) | auto = the `*.run.app` URL; set it only for a custom domain |
| `STATE_FILE` | Where the show state is persisted | Docker volume `jezisek-data` | in-memory disk, or a GCS bucket with `STATE_BUCKET` |
| `PORT` | Listening port | 8080 | set by Cloud Run |

---

## 1. Local Docker (testing & rehearsal)

Requirements: Docker Desktop (or Docker Engine with the compose plugin).

```bash
cp .env.example .env          # optional: set HOST_PIN, PUBLIC_URL
docker compose up --build -d  # or: npm run docker:up
```

| Open | |
|---|---|
| http://localhost:8080/screen | big screen (click once for sound, F = fullscreen; add `?pin=…` if you set a PIN) |
| http://localhost:8080/host | presenter panel |
| http://localhost:8080/map | story map & all paths |

**Testing with real phones on the same Wi-Fi:** find your computer's IP address (e.g. `192.168.1.23`), set `PUBLIC_URL=http://192.168.1.23:8080/` in `.env`, run `docker compose up -d` again, and the QR code will point there. Your firewall must allow port 8080. Alternatively, open the screen itself via `http://192.168.1.23:8080/screen` and the QR code follows automatically.

Useful commands:

```bash
docker compose logs -f        # live logs (npm run docker:logs)
docker compose restart        # simulates a crash: the show resumes paused at the same point
docker compose down           # stop (state is kept in the jezisek-data volume)
docker compose down -v        # stop and wipe the saved state
```

Automated rehearsal against the running container (restarts the show!):

```bash
node scripts/e2e.mjs alarm,ai,book,sleigh --url http://localhost:8080 --pin <PIN>
```

---

## 2. Google Cloud Run (production)

### One-time prerequisites

- A Google Cloud project with billing, and the `gcloud` CLI logged in (`gcloud auth login`).
- Permission to deploy Cloud Run services, create secrets, and (optionally) a storage bucket.
- If your organisation enforces *Domain Restricted Sharing*, public (`allUsers`) access is blocked. Ask your GCP admins for an exception for this service, because phones must reach it without logging in.

### Deploy

```bash
PROJECT=<your-project-id> REGION=europe-west3 STATE_BUCKET=<project>-jezisek-state ./deploy/cloud-run-deploy.sh
```

The script:
1. enables Cloud Run, Cloud Build, Artifact Registry and Secret Manager;
2. asks for the **host PIN** once and stores it in Secret Manager (`jezisek-host-pin`);
3. (with `STATE_BUCKET`) creates a bucket and mounts it at `/app/data`, so the show state survives an instance replacement;
4. builds the `Dockerfile` with Cloud Build and deploys the service;
5. prints the URLs and checks `/healthz`.

Re-run the same command to deploy a new version (e.g. after editing a line of dialogue).

### Why these Cloud Run settings (do not change them for the event)

| Flag | Reason |
|---|---|
| `--max-instances 1` | All votes and the show state live in **one** process. Two instances would split the audience. |
| `--min-instances 1` | No cold start; the instance stays warm with the state in memory. |
| `--concurrency 1000` | Every phone, screen and host panel keeps one live connection (Server-Sent Events). The default of 80 would block most of a 400-person audience. |
| `--timeout 3600` | Live connections may stay open for up to 60 minutes. After that they reconnect automatically in ~2 s, which nobody notices. |
| `--no-cpu-throttling` | Keeps background timers (heartbeats, vote broadcasts) running between requests. |
| `--session-affinity` | Harmless with one instance; keeps connections sticky. |
| `--cpu 1 --memory 512Mi` | Plenty: 400 connections use very little. |

**Region:** `europe-west3` (Frankfurt) or `europe-central2` (Warsaw) are closest to Prague.

**Cost:** an always-on 1 vCPU / 512 MiB instance costs roughly 1–2 USD per day (check current Cloud Run pricing for your region). After the event, scale it down:

```bash
gcloud run services update jezisek-404 --region europe-west3 --min-instances 0
# or remove everything:
gcloud run services delete jezisek-404 --region europe-west3
```

### Custom (short) domain for the QR code

`*.run.app` URLs are long. They work fine in a QR code, but if you want a short address to show on screen (e.g. `xmas.yourcompany.com`), map a domain to the service (Cloud Run domain mapping or a load balancer) and redeploy with `PUBLIC_URL=https://xmas.yourcompany.com/`.

### Smoke test after deploying

```bash
curl https://<service-url>/healthz
node scripts/e2e.mjs alarm,ai,book,sleigh --url https://<service-url> --pin <PIN>   # NOT during the event
```

Then open `/host` (enter the PIN) and press **Restart show** to return to the lobby.

### What if the instance restarts during the show?

Cloud Run may occasionally replace an instance. Screens and phones reconnect automatically. With `STATE_BUCKET` set, the show resumes **paused** at the current scene: press **Resume** in the host panel. Votes cast in an open voting round at that moment are lost; re-open the vote or pick A/B by hand. Without a bucket, the show restarts from the lobby. Use the host panel's *Rehearsal → Jump* to return to where you were (choose the earlier decisions, then the scene).
