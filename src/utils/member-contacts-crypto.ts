/** Shared encrypt/decrypt for the members contact directory (Web Crypto). */

export const MEMBER_CONTACTS_BLOB_PATH = '/member/contacts.enc.json';

export const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type EncryptedContactsBlob = {
  v: 1;
  salt: string;
  iv: string;
  ciphertext: string;
};

export type MemberContactRow = {
  placeId: string;
  business: string;
  name: string;
  email?: string;
  phone?: string;
};

function getCrypto(): Crypto {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto API is not available');
  }
  return cryptoApi;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoApi = getCrypto();
  const material = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return cryptoApi.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptContacts(
  password: string,
  rows: MemberContactRow[],
): Promise<EncryptedContactsBlob> {
  const cryptoApi = getCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = cryptoApi.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(rows));
  const ciphertext = new Uint8Array(
    await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext),
  );
  return {
    v: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };
}

export async function decryptContacts(
  password: string,
  blob: EncryptedContactsBlob,
): Promise<MemberContactRow[]> {
  if (blob.v !== 1) {
    throw new Error('Unsupported contacts blob version');
  }
  const cryptoApi = getCrypto();
  const salt = base64ToBytes(blob.salt);
  const iv = base64ToBytes(blob.iv);
  const ciphertext = base64ToBytes(blob.ciphertext);
  const key = await deriveKey(password, salt);
  const plaintext = await cryptoApi.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );
  const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));
  if (!Array.isArray(parsed)) {
    throw new Error('Decrypted contacts payload is not an array');
  }
  return parsed as MemberContactRow[];
}
