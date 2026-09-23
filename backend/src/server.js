import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "./app.js";
import { PORT } from "./config.js";

const app = createApp();
const server = http.createServer(app);

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`AI usage backend running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  startServer();
}
