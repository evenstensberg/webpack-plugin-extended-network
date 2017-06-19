'use strict';
const launchChrome = require('chrome-launcher');
const ChromeProtocol = require('./protocol');
const collect = require('./collector');

const connectProtocol = (port) => {
  return new ChromeProtocol(port);
};
module.exports = webpackOptions => {
  const googleChrome = launchChrome.launch({
    port: 0,
    chromeFlags: webpackOptions.flags.concat('-headless')
  });
  return googleChrome.then(chromeStats => {
    const connection = connectProtocol(chromeStats.port);
    return collect(connection, webpackOptions)
      .then(chromeInfo => {
        Promise.resolve(googleChrome).then(chromeStats => chromeStats.kill());
        return chromeInfo;
      });
  });
};
