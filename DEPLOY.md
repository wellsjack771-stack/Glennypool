# Put the pool on the internet (GitLab + Railway)

You need: **GitLab** (holds the code) and **Railway** (runs the website). Use Railway’s **Trial** ($5 credit). Do not pick Railway Free ($1) or Hobby ($5/mo) unless you want to keep paying.

GitLab’s website **cannot upload a whole project folder**. Push from this Mac instead.

## 1. Create an empty GitLab project

1. Open [gitlab.com](https://gitlab.com) and sign in.
2. **New project → Create blank project**.
3. Project name: `gaapp`.
4. Visibility: **Private**.
5. **Uncheck** “Initialize repository with a README” (leave it empty).
6. Create project. Copy the HTTPS URL (looks like `https://gitlab.com/YOUR-USERNAME/gaapp.git`).

## 2. Push this folder from the Mac

On this computer, install Apple’s command line tools once (needed for `git`):

1. Open **Terminal**.
2. Run: `xcode-select --install`
3. Click **Install** and wait until it finishes.

Then tell Cursor “push to GitLab” and paste your project URL — or run these in Terminal from `/Users/jackw/gaapp`:

```bash
cd /Users/jackw/gaapp
git init
git add .
git commit -m "Club championship pool"
git branch -M main
git remote add origin https://gitlab.com/YOUR-USERNAME/gaapp.git
git push -u origin main
```

Sign in when GitLab asks (username + personal access token if it wants a password).

## 3. Railway

1. Open [railway.app](https://railway.app).
2. Sign up / log in. Prefer **Login with GitLab** if shown; otherwise any login, then connect GitLab under account integrations.
3. Choose **Trial**.
4. **New Project → Deploy from GitLab repo** → pick `gaapp`.
5. Wait for the first deploy (~2–3 minutes).
6. Service → **Variables** → add:
   - `DATA_DIR` = `/data`
7. **Settings → Volumes → Add Volume**
   - Mount path: `/data`
8. **Settings → Networking → Generate Domain**  
   That HTTPS link is the public site.

## 4. Copy your pool data

Upload `/Users/jackw/gaapp/data/pool.json` to the Railway volume as `/data/pool.json`, then redeploy.

Or open the live URL and set the pool up again (PIN, Golf Genius, handicaps).

## 5. Send the link

- Enter: `https://YOUR-URL/enter`
- Board: `https://YOUR-URL/`
- Admin: `https://YOUR-URL/admin/login`

## After the championship

Delete or stop the Railway project so the trial credit is not wasted.
