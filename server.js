import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CORS middleware for all requests (in case backend needs it)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// API proxy middleware (for production API calls)
// Get the backend URL - can be from env var or default
const backendUrl = process.env.VITE_API_ENDPOINT || 'https://healthmatebackend-875662263.development.catalystserverless.com';

app.use('/api', createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/api': '',  // Remove /api prefix, keeping the /healthmate path
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.url} -> ${backendUrl}${req.url.replace('/api', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to proxy response (server-to-server, but good practice)
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  },
}));

// Handle React Router - serve index.html for all routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Backend URL: ${backendUrl}`);
  console.log(`🔗 API Proxy: /api -> ${backendUrl}/healthmate`);
});

