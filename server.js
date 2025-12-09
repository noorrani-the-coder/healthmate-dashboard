import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// CORS MIDDLEWARE
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// SERVE REACT BUILD
app.use(express.static(join(__dirname, "dist")));

// ⭐ FIXED BACKEND URL (NO ENV!)
const backendUrl = "https://healthmatebackend-875662263.development.catalystserverless.com";

// ⭐ FIXED PROXY (ALWAYS FORWARD TO /healthmate)
app.use(
  "/api",
  createProxyMiddleware({
    target: backendUrl,
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      "^/api": "/healthmate", // << ALWAYS ADD /healthmate
    },
    logLevel: "debug",

    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy] ${req.method} ${req.url} -> ${backendUrl}/healthmate`);
    },

    onProxyRes: (proxyRes) => {
      proxyRes.headers["Access-Control-Allow-Origin"] = "*";
      proxyRes.headers["Access-Control-Allow-Methods"] =
        "GET, POST, PUT, DELETE, OPTIONS";
      proxyRes.headers["Access-Control-Allow-Headers"] =
        "Content-Type, Authorization";
    },
  })
);

// SPA FALLBACK
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Backend: ${backendUrl}/healthmate`);
  console.log(`🔗 Proxy: /api → ${backendUrl}/healthmate`);
});
