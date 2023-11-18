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
    let test;
    const URISchemes = {
      Mailto: 'mailto:',
      Tel: 'tel:',
    };
    // Regex for valid urls.
    //              protocol://     sub.domain.         tld           /extra?a=b#hash
    const urlRegex = /https?:\/\/(?:[a-zA-Z0-9-]+\.)+(?:[a-zA-Z0-9-]+)[^\s]*/;

    // Check for URI fragments
    if (textString.startsWith('#')) {
      test = true;
    // Check for URI schemes
    } else if (textString.startsWith(URISchemes.Mailto)) {
      // Regex for current specification for email addresses RFC 5322
      const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

      textString = textString.substring(URISchemes.Mailto.length);
      test = emailRegex.test(textString);
    } else if (textString.startsWith(URISchemes.Tel)) {
      // Regex for any phone number and flexible formatting
      const telRegex = /[+]?[0-9](?:[0-9-.()])+[0-9]/;

      textString = textString.substring(URISchemes.Tel.length);
      test = telRegex.test(textString);
    } else {
      // String will contain a standard url
      test = urlRegex.test(textString);
    }

    return test;
  };
}
