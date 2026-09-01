import type { IncomingMessage, ServerResponse } from "node:http";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function putFileMiddleware(outPath: string) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method !== "PUT") {
      next();
      return;
    }
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      writeFileSync(outPath, body);
      res.statusCode = 204;
      res.end();
    });
  };
}

function saveResumeFiles(): Plugin {
  const mdPath = fileURLToPath(new URL("./resume.md", import.meta.url));
  return {
    name: "save-resume-files",
    configureServer(server) {
      server.middlewares.use("/resume.md", putFileMiddleware(mdPath));
    },
  };
}

export default defineConfig({
  plugins: [react(), saveResumeFiles()],
});
