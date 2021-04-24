# webpack-plugin-extended-network

webpack plugin for analyzing how your bundle performs in a browser. This plugin is experimental and the API might change in the future. The plugin uses Puppeteer and works with code-splitting and regular entries.

![Screenshot](https://github.com/ev1stensberg/webpack-plugin-extended-network/blob/master/assets/screenshot.png)

## Installation

Install the plugin through npm:

`$ npm install --save webpack-plugin-extended-network`


## Usage without devServer
```js
const NetworkPlugin = require('webpack-plugin-extended-network');

module.exports = {
  ...
  plugins: [
    new NetworkPlugin({
      url: 'http://localhost:3000'
    })
  ]
}
```

## Usage with devServer

```js
const NetworkPlugin = require('webpack-plugin-extended-network');

module.exports = {
  ...
  plugins: [
    new NetworkPlugin()
  ],
  devServer: {
    ...
    port: 3000
  }
}
```

## Contributing

Send a PR, post an issue, would love help!
