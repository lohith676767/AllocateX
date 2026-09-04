import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// credentials:true + an explicit origin (not '*') is required for the
// browser to send/accept the httpOnly auth cookie across the Vite dev
// server's origin (5173) and this API (4000); in production the client is
// served from this same origin so CORS doesn't apply there anyway.
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'fairfill-server' }));

app.use('/api', router);

// If the client has been built (client/dist exists), serve it from this same
// process so the whole app is a single deployable service — no separate
// static host, no CORS configuration needed in production. In local dev the
// client is served by Vite on :5173 instead and this block is a no-op
// because client/dist won't exist yet.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('Serving built client from', clientDist);
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FairFill server listening on http://localhost:${PORT}`);
});
