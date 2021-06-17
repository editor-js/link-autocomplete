/**
 * Build styles
 */
import './../styles/index.pcss';

import axios from "axios";

/**
 * MagicCitation Tool for EditorJS
 */
export default class MagicCitation {
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
      a: {
        href: true,
        target: '_blank',
        rel: 'nofollow',
      },
    };
  }

  /**
   * Initialize basic data
   * @param api
   */
  constructor({ config, api }) {
    console.log('constructor()');

    this.api = api;
    this.config = config;

    this.searchEndpointUrl = this.config.endpointUrl;
    this.searchQueryParam = this.config.queryParam;

    this.nodes = {
      toolButtons: null,
      toolButtonLink: null,
      toolButtonUnlink: null,
      actionsWrapper: null,
      searchInput: null,
      searchResults: null,
      loader: null
    }

    this.tagName = 'A';

    /**
     * Enter key code
     */
    this.ENTER_KEY = 13;
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
    this.nodes.toolButtons = document.createElement('div');
    this.nodes.toolButtons.classList.add(this.CSS.button, this.CSS.toolButtonWrapper);

    /**
     * Create Link button
     * @type {HTMLDivElement}
     */
    this.nodes.toolButtonLink = document.createElement('div');
    // this.nodes.toolButtonLink.innerHTML += 'M';
    this.nodes.toolButtonLink.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 10" width="14" height="10">\n' +
        '  <path d="M6 0v2H5a3 3 0 000 6h1v2H5A5 5 0 115 0h1zm2 0h1a5 5 0 110 10H8V8h1a3 3 0 000-6H8V0zM5 4h4a1 1 0 110 2H5a1 1 0 110-2z"/>\n' +
        '</svg>\n';
    this.nodes.toolButtons.appendChild(this.nodes.toolButtonLink);

    /**
     * Create Unlink button
     * @type {HTMLDivElement}
     */
    this.nodes.toolButtonUnlink = document.createElement('div');
    // this.nodes.toolButtonUnlink.innerHTML += 'N';
    this.nodes.toolButtonUnlink.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 11" width="15" height="11">\n' +
        '  <path d="M13.073 2.099l-1.448 1.448A3 3 0 009 2H8V0h1c1.68 0 3.166.828 4.073 2.099zM6.929 4l-.879.879L7.172 6H5a1 1 0 110-2h1.929zM6 0v2H5a3 3 0 100 6h1v2H5A5 5 0 115 0h1zm6.414 7l2.122 2.121-1.415 1.415L11 8.414l-2.121 2.122L7.464 9.12 9.586 7 7.464 4.879 8.88 3.464 11 5.586l2.121-2.122 1.415 1.415L12.414 7z"/>\n' +
        '</svg>\n';
    this.nodes.toolButtons.appendChild(this.nodes.toolButtonUnlink);
    this.nodes.toolButtonUnlink.classList.add(this.CSS.hidden);

    return this.nodes.toolButtons;
  }

  /**
   * Render actions element
   *
   * @return {HTMLDivElement}
   */
  renderActions() {
    console.log('renderActions()');

    this.nodes.actionsWrapper = document.createElement('DIV');

    this.nodes.searchInput = document.createElement('INPUT');
    this.nodes.searchInput.placeholder = 'Add a link or search resources';
    this.nodes.searchInput.classList.add(this.CSS.input, this.CSS.inputWrapper);

    this.nodes.searchResults = document.createElement('DIV');

    let typingTimer;

    this.nodes.searchInput.addEventListener('keydown', (event) => {
      if (event.keyCode !== this.ENTER_KEY) {
        return;
      }

      const searchString = event.target.value;

      if (!searchString || !searchString.trim()) {
        return;
      }

      this.enterPressed(event);
    })

    this.nodes.searchInput.addEventListener('input', (event) => {
      const searchString = event.target.value;

      console.log('checkForValidUrl', this.checkForValidUrl(searchString));

      clearTimeout(typingTimer);

      if (!searchString || !searchString.trim()) {
        this.clearSearchList();
        return;
      }

      typingTimer = setTimeout(async () => {
        const searchData = await this.searchRequest(searchString);

        this.clearSearchList();

        searchData.forEach(item => {
          console.log('search item', item);

          const searchItem = document.createElement('DIV');

          searchItem.classList.add(this.CSS.searchItem);
          searchItem.innerText = item.name;

          searchItem.addEventListener('click', (event) => {
            this.searchItemClick(event, item);
          });

          this.nodes.searchResults.appendChild(searchItem);
        })
      }, 800);
    });

    this.nodes.actionsWrapper.appendChild(this.nodes.searchInput);
    this.nodes.actionsWrapper.appendChild(this.nodes.searchResults);

    return this.nodes.actionsWrapper;
  }

  searchItemClick(event, item) {
    const href = item.href;

    delete item.href;

    this.wrapTextToLink(href, item);
  }

  /**
   * Enter was pressed
   * Then try to process input as pasted link
   *
   * @param {Event} event
   */
  enterPressed(event) {
    let value = this.nodes.searchInput.value || '';

    if (this.checkForValidUrl(value)) {
      this.wrapTextToLink(value);
      return;
    }

    console.error('Link is not a valid');
  }

  wrapTextToLink(linkValue, additionalData) {
    let link = document.createElement(this.tagName);

    link.appendChild(this.range.extractContents());
    link.href = linkValue;

    Object.keys(additionalData).forEach(key => {
      link.dataset[key] = additionalData[key];
    })

    this.range.insertNode(link);

    this.api.inlineToolbar.close();
  }

  clearSearchList() {
    while (this.nodes.searchResults.firstChild) {
      this.nodes.searchResults.firstChild.remove()
    }
  }

  /**
   * Handle clicks on the Inline Toolbar icon
   *
   * @param {Range} range - range to wrap with link
   */
  surround(range) {
    console.log('surround()');

    if (!range) {
      return;
    }

    this.range = range;


    // const selectedText = window.getSelection().toString();
    // this.nodes.searchInput.value = selectedText;
    this.nodes.searchInput.classList.add(this.CSS.inputShowed);



    if (this.nodes.toolButtonUnlink.classList.contains(this.CSS.isActive)) {
      const anchorElement = range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
      const linkElement = anchorElement.closest(this.tagName);

      const spanContent = document.createElement('SPAN');

      spanContent.innerHTML = linkElement.innerHTML;

      linkElement.parentNode.replaceChild(spanContent, linkElement);
      this.api.inlineToolbar.close();
    }
  }

  /**
   * Check for a tool's state
   *
   * @param selection
   */
  checkState(selection) {
    console.log('checkState()');

    const text = selection.anchorNode;

    if (!text) {
      return;
    }

    const anchorElement = text instanceof Element ? text : text.parentElement;
    const closestTagElement = anchorElement.closest(this.tagName);

    // this.nodes.searchInput.value = anchorElement.innerText;
    // this.nodes.searchInput.classList.add(this.CSS.inputShowed);

    if (!!anchorElement.closest(this.tagName)) {
      /**
       * Fill input value with link href
       */
      const hrefAttr = anchorElement.getAttribute('href');

      this.nodes.searchInput.value = hrefAttr !== 'null' ? hrefAttr : '';
      this.nodes.searchInput.classList.add(this.CSS.inputShowed);

      this.nodes.toolButtonLink.classList.add(this.CSS.hidden);
      this.nodes.toolButtonUnlink.classList.remove(this.CSS.hidden);
      this.nodes.toolButtonUnlink.classList.add(this.CSS.isActive);
    }
  }

  checkForValidUrl(textString) {
    const regex = new RegExp(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/);

    return regex.test(textString);
  }

  /**
   * Send search request and update rows in table
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
   * Styles
   *
   * @private
   */
  get CSS() {
    return {
      toolButtonWrapper: 'ce-magic-citation',
      inputWrapper: 'ce-magic-citation__input',
      inputHidden: 'ce-magic-citation__input--hidden',
      button: 'ce-inline-tool',
      buttonModifier: 'ce-inline-tool--link',
      buttonUnlink: 'ce-inline-tool--unlink',
      input: 'ce-inline-tool-input',
      inputShowed: 'ce-inline-tool-input--showed',
      searchItem: 'ce-magic-citation__search-item',
      isActive: 'ce-inline-tool--active',
      hidden: 'ce-magic-citation__hidden'
    };
  }
}
