/**
 * Client-Side Zero-Knowledge Encrypted Storage Utility using Web Crypto API
 * Uses AES-GCM 256-bit encryption with PBKDF2-derived keys.
 * Data is encrypted locally before being stored in Firestore or LocalStorage.
 */

const CIPHER_PREFIX = "ENC_V1";

// Convert Uint8Array to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM 256 key from passphrase + salt using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a string using a secret passphrase.
 * Returns: "ENC_V1:base64Salt:base64IV:base64Ciphertext"
 */
export async function encryptText(plaintext: string, passphrase: string): Promise<string> {
  if (!plaintext || !passphrase) return plaintext;

  try {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    // 16 bytes salt + 12 bytes IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(passphrase, salt);

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedData
    );

    const b64Salt = arrayBufferToBase64(salt.buffer);
    const b64Iv = arrayBufferToBase64(iv.buffer);
    const b64Cipher = arrayBufferToBase64(encryptedContent);

    return `${CIPHER_PREFIX}:${b64Salt}:${b64Iv}:${b64Cipher}`;
  } catch (err) {
    console.error("Encryption error:", err);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypt a previously encrypted string using secret passphrase.
 */
export async function decryptText(encryptedPayload: string, passphrase: string): Promise<string> {
  if (!encryptedPayload || !passphrase) return encryptedPayload;
  if (!encryptedPayload.startsWith(`${CIPHER_PREFIX}:`)) {
    // Plain text or unrecognized format
    return encryptedPayload;
  }

  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 4) return encryptedPayload;

    const [, b64Salt, b64Iv, b64Cipher] = parts;
    const salt = new Uint8Array(base64ToArrayBuffer(b64Salt));
    const iv = new Uint8Array(base64ToArrayBuffer(b64Iv));
    const ciphertext = base64ToArrayBuffer(b64Cipher);

    const key = await deriveKey(passphrase, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.warn("Decryption failed (likely incorrect passphrase or corrupted data)");
    return "[Encrypted - Enter correct Vault Passphrase to decrypt]";
  }
}

/**
 * Test if a string is encrypted with Savean vault format
 */
export function isEncryptedFormat(text: string): boolean {
  return typeof text === "string" && text.startsWith(`${CIPHER_PREFIX}:`);
}

/**
 * Generate a cryptographically secure random vault recovery key
 */
export function generateRandomVaultKey(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < array.length; i++) {
    result += charset[array[i] % charset.length];
    if ((i + 1) % 4 === 0 && i !== array.length - 1) {
      result += "-";
    }
  }
  return result;
}
