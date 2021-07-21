import { Utils } from './utils';

/**
 * Helper for making Elements with classname and attributes
 *
 * @param  {string} tagName - new Element tag name
 * @param  {string[]|string} [classNames] - list or name of CSS classname(s)
 * @param  {object} [attributes] - any attributes
 *
 * @returns {HTMLElement}
 */
export function make(tagName, classNames = null, attributes = {}) {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, attrName)) {
      el[attrName] = attributes[attrName];
    }
  }

  return el;
}

/**
 * Checks target if it is native input
 *
 * @param {*} target - HTML element or string
 *
 * @returns {boolean}
 */
export function isNativeInput(target) {
  const nativeInputs = [
    'INPUT',
    'TEXTAREA',
  ];

  return target && target.tagName ? nativeInputs.includes(target.tagName) : false;
}

/**
 * Checks if we can set caret
 *
 * @param {HTMLElement} target - target to check
 *
 * @returns {boolean}
 */
export function canSetCaret(target) {
  let result = true;

  if (isNativeInput(target)) {
    switch (target.type) {
      case 'file':
      case 'checkbox':
      case 'radio':
      case 'hidden':
      case 'submit':
      case 'button':
      case 'image':
      case 'reset':
        result = false;
        break;
    }
  } else {
    result = isContentEditable(target);
  }

  return result;
}

/**
 * Check if passed element is contenteditable
 *
 * @param {HTMLElement} element - html element to check
 *
 * @returns {boolean}
 */
export function isContentEditable(element) {
  return element.contentEditable === 'true';
}

/**
 * Check if object is DOM node
 *
 * @param {*} node - object to check
 *
 * @returns {boolean}
 */
export function isElement(node) {
  if (Utils.isNumber(node)) {
    return false;
  }

  return node && node.nodeType && node.nodeType === Node.ELEMENT_NODE;
}

