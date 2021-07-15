/**
 *
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
}
