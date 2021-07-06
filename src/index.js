/**
 * Build styles
 */
import './../styles/index.pcss';

/**
 * Import deps
 */
import axios from 'axios';
import notifier from 'codex-notifier';

/**
 * Import functions
 */
import { checkForValidUrl } from './check-for-valid-url';
import { Dom } from './utils/dom';
import { SelectionUtils } from './utils/selection';
import {Utils} from "./utils/utils";

/**
 * @typedef {Object} SearchItemData
 * @property {string} name
 * @property {string} href
 */

const DICTIONARY = {
  pasteOrSearch: 'Paste or Search',
  pasteALink: 'Paste a link',
  searchRequestError: 'Cannot process search request because of',
  invalidServerData: 'Server responded with invalid data',
  invalidUrl: 'Link URL is invalid'
}

/**
 * Link Autocomplete Tool for EditorJS
 */
export default class LinkAutocomplete {
  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @returns {boolean}
   */
  static get isInline() {
    return true;
  }

  /**
   * Sanitizer Rule
   * Leave <a> tags
   *
   * @returns {object}
   */
  static get sanitize() {
    return {
      a: true,
    };
  }

  /**
   * Title for hover-tooltip
   */
  static get title() {
    return 'Link Autocomplete';
  }

  /**
   * Set a shortcut
   *
   * @return {string}
   */
  get shortcut() {
    return 'CMD+K';
  }

  /**
   * Styles
   *
   * @private
   */
  get CSS() {
    return {
      button: 'ce-inline-tool',
      iconWrapper: 'ce-link-autocomplete__icon-wrapper',

      hidden: 'ce-link-autocomplete__hidden',

      actionsWrapper: 'ce-link-autocomplete__actions-wrapper',
      input: 'ce-link-autocomplete__input',
      loader: 'ce-link-autocomplete__loader',
      loaderWrapper: 'ce-link-autocomplete__loader-wrapper',

      searchItem: 'ce-link-autocomplete__search-item',
      searchItemSelected: 'ce-link-autocomplete__search-item--selected',
      searchItemName: 'ce-link-autocomplete__search-item-name',
      searchItemDescription: 'ce-link-autocomplete__search-item-description',

      linkDataWrapper: 'ce-link-autocomplete__link-data-wrapper',
      linkDataTitleWrapper: 'ce-link-autocomplete__link-data-title-wrapper',
      linkDataName: 'ce-link-autocomplete__link-data-name',
      linkDataDescription: 'ce-link-autocomplete__link-data-description',
      linkDataURL: 'ce-link-autocomplete__link-data-url',

      isActive: 'ce-inline-tool--active',
    };
  }

  /**
   * Initialize basic data
   * @param api
   */
  constructor({ config, api }) {
    this.api = api;
    this.config = config;
    this.selection = new SelectionUtils();

    this.searchEndpointUrl = this.config.endpointUrl;
    this.searchQueryParam = this.config.queryParam;

    this.nodes = {
      toolButtons: null,
      toolButtonLink: null,
      toolButtonUnlink: null,

      actionsWrapper: null,
      inputWrapper: null,
      inputField: null,
      loader: null,

      searchResults: null,

      linkDataWrapper: null,
      linkDataTitleWrapper: null,
      linkDataName: null,
      linkDataDescription: null,
      linkDataURL: null,
    }

    this.tagName = 'A';

    /**
     * Key codes
     */
    this.KEYS = {
      ENTER: 13,
      UP: 38,
      DOWN: 40
    }
  }

  /**
   * Create element with buttons for toolbar
   * @return {HTMLDivElement}
   */
  render() {
    /**
     * Create wrapper for buttons
     * @type {HTMLDivElement}
     */
    this.nodes.toolButtons = document.createElement('BUTTON');
    this.nodes.toolButtons.classList.add(this.CSS.button);

    /**
     * Create Link button
     * @type {HTMLDivElement}
     */
    this.nodes.toolButtonLink = Dom.make('SPAN', [ this.CSS.iconWrapper ]);
    this.nodes.toolButtonLink.innerHTML = require('../icons/link.svg');
    this.nodes.toolButtons.appendChild(this.nodes.toolButtonLink);

    /**
     * Create Unlink button
     * @type {HTMLDivElement}
     */
    this.nodes.toolButtonUnlink = Dom.make('SPAN', [ this.CSS.iconWrapper ]);
    this.nodes.toolButtonUnlink.innerHTML = require('../icons/unlink.svg');
    this.nodes.toolButtons.appendChild(this.nodes.toolButtonUnlink);
    this.toggleVisibility(this.nodes.toolButtonUnlink, false);

    return this.nodes.toolButtons;
  }

