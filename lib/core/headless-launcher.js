const launchChrome = require('chrome-launcher');
const ChromeProtocol = require('./protocol');
const Collector = require('./collector');

const connectProtocol = (port) => {
  return new ChromeProtocol(port);
}
module.exports = (webpackOptions) => {

   const googleChrome = launchChrome.launch({
     port: 0,
     chromeFlags: webpackOptions.flags.concat('-headless')
   });

   return googleChrome
   .then(chromeStats => {

     const connection = connectProtocol(chromeStats.port);
     return Collector.start(connection, webpackOptions)
     .then(_ => {
       return Promise.resolve(googleChrome)

       .then(chromeStats => {
         return chromeStats.kill()
       });

     });

   });
 }
