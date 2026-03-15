import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

// Lock port to 5002
process.env.PORT = "5002";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

async function main() {
  const app = express();
  const httpServer = createServer(app);

  // Helmet is disabled for now to simplify debugging

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // API routes
  await registerRoutes(httpServer, app);

  // Frontend serving (Vite or static)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Final error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  // Start the server
  const port = parseInt(process.env.PORT || "5002", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
