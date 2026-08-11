import "server-only";
import mysql from "mysql2/promise";

// The CMS's OWN database — a separate MySQL database (its own name) on the same
// server as the webapp for now. It never joins across into the webapp's tables;
// anything it needs from there comes through the Sajtpress client (sajtpress.ts).
// That separation is what lets the CMS be pointed at its own DB elsewhere and
// run standalone.

const globalForDb = globalThis as unknown as { __cmsPool?: mysql.Pool };

export function getPool(): mysql.Pool {
  if (!globalForDb.__cmsPool) {
    globalForDb.__cmsPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "",
      waitForConnections: true,
      connectionLimit: 5,
      charset: "utf8mb4_general_ci",
    });
  }
  return globalForDb.__cmsPool;
}

/** Is the CMS database reachable? Best-effort, for the health check. */
export async function dbHealth(): Promise<boolean> {
  if (!process.env.DB_NAME) return false;
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
