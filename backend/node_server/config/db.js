import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backend/ -> one level up from node_server/config
const BACKEND_DIR = path.resolve(__dirname, "../..");
const DB_FILE = path.resolve(
  BACKEND_DIR,
  process.env.DB_FILE || path.join("database", "daduru_oya.db")
);
const SCHEMA_FILE = path.join(BACKEND_DIR, "db.sql");

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new Database(DB_FILE);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create the schema on first boot (every statement in db.sql is idempotent)
if (fs.existsSync(SCHEMA_FILE)) {
  db.exec(fs.readFileSync(SCHEMA_FILE, "utf-8"));
}

export default db;
