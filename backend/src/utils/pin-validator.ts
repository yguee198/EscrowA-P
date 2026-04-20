export class PinValidator {
  /**
   * Validate PIN format (4-6 digits)
   */
  static isValid(pin: string): boolean {
    const pinRegex = /^\d{4,6}$/;
    return pinRegex.test(pin);
  }

  /**
   * Check if PIN is too weak (e.g., 1234, 0000)
   */
  static isWeak(pin: string): boolean {
    // Check for sequential numbers
    if (pin === '1234' || pin === '4321' || pin === '0123') {
      return true;
    }

    // Check for repeated digits
    if (/^(\d)\1+$/.test(pin)) {
      return true;
    }

    return false;
  }

  /**
   * Validate and return error message if invalid
   */
  static validate(pin: string): { valid: boolean; message?: string } {
    if (!pin) {
      return { valid: false, message: 'PIN is required' };
    }

    if (!this.isValid(pin)) {
      return { valid: false, message: 'PIN must be 4-6 digits' };
    }

    if (this.isWeak(pin)) {
      return { valid: false, message: 'PIN is too weak. Avoid sequential or repeated digits' };
    }

    return { valid: true };
  }
}
