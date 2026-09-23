import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, ".."); // backend/

export const PORT = Number(process.env.PORT) || 4173;
export const DATA_DIR = process.env.DATA_DIR || path.join(BACKEND_ROOT, "data");
export const FRONTEND_DIST =
  process.env.FRONTEND_DIST || path.resolve(BACKEND_ROOT, "..", "frontend", "dist");