  /**
   * Render actions element
   *
   * actionsWrapper
   *   |- inputWrapper
   *   |    |- inputField
   *   |    |- loader
   *   |
   *   |- searchResults
   *   |    |- searchItemWrapper
   *   |    |    |- searchItemName
   *   |    |    |- searchItemDescription
   *   |    |
   *   |    |- ...
   *   |
   *   |- linkDataWrapper
   *        |- URL
   *        |- name
   *        |- description
   *
   *
   * @return {HTMLDivElement}
   */
  renderActions() {
    /**
     * Define debounce timer
     */
    let typingTimer;

    /**
     * Render actions wrapper
     */
    this.nodes.actionsWrapper = Dom.make('DIV', [this.CSS.actionsWrapper]);

    /**
     * Render input field
     */
    this.nodes.inputWrapper = Dom.make('DIV');
    this.nodes.inputField = Dom.make('INPUT', [this.CSS.input], {
      placeholder: this.api.i18n.t(this.isServerEnabled ? DICTIONARY.pasteOrSearch : DICTIONARY.pasteALink)
    });

    this.nodes.loader = Dom.make('DIV', [this.CSS.loader, this.CSS.loaderWrapper]);
    this.toggleVisibility(this.nodes.loader, false);

    this.nodes.inputWrapper.appendChild(this.nodes.inputField);
    this.nodes.inputWrapper.appendChild(this.nodes.loader);
    this.toggleVisibility(this.nodes.inputWrapper, false);

    /**
     * Render search results
     */
    this.nodes.searchResults = Dom.make('DIV');

    this.nodes.searchResults.addEventListener('mouseenter', () => {
      const searchItems = Array.from(this.nodes.searchResults.querySelectorAll(`.${this.CSS.searchItem}`));

      searchItems.forEach(item => {
        item.classList.remove(this.CSS.searchItemSelected);
      })
    })

    /**
     * Listen to pressed enter key or up and down arrows
     */
    this.nodes.inputField.addEventListener('keydown', (event) => {
      if ([this.KEYS.UP, this.KEYS.DOWN].includes(event.keyCode)) {
        this.selectItemByKeys(event);
        return;
      }

      if (event.keyCode !== this.KEYS.ENTER) {
        return;
      }

      /**
       * Preventing events that will be able to happen
       */
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const selectedItem = this.getSelectedItem();

      if (selectedItem) {
        this.searchItemPressed(selectedItem);
        return;
      }

      const href = event.target.value;

      if (!href || !href.trim()) {
        return;
      }

      if (!checkForValidUrl(href)) {
        notifier.show({
          message: DICTIONARY.invalidUrl,
          style: 'error'
        })

        return;
      }

      this.selection.restore();
      this.selection.removeFakeBackground();

      document.execCommand('createLink', false, href);

      const newLink = this.selection.findParentTag(this.tagName);

      this.selection.collapseToEnd();
      this.api.inlineToolbar.close();
    })

    /**
     * Listen to input
     */
    this.nodes.inputField.addEventListener('input', (event) => {
      /**
       * Stop debounce timer
       */
      clearTimeout(typingTimer);

      const searchString = event.target.value;

      /**
       * If search string in empty then clear search list
       */
      if (!searchString || !searchString.trim()) {
        this.clearSearchList();
        return;
      }

      if (checkForValidUrl(searchString)) {
        this.generateSearchList([{
          href: searchString
        }]);

        return;
      }

      /**
       * If no server endpoint then do nothing
       */
      if (!this.isServerEnabled) {
        return;
      }

      /**
       * Define a new timer
       */
      typingTimer = setTimeout(async () => {
        /**
         * Show the loader during request
         */
        this.toggleVisibility(this.nodes.loader, true);
        try {
          const searchDataItems = await this.searchRequest(searchString);

          /**
           * Generate list
           */
          this.generateSearchList(searchDataItems);
        } catch (e) {
          notifier.show({
            message: `${DICTIONARY.searchRequestError} "${e.message}"`,
            style: 'error'
          })
        }
        this.toggleVisibility(this.nodes.loader, false);
      }, 700);
    });

    this.nodes.linkDataWrapper = Dom.make('DIV', [ this.CSS.linkDataWrapper ]);
    this.toggleVisibility(this.nodes.linkDataWrapper, false);


    this.nodes.linkDataTitleWrapper = Dom.make('DIV', [ this.CSS.linkDataTitleWrapper]);
    this.nodes.linkDataWrapper.appendChild(this.nodes.linkDataTitleWrapper);
    this.toggleVisibility(this.nodes.linkDataTitleWrapper, false);

    this.nodes.linkDataName = Dom.make('DIV', [ this.CSS.linkDataName]);
    this.nodes.linkDataTitleWrapper.appendChild(this.nodes.linkDataName);
    this.nodes.linkDataDescription = Dom.make('DIV', [ this.CSS.linkDataDescription]);
    this.nodes.linkDataTitleWrapper.appendChild(this.nodes.linkDataDescription);

    this.nodes.linkDataURL = Dom.make('A', [ this.CSS.linkDataURL ]);
    this.nodes.linkDataWrapper.appendChild(this.nodes.linkDataURL);

    this.nodes.actionsWrapper.appendChild(this.nodes.inputWrapper);
    this.nodes.actionsWrapper.appendChild(this.nodes.searchResults);
    this.nodes.actionsWrapper.appendChild(this.nodes.linkDataWrapper);

    return this.nodes.actionsWrapper;
  }

