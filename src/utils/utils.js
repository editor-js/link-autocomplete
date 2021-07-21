/**
 * Useful functions
 */
export class Utils {
  /**
   * Checks if passed argument is number
   *
   * @param {*} v - variable to check
   *
   * @returns {boolean}
   */
  static isNumber(v) {
    return typeof v === 'number';
  }

  /**
   * Checks if passed argument is array
   *
   * @param {*} v - variable to check
   *
   * @returns {boolean}
   */
  static isArray(v) {
    return Array.isArray(v);
  }

  /**
   * Check for a valid url string
   *
   * @param {string} textString — string to be checked
   *
   * @returns {boolean}
   */
  static isUrl(textString) {
    const regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;

    return regex.test(textString);
  };
}
