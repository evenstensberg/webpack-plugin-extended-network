# webpack-plugin-extended-network

webpack plugin for analyzing how your bundle performs in a browser. This plugin is experimental and the API might change in the future. The plugin uses chrome-protocol and works with code-splitting and regular entries.

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

## Additional Usage

For additional resources on flags see:
 - http://peter.sh/experiments/chromium-command-line-switches/
 - https://github.com/GoogleChrome/lighthouse/tree/master/chrome-launcher


```js
const NetworkPlugin = require('webpack-plugin-extended-network');

module.exports = {
  ...
  plugins: [
    new NetworkPlugin({
      flags: ['--disable-gpu'],
      headless: false // default is true
    })
  ],
  devServer: {
    ...
    port: 3000
  }
}
```

## Handy Options

```js
const NetworkPlugin = require('webpack-plugin-extended-network');
const path = require('path');

module.exports = {
  ...
  plugins: [
    new NetworkPlugin({
      printJSON: true,
      printPath: path.join(__dirname, '..', 'forest', 'gump')
      // defaults to path.join(process.cwd() + /network-records.json)
    })
  ],
  devServer: {
    ...
    port: 3000
  }
}
```

## Further Work

+ Extensive network records with page redirects
+ Add metrics for Time to Interactive and First meaningful paint

## Nice Links

- [Lighthouse](https://github.com/GoogleChrome/lighthouse)
- [Chrome Launcher](https://github.com/GoogleChrome/lighthouse/tree/master/chrome-launcher)
- [Chrome Protocol](https://chromedevtools.github.io/devtools-protocol/)

I'd like to thank the authors of lighthouse for making a great tool, most of this work is inspired by them. No copyright infringement intended.

## Contributing

Send a PR, post an issue, would love help!
