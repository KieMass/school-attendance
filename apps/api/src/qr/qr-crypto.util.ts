import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

export interface QrPayload {
  requestId: string;
  studentId: string;
  tokenId: string;
  exp: number; // unix seconds
  /** Raw (unhashed) single-use security token; compared against the
   * SHA-256 hash stored on the QrToken row. */
  securityToken: string;
}

/**
 * AES-256-GCM encrypt/decrypt for the payload embedded in a gate-pass QR
 * code. The key comes from `QR_ENCRYPTION_KEY` (base64, 32 bytes) so it can
 * be rotated independently of JWT secrets.
 *
 * Output format: base64( iv | authTag | ciphertext ), decoded and verified
 * in one step by `decrypt()` — GCM's auth tag means any tampering with the
 * QR image content (payload or expiry) fails decryption rather than
 * silently succeeding with altered data.
 */
export class QrCrypto {
  constructor(private readonly base64Key: string) {
    if (!base64Key) {
      throw new Error('QR_ENCRYPTION_KEY is not configured');
    }
  }

  private getKey(): Buffer {
    const key = Buffer.from(this.base64Key, 'base64');
    if (key.length !== 32) {
      throw new Error(
        'QR_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256)',
      );
    }
    return key;
  }

  encrypt(payload: QrPayload): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  decrypt(encrypted: string): QrPayload {
    const raw = Buffer.from(encrypted, 'base64');
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
    const ciphertext = raw.subarray(IV_LENGTH + 16);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.getKey(), iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8'));
  }

  /** Constant-time comparison for the accompanying security token, to avoid
   * timing side-channels on the gate-scan hot path. */
  static safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
