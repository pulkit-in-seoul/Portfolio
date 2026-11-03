# Contact form email setup

The contact form sends mail through Gmail SMTP on the Node server. Gmail credentials are only read by the server and must never use a `VITE_` variable.

1. Revoke the Gmail app password shared in chat.
2. Enable 2-Step Verification on the Gmail account, then create a new app password from Google Account security settings.
3. Copy `.env.example` to `.env` and set `EMAIL`, `EMAIL_PASS`, and optionally `CONTACT_EMAIL`. Enter the new app password without spaces. `.env` is ignored by Git.
4. Run `npm run dev`. The Vite development server proxies `/api/contact` to the mail server.
5. Submit the contact form. It only reports success after Gmail accepts the message.

For production on Render, create a **Web Service** (not a Static Site) from this repository. Use `npm ci && npm run build` as the build command and `npm start` as the start command. Set `EMAIL`, `EMAIL_PASS`, and optionally `CONTACT_EMAIL` as private environment variables in the service settings. The server serves the built site and `/api/contact` together. A static-only host cannot run this mail endpoint and may return the site HTML instead of the API response.

The server sends `index.html` with `Cache-Control: no-store` so a deployment cannot leave the browser pointing at removed asset hashes. Fingerprinted files under `/assets/` are safe to cache immutably. After changing hosting settings or environment variables, redeploy and hard-refresh the site.