  /**
   *
   * @param {KeyboardEvent} event
   */
  selectItemByKeys(event) {
    /**
     * Preventing events that will be able to happen
     */
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const indexDelta = event.keyCode === this.KEYS.DOWN ? 1 : -1;

    const searchItems = Array.from(this.nodes.searchResults.querySelectorAll(`.${this.CSS.searchItem}`));
    const selectedItem = this.getSelectedItem();

    const indexOfSelectedItem = searchItems.indexOf(selectedItem);

    if (indexOfSelectedItem !== -1) {
      const nextIndex = (indexOfSelectedItem + indexDelta + searchItems.length) % searchItems.length;

      searchItems[indexOfSelectedItem].classList.remove(this.CSS.searchItemSelected);
      searchItems[nextIndex].classList.add(this.CSS.searchItemSelected);
    } else {
      if (!searchItems[0]) {
        return;
      }

      const nextIndex = indexDelta === 1 ? 0 : searchItems.length - 1;

      searchItems[nextIndex].classList.add(this.CSS.searchItemSelected);
    }
  }

  /**
   * Find selected item
   *
   * @return {Element|null}
   */
  getSelectedItem() {
    return this.nodes.searchResults.querySelector(`.${this.CSS.searchItemSelected}`);
  }

  /**
   *
   * @param linkValue
   * @param additionalData
   */
  wrapTextToLinkElement(linkValue, additionalData) {
    let linkElement = Dom.make(this.tagName, [], {
      href: linkValue
    });

    Object.keys(additionalData).forEach(key => {
      linkElement.dataset[key] = additionalData[key];
    })

    return linkElement;
  }

  /**
   * Remove search result elements
   */
  clearSearchList() {
    while (this.nodes.searchResults.firstChild) {
      this.nodes.searchResults.firstChild.remove()
    }
  }

  /**
   *
   * @param items
   */
  generateSearchList(items = []) {
    /**
     * Clear list first
     */
    this.clearSearchList();

    /**
     * If items data is not an array
     */
    if (!Utils.isArray(items)) {
      notifier.show({
        message: DICTIONARY.invalidServerData,
        style: 'error'
      })
      return;
    }

    /**
     * If no items returned
     */
    if (items.length === 0) {
      return;
    }

    items.forEach(item => {
      const searchItem = Dom.make('DIV', [this.CSS.searchItem]);

      const searchItemName = Dom.make('DIV', [ this.CSS.searchItemName ], {
        innerText: item.name || item.href
      });
      searchItem.appendChild(searchItemName);

      if (item.description) {
        const searchItemDescription = Dom.make('DIV', [ this.CSS.searchItemDescription ], {
          innerText: item.description
        });
        searchItem.appendChild(searchItemDescription);
      }

      Object.keys(item).forEach(key => {
        searchItem.dataset[key] = item[key];
      })

      searchItem.addEventListener('click', (event) => {
        /**
         * Preventing events that will be able to happen
         */
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // const href = item.href;
        //
        // delete item.href;
        //

        this.searchItemPressed(searchItem);

        // document.execCommand('createLink', false, href);
        //
        // const newLink = this.selection.findParentTag(this.tagName);
        //
        // Object.keys(item).forEach(key => {
        //   newLink.dataset[key] = item[key];
        // })

        //
        // this.selection.collapseToEnd();
        // this.api.inlineToolbar.close();
      });

      this.nodes.searchResults.appendChild(searchItem);
    })
  }

