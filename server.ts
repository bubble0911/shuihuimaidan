import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/predict", (req, res) => {
    const features = req.body.features;
    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ error: "Invalid features format" });
    }

    // Call python script for prediction
    // Pass features as JSON string argument
    const featuresStr = JSON.stringify(features);
    exec(`python3 ml_logic.py predict '${featuresStr}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        return res.status(500).json({ error: "Prediction service error" });
      }
      try {
        const result = JSON.parse(stdout.trim());
        res.json(result);
      } catch (e) {
        console.error(`Parse error: ${e}. Stdout: ${stdout}`);
        res.status(500).json({ error: "Failed to parse prediction result" });
      }
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", python_version: "3.10" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
