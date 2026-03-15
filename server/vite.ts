import { type Express, static as expressStatic } from "express";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";
import fs from "fs";
import path from "path";

export async function setupVite(server: Server, app: Express) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Suppress the devtools request to reduce console noise
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
    res.status(204).end();
  });

  app.use(vite.middlewares);

  // SPA fallback using correct path and syntax
  app.use('/{*path}', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      // Correct path to index.html as diagnosed
      const clientTemplate = path.resolve(
        import.meta.dirname,
        '..',
        'client',
        'index.html'
      );
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
