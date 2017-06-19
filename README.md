# webpack-plugin-extended-network

webpack plugin for analyzing how your bundle performs under the chrome protocol. This plugin is experimental and the API might change in the future.

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
