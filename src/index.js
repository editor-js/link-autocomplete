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
    this.api = api;
    this.config = config;

    this.searchEndpoint = this.config.endpointUrl;

    this.nodes = {
      toolButton: null,
      actionsWrapper: null,
      searchInput: null,
      searchResults: null,
      loader: null
    }

    this.state = false;

    this.tagName = 'A';

    /**
     * Enter key code
     */
    this.ENTER_KEY = 13;
  }

  render() {
    this.nodes.toolButton = document.createElement('div');
    this.nodes.toolButton.textContent = 'M';

    this.nodes.toolButton.classList.add(this.CSS.button, this.CSS.toolButtonWrapper);

    return this.nodes.toolButton;
  }

  /**
   * Input for the link
   */
  renderActions() {
    this.nodes.actionsWrapper = document.createElement('DIV');

    this.nodes.searchInput = document.createElement('INPUT');
    this.nodes.searchInput.placeholder = 'Add a link or search resources';
    this.nodes.searchInput.classList.add(this.CSS.input, this.CSS.inputWrapper);
    // this.nodes.searchInput.classList.add(this.CSS.inputHidden

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
          searchItem.innerText = item.title;

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
    this.wrapTextToLink(item.link);
  }

  enterPressed(event) {
    console.log('EVENT PRESSED');
    let value = this.nodes.searchInput.value || '';

    this.wrapTextToLink(value);
  }

  wrapTextToLink(linkValue) {
    // @todo add protocol to link

    console.log('LINK to be pasted', linkValue);

    let link = document.createElement(this.tagName);

    link.appendChild(this.range.extractContents());
    link.href = linkValue;

    this.range.insertNode(link);

    // @todo hide toolbar
    this.nodes.actionsWrapper.hidden = true;
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
    if (!range) {
      return;
    }

    // @todo show icon "remove link"

    this.range = range;

    this.nodes.searchInput.classList.add(this.CSS.inputShowed);
  }

  checkState(selection) {
    const text = selection.anchorNode;

    if (!text) {
      return;
    }

    const anchorElement = text instanceof Element ? text : text.parentElement;

    this.state = !!anchorElement.closest(this.tagName);
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
    const searchData = (await axios.get(this.searchEndpoint, {
      params: {
        searchString
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
      searchItem: 'ce-magic-citation__search-item'
    };
  }
}
