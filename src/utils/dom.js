import { Utils } from './utils';

export class Dom {
    /**
     * Helper for making Elements with classname and attributes
     *
     * @param  {string} tagName - new Element tag name
     * @param  {string[]|string} [classNames] - list or name of CSS classname(s)
     * @param  {object} [attributes] - any attributes
     *
     * @returns {HTMLElement}
     */
    static make(tagName, classNames = null, attributes= {}) {
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
    static isNativeInput(target) {
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
    static canSetCaret(target) {
        let result = true;

        if (Dom.isNativeInput(target)) {
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
            result = Dom.isContentEditable(target);
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
    static isContentEditable(element) {
        return element.contentEditable === 'true';
    }

    /**
     * Check if object is DOM node
     *
     * @param {*} node - object to check
     *
     * @returns {boolean}
     */
    static isElement(node) {
        if (Utils.isNumber(node)) {
            return false;
        }

        return node && node.nodeType && node.nodeType === Node.ELEMENT_NODE;
    }
}
