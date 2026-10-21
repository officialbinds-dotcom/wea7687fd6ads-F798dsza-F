# Vulture5x — Cloudflare Worker Website

This repository contains the Vulture5x website and a Cloudflare Worker that serves the site and proxies the Twitch statistics endpoints.

Project files (`wrangler.jsonc`, `worker.js`, `package.json`, `public/`) must be directly at the **repository root**. The Wrangler configuration explicitly points static assets to `./public`. The deployment command now explicitly loads `./wrangler.jsonc` to avoid Wrangler guessing the project configuration.

## Open in Visual Studio Code

1. Extract this project or clone your GitHub repository.
2. Open this folder (the one that contains `wrangler.jsonc` and `public/`) in Visual Studio Code.
3. Install Node.js (LTS) from https://nodejs.org/.
4. In VS Code, open **Terminal → New Terminal** and run:

   ```bash
   npm install
   npx wrangler login
   npm run dev
   ```

5. Open the local URL printed by Wrangler (usually `http://localhost:8787`).

You can also open **Terminal → Run Task…** and choose a task beginning with **Vulture5x:**.

## Push to GitHub

1. Create a new, empty repository on GitHub.
2. Upload these project files to the repository root, or run the following from this folder after creating the repository:

   ```bash
   git init
   git add .
   git commit -m "Add Vulture5x website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

   Replace the example GitHub URL with your own repository URL.

## Automatic GitHub → Cloudflare deployment

The included workflow at `.github/workflows/deploy-cloudflare.yml` deploys the Worker whenever you push to `main`, and can also be run manually from GitHub Actions.

In your GitHub repository, open **Settings → Secrets and variables → Actions** and add these repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with permission to deploy Workers.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.

Then push to `main`, or open **Actions → Deploy Vulture5x to Cloudflare Workers → Run workflow**.

For a first deployment, you can instead deploy from VS Code's terminal:

```bash
npm install
npx wrangler login
npm run deploy
```

## Connect your Namecheap domain

1. Deploy the Worker first.
2. Add your custom domain in the Cloudflare dashboard under **Workers & Pages → your Worker → Settings / Domains & Routes** (the exact labels can vary).
3. Follow Cloudflare's instructions to connect the domain. If Cloudflare asks you to move DNS management to Cloudflare, follow its nameserver instructions at Namecheap.
4. Add both the apex domain and `www` if you want both to work.
5. Update the Twitch embed's allowed parent domains in `public/index.html` to match the exact domain(s) you use. Twitch embeds require the correct `parent` hostname.

## Important: GitHub Pages is different

This project is **GitHub-repository compatible** and can use GitHub Actions to deploy to Cloudflare. It is **not a drop-in GitHub Pages site**: GitHub Pages only serves static files and cannot run the `worker.js` API proxy. The website's Twitch-stat endpoints rely on that Worker. To host on GitHub Pages instead, the API integration would need to be redesigned (for example, using a separate hosted API/Worker).

## Project files

- `public/index.html` — website front end.
- `worker.js` — serves API proxy routes for Twitch statistics and serves static assets.
- `wrangler.jsonc` — Cloudflare Worker and static asset configuration.
- `package.json` — local development and deployment commands.
- `.vscode/` — useful VS Code tasks and recommended extensions.
- `.github/workflows/deploy-cloudflare.yml` — optional automated deployment from GitHub.

## Notes

- This package does not deploy itself: you must sign in to your own Cloudflare account and configure your domain.
- Third-party Twitch statistic services and external CDN assets must remain available for those features to work.
- Never commit Cloudflare API tokens or other secrets to GitHub.


## Cloudflare dashboard build settings

For Workers Builds connected to this repository, set the root directory to the repository root (shown as `/` in some dashboard views) and use `npx wrangler deploy --config ./wrangler.jsonc` as the deploy command. Do not set the root directory to `public`, because `worker.js` and `wrangler.jsonc` are at the repository root. If the build still reports that it cannot detect static files, confirm that these files and the `public/` folder are committed to the same GitHub branch Cloudflare is building.
