<!--

TODO:
- add example gif to readme
- add icon
- add link removing
- add loader 
- if no this.config.endpointUrl then do not try to send a request

-->

# Magic Citation

Upgraded version of base inline link tool with your server's search.

![](assets/example.gif)

## Installation

### Install via NPM

Get the package

```shell
npm i --save-dev @editorjs/magic-citation
```

```shell
yarn add -D @editorjs/magic-citation
```

### Load from CDN

You can use package from jsDelivr CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/@editorjs/magic-citation"></script>
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
    MagicCitation: {
      class: MagicCitation,
      config: {
        endpointUrl: 'http://localhost:3000/',
      }
    }
  },
  
  ...
});
```

## Config Params

There is a one param which may be configured.

`endpointUrl` — url to the server's endpoint for getting suggestions as links.

If there is no `endpointUrl` then tool will work only for pasted links.

## Server response data format

For endpoint requests server should answer with a JSON data
as array of link items. Title and link params are required
for each item.

```
[
  {
    title: `The first item`,
    link: `https://codex.so/media`
  },
  {
    title: `The second item`,
    link: `https://codex.so/editor`
  },
  ...
]
```

Content-Type: `application/json`

## Output data

Marked text will be wrapped with a `a` tag as a usual link.

```json
{
    "type" : "text",
    "data" : {
        "text" : "Create a directory for your module, enter it and run <a href=\"https://codex.so/\">npm init</a> command."
    }
}
```
