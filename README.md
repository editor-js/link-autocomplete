<!--

TODO
- add arrows and enter integration
- simplify event listening 
- refactor the code

-->
# Link Autocomplete

Upgraded version of base inline link tool with your server's search.

![](assets/example.gif)

## Installation

### Install via NPM

Get the package

```shell
npm i --save-dev @editorjs/link-autocomplete
```

```shell
yarn add -D @editorjs/link-autocomplete
```

### Load from CDN

You can use package from jsDelivr CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/@editorjs/link-autocomplete"></script>
```

## Usage

Add a new Tool to the `tools` property of the Editor.js initial config.

```javascript
var editor = EditorJS({
  ...
 
  /**
   * Tools list
   */
  tools: {
    LinkAutocomplete: {
      class: LinkAutocomplete,
      config: {
        endpointUrl: 'http://localhost:3000/',
        queryParam: 'search'
      }
    }
  },
  
  ...
});
```

## Config Params

There is a one param which may be configured.

`endpointUrl` — url to the server's endpoint for getting suggestions as links.

`queryParam` — param name to be send with search string.

If there is no `endpointUrl` then tool will work only for pasted links.

## Server response data format

For endpoint requests server should answer with a JSON data
as array of link items. `name` and `href` params are required
for each item. `description` param is optional.

Content-Type: `application/json`.

You can also return any other fields which will be stored in a link dataset.

```
[
  {
    href: `https://codex.so/media`,
    name: `The first item`,
    description: ''
  },
  {
    href: `https://codex.so/editor`,
    name: `The second item`
    description: ''
  },
  ...
]
```

## Output data

Marked text will be wrapped with a `a` tag as a usual link.

```json
{
    "type" : "text",
    "data" : {
        "text" : "Create a directory for your module, enter it and run <a href=\"https://codex.so/\" data-name=\"CodeX Site\">npm init</a> command."
    }
}
```

## I18n

There is a few phrases to be translated. 

UI items:

- `Paste or search` — placeholder for an input field if server endpoint passed.
- `Paste a link` — placeholder for the same field if server endpoint is missing.

Error messages:

- `Cannot process search request because of` — message before error's text in notification for a bad server response.
- `Server responded with invalid data` — bad server's response
- `Link URL is invalid` — pasted link url is bad 

```
i18n: {
  messages: {
    tools: {
      LinkAutocomplete: {
        'Paste or search': '...',
        'Paste a link': '...',
        'Cannot process search request because of': '...',
        'Server responded with invalid data': '...',
        'Link URL is invalid': '...'
      }
    }
  }
},
```
