import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

async function fetchProxy(
  upstream: string,
  req: any,
  res: any,
  headers: Record<string, string>
) {
  try {
    const upstreamRes = await fetch(upstream, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });
    const text = await upstreamRes.text();
    res.status(upstreamRes.status);
    res.setHeader(
      "Content-Type",
      upstreamRes.headers.get("Content-Type") || "application/json"
    );
    res.send(text);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Proxy error" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── AI proxy routes (mirrors Vercel /api/* serverless functions) ──

  // Groq
  app.post("/api/groq", async (req, res) => {
    const apiKey = (
      process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || ""
    ).trim();
    if (!apiKey) {
      return res.status(400).json({ error: "Missing Groq API key on server" });
    }
    await fetchProxy(
      "https://api.groq.com/openai/v1/chat/completions",
      req,
      res,
      { Authorization: `Bearer ${apiKey}` }
    );
  });

  // OpenRouter
  app.post("/api/openrouter", async (req, res) => {
    const apiKey = (
      process.env.VITE_OPENROUTER_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      ""
    ).trim();
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: "Missing OpenRouter API key on server" });
    }
    const siteUrl =
      process.env.VITE_SITE_URL ||
      process.env.SITE_URL ||
      "https://esoterica-os.vercel.app";
    await fetchProxy(
      "https://openrouter.ai/api/v1/chat/completions",
      req,
      res,
      {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": siteUrl,
        "X-Title": "Esoterica OS",
      }
    );
  });

  // DeepSeek
  app.post("/api/deepseek", async (req, res) => {
    const apiKey = (
      process.env.VITE_DEEPSEEK_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      ""
    ).trim();
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: "Missing DeepSeek API key on server" });
    }
    await fetchProxy(
      "https://api.deepseek.com/chat/completions",
      req,
      res,
      { Authorization: `Bearer ${apiKey}` }
    );
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
