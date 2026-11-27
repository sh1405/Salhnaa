const HASH_SCHEME = "pbkdf2-sha256";
const ITERATIONS = 600_000;
const KEY_LENGTH_BITS = 256;
const SALT_LENGTH_BYTES = 16;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations },
    key,
    KEY_LENGTH_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const digest = await derive(password, salt, ITERATIONS);
  return `${HASH_SCHEME}$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(digest)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, iterationText, saltHex, digestHex, extra] = encoded.split("$");
  const iterations = Number(iterationText);
  const salt = hexToBytes(saltHex ?? "");
  const expected = hexToBytes(digestHex ?? "");
  if (
    extra !== undefined || scheme !== HASH_SCHEME || !Number.isSafeInteger(iterations) ||
    iterations < 100_000 || iterations > 1_000_000 || !salt || salt.length !== SALT_LENGTH_BYTES ||
    !expected || expected.length !== KEY_LENGTH_BITS / 8
  ) return false;

  const actual = await derive(password, salt, iterations);
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
  return difference === 0;
}

let dummyHashPromise: Promise<string> | undefined;
export function getDummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = (async () => {
      const salt = new Uint8Array(SALT_LENGTH_BYTES).fill(0x5a);
      const digest = await derive("salihna-invalid-account-timing-dummy", salt, ITERATIONS);
      return `${HASH_SCHEME}$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(digest)}`;
    })();
  }
  return dummyHashPromise;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