  searchItemPressed(element) {
    if (!element.dataset || !element.dataset['href']) {
      return;
    }

    const href = element.dataset['href'];

    this.selection.restore();
    this.selection.removeFakeBackground();

    document.execCommand('createLink', false, href);

    const newLink = this.selection.findParentTag(this.tagName);

    Object.keys(element.dataset).forEach(key => {
      newLink.dataset[key] = element.dataset[key];
    })

    this.selection.collapseToEnd();
    this.api.inlineToolbar.close();
  };

  /**
   * Handle clicks on the Inline Toolbar icon
   *
   * @param {Range} range - range to wrap with link
   */
  surround(range) {
    if (!range) {
      return;
    }

    /**
     * Get result state after checkState() function
     * If tool button icon unlink is active then selected text is a link
     * @type {boolean}
     */
    const isLinkSelected = this.nodes.toolButtonUnlink.classList.contains(this.CSS.isActive);

    this.selection.setFakeBackground();
    this.selection.save();

    if (!isLinkSelected) {
      this.toggleVisibility(this.nodes.inputWrapper, true);
      this.nodes.inputField.focus();
    } else {
      const parentAnchor = this.selection.findParentTag('A');

      this.selection.expandToTag(parentAnchor);

      document.execCommand('unlink');

      this.selection.removeFakeBackground();
      this.api.inlineToolbar.close();
    }
  }

  /**
   * Check for a tool's state
   *
   * @param {Selection} selection
   */
  checkState(selection) {
    const text = selection.anchorNode;

    if (!text) {
      return;
    }

    const parentA = this.selection.findParentTag(this.tagName);

    if (parentA) {
      this.nodes.linkDataName.innerText = parentA.dataset.name || '';

      this.nodes.linkDataDescription.innerText = parentA.dataset.description || '';

      this.nodes.linkDataURL.innerText = parentA.href || '';
      this.nodes.linkDataURL.href = parentA.href || '';
      this.nodes.linkDataURL.target = '_blank';


      if (parentA.dataset.name || parentA.dataset.description) {
        this.toggleVisibility(this.nodes.linkDataTitleWrapper, true)
      }

      this.toggleVisibility(this.nodes.linkDataWrapper, true);

      /**
       * Show 'unlink' icon
       */
      this.toggleVisibility(this.nodes.toolButtonLink, false);
      this.toggleVisibility(this.nodes.toolButtonUnlink, true);
      this.nodes.toolButtonUnlink.classList.add(this.CSS.isActive);
    }
  }

  /**
   * Show or hide target element
   *
   * @param {HTMLElement} element
   * @param {boolean} isVisible
   *
   * @return
   */
  toggleVisibility(element, isVisible = true) {
    element.classList[isVisible ? 'remove' : 'add'](this.CSS.hidden);
  }

  /**
   * Send search request
   *
   * @param {string} searchString - search string input
   *
   * @returns {Promise<void>}
   */
  async searchRequest(searchString) {
    /**
     * Get a response table data
     *
     * @type {AxiosResponse<*>}
     */
    const searchData = (await axios.get(this.searchEndpointUrl, {
      params: {
        [this.searchQueryParam]: searchString
      }
    })).data;

    return searchData;
  }

  /**
   * Do we need to send requests to the server
   *
   * @return {boolean}
   */
  isServerEnabled() {
    return !!this.searchEndpointUrl;
  }

  /**
   * Function called with Inline Toolbar closing
   */
  clear() {
    if (this.selection.isFakeBackgroundEnabled) {
      // if actions is broken by other selection We need to save new selection
      const currentSelection = new SelectionUtils();

      currentSelection.save();

      this.selection.restore();
      this.selection.removeFakeBackground();

      // and recover new selection after removing fake background
      currentSelection.restore();
    }
  }
}
