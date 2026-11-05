import 'dotenv/config';
import express from 'express';
import { Resend } from 'resend';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3001;
const apiOnly = process.argv.includes('--api-only');
const projectDirectory = fileURLToPath(new URL('.', import.meta.url));
const frontendOrigin = process.env.FRONTEND_ORIGIN?.replace(/\/+$/, '');
const requestsByIp = new Map();
const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitMaxRequests = 5;

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

app.disable('x-powered-by');
app.use('/api', (req, res, next) => {
  const origin = req.get('origin');

  if (origin && frontendOrigin && origin !== frontendOrigin) {
    return res.status(403).json({ error: 'This website is not allowed to use the contact API.' });
  }

  if (origin && frontendOrigin) {
    res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    if (!frontendOrigin || origin !== frontendOrigin) {
      return res.status(403).json({ error: 'Cross-origin contact requests are not configured.' });
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  return next();
});
app.use(express.json({ limit: '10kb' }));

app.post('/api/contact', async (req, res) => {
  const now = Date.now();
  const clientIp = req.ip || 'unknown';
  const previousRequests = (requestsByIp.get(clientIp) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs
  );

  if (previousRequests.length >= rateLimitMaxRequests) {
    return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  }

  previousRequests.push(now);
  requestsByIp.set(clientIp, previousRequests);

  const { fullName, email, subject, message } = req.body || {};
  const isText = (value) => typeof value === 'string';

  if (
    !isText(fullName) ||
    fullName.trim().length < 2 ||
    fullName.trim().length > 100 ||
    !isText(email) ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    !isText(subject) ||
    subject.trim().length < 3 ||
    subject.trim().length > 150 ||
    !isText(message) ||
    message.trim().length < 10 ||
    message.trim().length > 5000
  ) {
    return res.status(400).json({ error: 'Please check the form fields and try again.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const senderAddress = process.env.RESEND_FROM_EMAIL;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!resendApiKey || !senderAddress || !contactEmail) {
    console.error('Contact email delivery is missing RESEND_API_KEY, RESEND_FROM_EMAIL, or CONTACT_EMAIL.');
    return res.status(503).json({ error: 'Email delivery is not configured on the server yet.' });
  }

  try {
    const resend = new Resend(resendApiKey);

    const safeName = escapeHtml(fullName.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeSubject = escapeHtml(subject.trim());
    const safeMessage = escapeHtml(message.trim());

    const { data, error } = await resend.emails.send({
      from: senderAddress,
      to: contactEmail,
      replyTo: email.trim(),
      subject: `Portfolio contact: ${subject.trim().replace(/[\r\n]+/g, ' ')}`,
      text: [
        `Name: ${fullName.trim()}`,
        `Email: ${email.trim()}`,
        `Subject: ${subject.trim()}`,
        '',
        message.trim(),
      ].join('\n'),
      html: `
        <div style="margin:0;padding:32px 12px;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;border-collapse:separate;border-spacing:0;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background-color:#0a0e17;border-bottom:4px solid #0d9488;">
                <p style="margin:0 0 8px;color:#2dd4bf;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Portfolio contact</p>
                <h1 style="margin:0;color:#f8fafc;font-size:24px;line-height:1.3;">New message received</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Someone got in touch through your website.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 12px;">
                <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">From</p>
                <p style="margin:0;color:#0f172a;font-size:20px;font-weight:bold;line-height:1.4;">${safeName}</p>
                <p style="margin:5px 0 0;font-size:14px;"><a href="mailto:${safeEmail}" style="color:#0d9488;text-decoration:none;">${safeEmail}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 24px;">
                <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Subject</p>
                <p style="margin:0;color:#0f172a;font-size:16px;line-height:1.5;">${safeSubject}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Message</p>
                <div style="padding:18px 20px;background-color:#f8fafc;border-left:3px solid #0d9488;border-radius:4px;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;">${safeMessage}</div>
                <p style="margin:24px 0 0;">
                  <a href="mailto:${safeEmail}?subject=${encodeURIComponent(`Re: ${subject.trim()}`)}" style="display:inline-block;padding:12px 20px;background-color:#0d9488;border-radius:8px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Reply to ${safeName}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6;">
                This message was sent from the contact form on Pulkit Mittal's portfolio.
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    if (error || !data?.id) {
      console.error('Contact email delivery failed:', error || 'Resend returned no email ID.');
      return res.status(502).json({ error: 'We could not send your message. Please try again later.' });
    }

    return res.status(200).json({ message: 'Your message was sent successfully.' });
  } catch (error) {
    console.error('Contact email delivery failed:', error);
    return res.status(502).json({ error: 'We could not send your message. Please try again later.' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Contact API endpoint not found.' }));

app.use((error, _req, res, _next) => {
  console.error('Contact API request failed:', error?.message || 'Unknown request error.');
  const status = error.status === 413 ? 413 : 400;
  return res.status(status).json({
    error: status === 413 ? 'The submitted form is too large.' : 'Invalid request. Please try again.',
  });
});

if (!apiOnly) {
  const distDirectory = resolve(projectDirectory, 'dist');
  const assetsDirectory = resolve(distDirectory, 'assets') + sep;

  app.use(
    express.static(distDirectory, {
      setHeaders(res, filePath) {
        if (filePath === resolve(distDirectory, 'index.html')) {
          res.setHeader('Cache-Control', 'no-store');
        } else if (filePath.startsWith(assetsDirectory)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  app.use('/assets', (_req, res) => res.status(404).type('text/plain').send('Asset not found.'));
  app.get(/.*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(resolve(distDirectory, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Contact server listening on port ${port}`);
});
