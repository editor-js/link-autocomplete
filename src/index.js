/**
 * Build styles
 */
import './../styles/index.pcss';

/**
 * Import deps
 */
import notifier from 'codex-notifier';

/**
 * Import functions
 */
import * as Dom from './utils/dom';
import { SelectionUtils } from './utils/selection';
import { Utils } from './utils/utils';

/**
 * @typedef {object} SearchItemData
 * @property {string} href - link target
 * @property {string} name - link name
 * @property {string} description - link description
 */

const DICTIONARY = {
  pasteOrSearch: 'Paste or search',
  pasteALink: 'Paste a link',
  searchRequestError: 'Cannot process search request because of',
  invalidServerData: 'Server responded with invalid data',
  invalidUrl: 'Link URL is invalid',
};

/**
 * Timeout before search in ms after key pressed
 *
 * @type {number}
 */
const DEBOUNCE_TIMEOUT = 250;

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
   *
   * @returns {string}
   */
  static get title() {
    return 'Link Autocomplete';
  }

  /**
   * Set a shortcut
   *
   * @returns {string}
   */
  get shortcut() {
    return 'CMD+K';
  }

  /**
   * @private
   *
   * @returns {object<string, string>} — keys and class names
   */
  get CSS() {
    return {
      button: 'ce-inline-tool',
      iconWrapper: 'ce-link-autocomplete__icon-wrapper',

      hidden: 'ce-link-autocomplete__hidden',

      actionsWrapper: 'ce-link-autocomplete__actions-wrapper',

      field: 'ce-link-autocomplete__field',
      fieldLoading: 'ce-link-autocomplete__field--loading',
      fieldInput: 'ce-link-autocomplete__field-input',

      foundItems: 'ce-link-autocomplete__items',

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
   *
   * @param config.config
   * @param {object} config — initial config for the tool
   * @param {object} api — methods from Core
   * @param config.api
   */
  constructor({ config, api }) {
    /**
     * Essential tools
     */
    this.api = api;
    this.config = config || {};
    this.selection = new SelectionUtils();

    /**
     * Config params
     */
    this.searchEndpointUrl = this.config.endpoint;
    this.searchQueryParam = this.config.queryParam;

    /**
     * Tool's nodes list
     *
     * toolButtons
     *   |- toolButtonLink
     *   |- toolButtonUnlink
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
     */
    this.nodes = {
      toolButtons: null,
      toolButtonLink: null,
      toolButtonUnlink: null,

      actionsWrapper: null,
      inputWrapper: null,
      inputField: null,

      searchResults: null,

      linkDataWrapper: null,
      linkDataTitleWrapper: null,
      linkDataName: null,
      linkDataDescription: null,
      linkDataURL: null,
    };

    /**
     * Define tag name for a link element
     */
    this.tagName = 'A';

    /**
     * Key codes
     */
    this.KEYS = {
      ENTER: 13,
      UP: 38,
      DOWN: 40,
    };

    /**
     * Define debounce timer
     */
    this.typingTimer = null;
  }

  /**
   * Create element with buttons for toolbar
   *
   * @returns {HTMLDivElement}
   */
  render() {
    /**
     * Create wrapper for buttons
     *
     * @type {HTMLButtonElement}
     */
    this.nodes.toolButtons = Dom.make('button');
    this.nodes.toolButtons.classList.add(this.CSS.button);

    /**
     * Create Link button
     *
     * @type {HTMLSpanElement}
     */
    this.nodes.toolButtonLink = Dom.make('span', [ this.CSS.iconWrapper ]);
    this.nodes.toolButtonLink.innerHTML = require('../icons/link.svg');
    this.nodes.toolButtons.appendChild(this.nodes.toolButtonLink);

    /**
     * Create Unlink button
     *
     * @type {HTMLSpanElement}
     */
    this.nodes.toolButtonUnlink = Dom.make('span', [ this.CSS.iconWrapper ]);
    this.nodes.toolButtonUnlink.innerHTML = require('../icons/unlink.svg');
    this.nodes.toolButtons.appendChild(this.nodes.toolButtonUnlink);
    this.toggleVisibility(this.nodes.toolButtonUnlink, false);

    return this.nodes.toolButtons;
  }

  /**
   * Render actions element
   *
   * @returns {HTMLDivElement}
   */
  renderActions() {
    /**
     * Render actions wrapper
     *
     * @type {HTMLDivElement}
     */
    this.nodes.actionsWrapper = Dom.make('div', [ this.CSS.actionsWrapper ]);
    this.toggleVisibility(this.nodes.actionsWrapper, false);

    /**
     * Render input field
     *
     * @type {HTMLDivElement}
     */
    this.nodes.inputWrapper = Dom.make('div', this.CSS.field);
    this.nodes.inputField = Dom.make('input', this.CSS.fieldInput, {
      placeholder: this.api.i18n.t(this.isServerEnabled ? DICTIONARY.pasteOrSearch : DICTIONARY.pasteALink),
    });


    this.nodes.inputWrapper.appendChild(this.nodes.inputField);
    this.toggleVisibility(this.nodes.inputWrapper, false);

    /**
     * Render search results
     *
     * @type {HTMLDivElement}
     */
    this.nodes.searchResults = Dom.make('div', this.CSS.foundItems);
    /**
     * To improve UX we need to remove any 'selected' classes from search results
     */
    this.nodes.searchResults.addEventListener('mouseenter', () => {
      const searchItems = this.getSearchItems();

      searchItems.forEach(item => {
        item.classList.remove(this.CSS.searchItemSelected);
      });
    });
    /**
     * Enable search results click listener
     */
    this.nodes.searchResults.addEventListener('click', (event) => {
      const closestSearchItem = event.target.closest(`.${this.CSS.searchItem}`);

      /**
       * If click target search item is missing then do nothing
       */
      if (!closestSearchItem) {
        return;
      }

      /**
       * Preventing events that will be able to happen
       */
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      this.searchItemPressed(closestSearchItem);
    });

    /**
     * Listen to pressed enter key or up and down arrows
     */
    this.nodes.inputField.addEventListener('keydown', this.fieldKeydownHandler.bind(this));

    /**
     * Listen to input
     */
    this.nodes.inputField.addEventListener('input', this.fieldInputHandler.bind(this));

    /**
     * Render link data block
     */
    this.nodes.linkDataWrapper = Dom.make('div', [ this.CSS.linkDataWrapper ]);
    this.toggleVisibility(this.nodes.linkDataWrapper, false);

    this.nodes.linkDataTitleWrapper = Dom.make('div', [ this.CSS.linkDataTitleWrapper ]);
    this.nodes.linkDataWrapper.appendChild(this.nodes.linkDataTitleWrapper);
    this.toggleVisibility(this.nodes.linkDataTitleWrapper, false);

    this.nodes.linkDataName = Dom.make('div', [ this.CSS.linkDataName ]);
    this.nodes.linkDataTitleWrapper.appendChild(this.nodes.linkDataName);
    this.nodes.linkDataDescription = Dom.make('div', [ this.CSS.linkDataDescription ]);
    this.nodes.linkDataTitleWrapper.appendChild(this.nodes.linkDataDescription);

    this.nodes.linkDataURL = Dom.make('A', [ this.CSS.linkDataURL ]);
    this.nodes.linkDataWrapper.appendChild(this.nodes.linkDataURL);

    /**
     * Compose actions block
     */
    this.nodes.actionsWrapper.appendChild(this.nodes.inputWrapper);
    this.nodes.actionsWrapper.appendChild(this.nodes.searchResults);
    this.nodes.actionsWrapper.appendChild(this.nodes.linkDataWrapper);

    return this.nodes.actionsWrapper;
  }

  /**
   * Process keydown events to detect arrow keys or enter pressed
   *
   * @param {KeyboardEvent} event — keydown event
   */
  fieldKeydownHandler(event) {
    const isArrowKey = [this.KEYS.UP, this.KEYS.DOWN].includes(event.keyCode);
    const isEnterKey = this.KEYS.ENTER === event.keyCode;

    /**
     * If key is not an arrow or enter
     */
    if (!isArrowKey && !isEnterKey) {
      return;
    }

    /**
     * Preventing events that will be able to happen
     */
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    /**
     * Choose handler
     */
    switch (true) {
      /**
       * Handle arrow keys
       */
      case isArrowKey:
        this.selectItemByKeys(event);
        break;

      /**
       * Handle Enter key
       */
      case isEnterKey:
        this.processEnterKeyPressed();
        break;
    }
  }

  /**
   * Input event listener for a input field
   *
   * @param {KeyboardEvent} event — input event
   */
  fieldInputHandler(event) {
    /**
     * Stop debounce timer
     */
    clearTimeout(this.typingTimer);

    /**
     * Get input value
     */
    const searchString = event.target.value;

    /**
     * If search string in empty then clear search list
     */
    if (!searchString || !searchString.trim()) {
      this.clearSearchList();

      return;
    }

    /**
     * If a valid link was entered then show only one list item with a link href.
     */
    if (Utils.isUrl(searchString)) {
      this.generateSearchList([ {
        href: searchString,
      } ]);

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
    this.typingTimer = setTimeout(async () => {
      /**
       * Show the loader during request
       */
      this.toggleLoadingState(true);
      try {
        const searchDataItems = await this.searchRequest(searchString);

        /**
         * Generate list
         */
        this.generateSearchList(searchDataItems);
      } catch (e) {
        notifier.show({
          message: `${DICTIONARY.searchRequestError} "${e.message}"`,
          style: 'error',
        });
      }
      this.toggleLoadingState(false);
    }, DEBOUNCE_TIMEOUT);
  }

  toggleLoadingState(state){
    this.nodes.inputWrapper.classList.toggle(this.CSS.fieldLoading, state);
  }

  /**
   * Handle arrow keys pressing
   *
   * @param {KeyboardEvent} event
   */
  selectItemByKeys(event) {
    /**
     * Detect direction for an item to be selected next
     * Key arrow down: index + 1
     * Key arrow up: index - 1
     */
    const indexDelta = event.keyCode === this.KEYS.DOWN ? 1 : -1;

    /**
     * Getting search items
     */
    const searchItems = this.getSearchItems();
    const selectedItem = this.getSelectedItem();

    /**
     * Get index of selected item
     *
     * @type {number}
     */
    const indexOfSelectedItem = searchItems.indexOf(selectedItem);

    /**
     * Next item index
     * This value will be updated below
     *
     * @type {number}
     */
    let nextIndex = 0;

    /**
     * If there is selected item
     */
    if (indexOfSelectedItem !== -1) {
      /**
       * Magic math for getting correct index of item
       *
       * @type {number}
       */
      nextIndex = (indexOfSelectedItem + indexDelta + searchItems.length) % searchItems.length;

      /**
       * Deselect prev item
       */
      searchItems[indexOfSelectedItem].classList.remove(this.CSS.searchItemSelected);

    /**
     * If there is no search items was selected
     */
    } else {
      /**
       * If no search items then do nothing
       */
      if (!searchItems.length) {
        return;
      }

      /**
       * Detect index for the next selected item depending the arrow key direction
       *
       * @type {number}
       */
      nextIndex = indexDelta === 1 ? 0 : searchItems.length - 1;
    }

    /**
     * Highlight the next item
     */
    searchItems[nextIndex].classList.add(this.CSS.searchItemSelected);
  }

  /**
   * Process enter key pressing
   */
  processEnterKeyPressed() {
    /**
     * Try to get selected item
     *
     * @type {Element|null}
     */
    const selectedItem = this.getSelectedItem();

    /**
     * If any item was manually selected then process click on it
     */
    if (selectedItem) {
      this.searchItemPressed(selectedItem);

      return;
    }

    /**
     * Get input field value
     */
    const href = this.nodes.inputField.value;

    /**
     * If input field is empty then do nothing
     */
    if (!href || !href.trim()) {
      return;
    }

    /**
     * If input is not a valid url then show an error
     */
    if (!Utils.isUrl(href)) {
      notifier.show({
        message: DICTIONARY.invalidUrl,
        style: 'error',
      });

      return;
    }

    /**
     * Get the first item from the search list
     * This item exists because input href is valid
     *
     * @type {Element}
     */
    const composedItem = this.getSearchItems()[0];

    /**
     * "Press" search item
     */
    this.searchItemPressed(composedItem);
  }

  /**
   * Get search items
   *
   * @returns {Element[]}
   */
  getSearchItems() {
    const nodesList = this.nodes.searchResults.querySelectorAll(`.${this.CSS.searchItem}`);

    return Array.from(nodesList);
  }

  /**
   * Find selected item
   *
   * @returns {Element|null}
   */
  getSelectedItem() {
    return this.nodes.searchResults.querySelector(`.${this.CSS.searchItemSelected}`);
  }

  /**
   * Remove search result elements
   */
  clearSearchList() {
    this.nodes.searchResults.innerHTML = '';
  }

  /**
   * Fill up a search list results by data
   *
   * @param {SearchItemData[]} items — items to be shown
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
        style: 'error',
      });

      return;
    }

    /**
     * If no items returned
     */
    if (items.length === 0) {
      return;
    }

    /**
     * Fill up search list by new elements
     */
    items.forEach(item => {
      const searchItem = Dom.make('div', [ this.CSS.searchItem ]);

      /**
       * Create a name for a link
       *
       * @type {HTMLElement}
       */
      const searchItemName = Dom.make('div', [ this.CSS.searchItemName ], {
        innerText: item.name || item.href,
      });

      searchItem.appendChild(searchItemName);

      /**
       * Create a description element
       */
      if (item.description) {
        const searchItemDescription = Dom.make('div', [ this.CSS.searchItemDescription ], {
          innerText: item.description,
        });

        searchItem.appendChild(searchItemDescription);
      }

      /**
       * Save all keys to item's dataset
       */
      Object.keys(item).forEach(key => {
        searchItem.dataset[key] = item[key];
      });

      this.nodes.searchResults.appendChild(searchItem);
    });
  }

  /**
   * Process 'press' event on the search item
   *
   * @param {Element} element - pressed item element
   */
  searchItemPressed(element) {
    /**
     * If no useful dataset info was given then do nothing
     */
    if (!element.dataset || !element.dataset['href']) {
      return;
    }

    /**
     * Get link's href
     *
     * @type {string}
     */
    const href = element.dataset['href'];

    /**
     * Restore origin selection
     */
    this.selection.restore();
    this.selection.removeFakeBackground();

    /**
     * Create a link by default browser's function
     */
    document.execCommand('createLink', false, href);

    /**
     * Get this link element
     *
     * @type {HTMLElement}
     */
    const newLink = this.selection.findParentTag(this.tagName);

    /**
     * Fill up link element's dataset
     */
    Object.keys(element.dataset).forEach(key => {
      if (key === 'href') {
        return;
      }

      newLink.dataset[key] = element.dataset[key];
    });

    /**
     * Collapse selection and close toolbar
     */
    this.selection.collapseToEnd();
    this.api.inlineToolbar.close();
  };

  /**
   * Handle clicks on the Inline Toolbar icon
   *
   * @param {Range} range — range to wrap with link
   */
  surround(range) {
    if (!range) {
      return;
    }

    /**
     * Show actions wrapper
     */
    this.toggleVisibility(this.nodes.actionsWrapper, true);

    /**
     * Get result state after checkState() function
     * If tool button icon unlink is active then selected text is a link
     *
     * @type {boolean}
     */
    const isLinkSelected = this.nodes.toolButtonUnlink.classList.contains(this.CSS.isActive);

    /**
     * Create a fake selection
     */
    this.selection.setFakeBackground();
    this.selection.save();

    /**
     * Check if link is in the selection
     */
    if (!isLinkSelected) {
      /**
       * Show focused input field
       */
      this.toggleVisibility(this.nodes.inputWrapper, true);
      this.nodes.inputField.focus();
    } else {
      /**
       * Get the nearest link tag
       */
      const parentAnchor = this.selection.findParentTag('A');

      /**
       * Expand selection
       */
      this.selection.expandToTag(parentAnchor);

      /**
       * Remove the link
       */
      document.execCommand('unlink');

      /**
       * Remove fake selection and close toolbar
       */
      this.selection.removeFakeBackground();
      this.api.inlineToolbar.close();
    }
  }

  /**
   * Check for a tool's state
   *
   * @param {Selection} selection — selection to be passed from Core
   */
  checkState(selection) {
    const text = selection.anchorNode;

    /**
     * Selection is empty
     */
    if (!text) {
      return;
    }

    /**
     * Find the nearest link tag
     */
    const parentA = this.selection.findParentTag(this.tagName);

    /**
     * If no link tag then do nothing
     */
    if (!parentA) {
      return;
    }

    this.toggleVisibility(this.nodes.actionsWrapper, true);

    /**
     * Fill up link data block
     */
    this.nodes.linkDataName.innerText = parentA.dataset.name || '';
    this.nodes.linkDataDescription.innerText = parentA.dataset.description || '';
    this.nodes.linkDataURL.innerText = parentA.href || '';
    this.nodes.linkDataURL.href = parentA.href || '';
    this.nodes.linkDataURL.target = '_blank';

    /**
     * If link has name or description then show title wrapper
     */
    if (parentA.dataset.name || parentA.dataset.description) {
      this.toggleVisibility(this.nodes.linkDataTitleWrapper, true);
    }

    /**
     * Show link data block
     */
    this.toggleVisibility(this.nodes.linkDataWrapper, true);

    /**
     * Show 'unlink' icon
     */
    this.toggleVisibility(this.nodes.toolButtonLink, false);
    this.toggleVisibility(this.nodes.toolButtonUnlink, true);
    this.nodes.toolButtonUnlink.classList.add(this.CSS.isActive);
  }

  /**
   * Show or hide target element
   *
   * @param {HTMLElement} element — target element
   * @param {boolean} isVisible — visibility state
   */
  toggleVisibility(element, isVisible = true) {
    /**
     * If not "isVisible" then add "hidden" class
     */
    element.classList.toggle(this.CSS.hidden, !isVisible);
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
     * Compose query string
     *
     * @type {string}
     */
    const queryString = new URLSearchParams({ [this.searchQueryParam]: searchString }
    ).toString();

    try {
      /**
       * Get raw search data
       */
      const searchResponseRaw = await fetch(`${this.searchEndpointUrl}?${queryString}`);

      /**
       * Get JSON decoded data
       */
      const searchResponse = await searchResponseRaw.json();

      if (searchResponse && searchResponse.success) {
        return searchResponse.items;
      }
    } catch (e) {
      notifier.show({
        message: `${DICTIONARY.searchRequestError} "${e.message}"`,
        style: 'error',
      });
    }

    return [];
  }

  /**
   * Do we need to send requests to the server
   *
   * @returns {boolean}
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
