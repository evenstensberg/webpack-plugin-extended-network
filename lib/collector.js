'use strict';
const Processor = require('./processor.js');

module.exports = function Collector(connection, opts) {
  opts.flags = opts.flags || {};
  opts.processor = new Processor(connection);
  return opts.processor.connect()
    .then(_ => opts.processor.beginTrace(opts.flags))
    .then(_ => opts.processor.beginDevtoolsLog())
    .then(_ => opts.processor.gotoURL(opts.url))
    .then(_ => {
      opts.processor._devtoolsLog.messages.forEach( (devtoolmsg) => {
        if (devtoolmsg.params.type === 'Script') {
          opts.chunkPaths.forEach( (chunk) => {
            if (devtoolmsg.params.response.url.indexOf(chunk) >= 0) {
              devtoolmsg.chunkName = chunk;
              opts.processor._chunkNames.push(chunk);
              opts.processor._chunkObjects.push(devtoolmsg);
            }
          });
        }
      });
    })
    .then(_ => opts.processor.getScriptTags())
    .then(_ => opts.processor._chunkObjects);
};
