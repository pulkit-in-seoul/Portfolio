# Contact form email setup with Resend

The contact form sends mail through the Resend API from the Node server. Resend credentials stay on the server and must never use a `VITE_` variable.

1. In Resend, create an API key and verify the domain you plan to send from.
2. Copy `.env.example` to `.env` and set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and optionally `CONTACT_EMAIL`. `RESEND_FROM_EMAIL` must be an address on a domain verified with Resend, for example `Portfolio Contact <contact@yourdomain.com>`. `.env` is ignored by Git.
3. Run `npm run dev`. The Vite development server proxies `/api/contact` to the mail server.
4. Submit the contact form. It only reports success after Resend accepts the message.

For production on Render, create a **Web Service** (not a Static Site) from this repository. Use `npm ci && npm run build` as the build command and `npm start` as the start command. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and optionally `CONTACT_EMAIL` as private environment variables in the service settings. The server serves the built site and `/api/contact` together. A static-only host cannot run this mail endpoint and may return the site HTML instead of the API response.

The server sends `index.html` with `Cache-Control: no-store` so a deployment cannot leave the browser pointing at removed asset hashes. Fingerprinted files under `/assets/` are safe to cache immutably. After changing hosting settings or environment variables, redeploy and hard-refresh the site.
