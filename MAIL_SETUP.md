# Contact form email setup with Resend

The contact form sends mail through the Resend API from the Node server. Resend credentials stay on the server and must never use a `VITE_` variable.

1. In Resend, create an API key and verify the domain you plan to send from.
2. Copy `.env.example` to `.env` and set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_EMAIL`. `RESEND_FROM_EMAIL` must be an address on a domain verified with Resend, for example `Portfolio Contact <contact@yourdomain.com>`. Resend restricts sending to verified sender domains; `CONTACT_EMAIL` is the inbox that receives form submissions. `.env` is ignored by Git. `EMAIL`, `EMAIL_PASS`, `RESEND_FORM`, and `MAIL_PROVIDER` are not read by this project.
3. Run `npm run dev`. The Vite development server proxies `/api/contact` to the mail server.
4. Submit the contact form. It only reports success after Resend accepts the message.

For production on Render, create a **Web Service** (not a Static Site) from this repository. Use `npm ci && npm run build` as the build command and `npm start` as the start command. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_EMAIL` as private environment variables in the service settings. If the frontend is served by this same service, leave `VITE_API_URL` and `FRONTEND_ORIGIN` unset: the form posts to the same-origin `/api/contact` endpoint. If the frontend is hosted separately, set `VITE_API_URL` to the backend's public base URL at frontend build time (for example, `https://your-render-service.onrender.com`). Cross-origin requests are permitted by default; optionally set the backend's `FRONTEND_ORIGIN` to the frontend's exact public origin (for example, `https://your-portfolio.example`, with no path) to restrict access to that frontend. Rebuild/redeploy the frontend after changing `VITE_API_URL`, then redeploy the backend after changing `FRONTEND_ORIGIN`.

A static-only host cannot run this mail endpoint and may return the site HTML instead of the API response. Never put `RESEND_API_KEY` or other server credentials in a `VITE_` variable. `RESEND_FROM_EMAIL` must use a sender address on a domain verified in Resend; the Resend onboarding sender is limited to its documented testing restrictions.

The server sends `index.html` with `Cache-Control: no-store` so a deployment cannot leave the browser pointing at removed asset hashes. Fingerprinted files under `/assets/` are safe to cache immutably. After changing hosting settings or environment variables, redeploy and hard-refresh the site.
