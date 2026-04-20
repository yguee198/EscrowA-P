import * as bcrypt from 'bcrypt';

export class HashingUtil {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password or PIN
   */
  static async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.SALT_ROUNDS);
  }

  /**
   * Compare plain text with hash
   */
  static async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  /**
   * Generate a random OTP
   */
  static generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Generate a unique reference ID
   */
  static generateReferenceId(prefix: string = 'TXN'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}-${timestamp}-${random}`;
  }
}
