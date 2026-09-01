import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function saveResumeJson(): Plugin {
  const outPath = fileURLToPath(new URL("./resume.json", import.meta.url));
  return {
    name: "save-resume-json",
    configureServer(server) {
      server.middlewares.use("/api/save-resume", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          writeFileSync(outPath, body);
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), saveResumeJson()],
});
