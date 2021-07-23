# Mentions

Allows searching of a user API in order to add mentions to an EditorJS instance.

## Installation

### Install via NPM

Get the package

```shell
npm i --save-dev @mrpritchett/editorjs-mentions
```

### Load from CDN

You can use package from jsDelivr CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/@mrpritchett/editorjs-mentions"></script>
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
    mention: {
      class: MentionTool,
      config: {
        endpoint: 'http://localhost:3000/',
        queryParam: 'search'
      }
    }
  },

  ...
});
```

## Config Params

Search requests will be sent to the server by `GET` requests with a search string as a query param.

List of server connection params which may be configured.

`endpoint` — URL of the server's endpoint for getting suggestions.

`queryParam` — param name to be sent with the search string.

## Server response data format

For endpoint requests server **should** answer with a JSON containing following properties:

- `success` (`boolean`) — state of processing: `true` or `false`
- `items` (`{name: string, profile_photo?: string}`) — an array of found items. Each item *must* contain `name` param. The `profile_photo`param is optional. You can also return any other fields which will be stored in a link dataset.

Content-Type: `application/json`.

```json
{
  "success": true,
  "items": [
    {
      "profile_photo": "http://placehold.it/300x200",
      "name": "John Doe",
    },
    {
      "href": "http://placehold.it/300x200",
      "name": "Jane Doe",
    }
  ]
}
```

## Output data

Marked text will be wrapped with a `span` tag.

Additional data will be store in element's dataset: `data-name`, `data-profile_photo` and other custom fields.

```json
{
    "type" : "text",
    "data" : {
        "text" : "Create a directory for your module, enter it and run <a href=\"https://codex.so/\" data-name=\"CodeX Site\">npm init</a> command."
    }
}
```

## Shortcut

By default, shortcut `CMD (CTRL) + 2` is used for pasting links as usual.
