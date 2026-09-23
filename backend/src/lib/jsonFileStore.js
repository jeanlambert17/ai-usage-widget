import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Minimal file-backed JSON store. Generic on purpose — any feature that
// needs simple local persistence (accounts today, others later) can create
// one of these instead of reaching for fs directly.
export function createJsonFileStore(filePath, defaultValue = []) {
  const dir = path.dirname(filePath);

  async function ensure() {
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    if (!existsSync(filePath)) {
      await writeFile(filePath, JSON.stringify(defaultValue), "utf8");
    }
  }

  return {
    async read() {
      await ensure();
      try {
        return JSON.parse(await readFile(filePath, "utf8"));
      } catch {
        return structuredClone(defaultValue);
      }
    },
    async write(data) {
      await ensure();
      await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    },
  };
}
