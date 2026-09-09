/**
 * Multi-Factor Authentication (MFA / 2FA) Utilities
 * Implements standard TOTP (Time-based One-Time Password, RFC 6238)
 * and emergency backup recovery codes using Web Crypto API.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Generate random Base32 secret string (16 bytes = 26-32 chars)
export function generateTOTPSecret(): string {
  const bytes = new Uint8Array(20);
  window.crypto.getRandomValues(bytes);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

// Convert Base32 to Uint8Array
function base32ToUint8Array(base32: string): Uint8Array {
  const cleanBase32 = base32.toUpperCase().replace(/[\s-]/g, "");
  const length = cleanBase32.length;
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < length; i++) {
    const char = cleanBase32[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

// Calculate TOTP 6-digit code for a given timestamp counter
async function calculateTOTPForCounter(secretKey: string, counter: number): Promise<string> {
  const keyBytes = base32ToUint8Array(secretKey);

  // Import key for HMAC-SHA1
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );

  // Buffer for counter (8 bytes big-endian)
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  dataView.setUint32(4, counter, false);

  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, buffer);
  const hash = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binaryCode =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binaryCode % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Generate current 6-digit TOTP code (for preview or verification)
 */
export async function generateCurrentTOTP(secretKey: string): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  return calculateTOTPForCounter(secretKey, counter);
}

/**
 * Verify a user-entered 6-digit code with window tolerance (+/- 1 step = 30 seconds)
 */
export async function verifyTOTPCode(secretKey: string, token: string): Promise<boolean> {
  const cleanedToken = token.trim().replace(/\s/g, "");
  if (cleanedToken.length !== 6) return false;

  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / 30);

  // Check window [-1, 0, +1]
  for (let delta = -1; delta <= 1; delta++) {
    const validCode = await calculateTOTPForCounter(secretKey, currentCounter + delta);
    if (validCode === cleanedToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generate backup recovery codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const arr = new Uint8Array(4);
    window.crypto.getRandomValues(arr);
    const code = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Generate standard otpauth URL for QR codes
 */
export function getOTPAuthURI(secret: string, email: string, issuer: string = "Savean AI"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
