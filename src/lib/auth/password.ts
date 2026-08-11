import { scrypt, randomBytes, timingSafeEqual, type ScryptOptions } from "crypto";

// Password hashing with Node's built-in scrypt — a memory-hard KDF that needs
// no native module, so it survives the shared-host build/deploy. Deliberately
// not bcrypt/argon2 (native builds the cPanel host can't compile). Stored format
// is self-describing so the cost parameters can change later without breaking
// existing hashes:  scrypt$N$r$p$saltB64$hashB64
//
// Pure crypto, no DB — unit-tested.

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => (err ? reject(err) : resolve(derivedKey)));
  });
}

const N = 16384; // CPU/memory cost (~16MB per hash at r=8)
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scryptAsync(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM })) as Buffer;
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64");
    expected = Buffer.from(parts[5], "base64");
  } catch {
    return false;
  }
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || n < 2 || salt.length === 0 || expected.length === 0) {
    return false;
  }
  let key: Buffer;
  try {
    key = (await scryptAsync(password.normalize("NFKC"), salt, expected.length, { N: n, r, p, maxmem: MAXMEM })) as Buffer;
  } catch {
    return false;
  }
  return key.length === expected.length && timingSafeEqual(key, expected);
}
