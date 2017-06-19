const Processor = require('./processor.js');

module.exports = class Collector {

  static start(connection, opts) {

    opts.flags = opts.flags || {};
    opts.initialUrl = opts.url;

    opts.processor = new Processor(connection);
    return opts.processor.connect()
      .then(_ => opts.processor.beginTrace(opts.flags))
      .then(_ => opts.processor.beginDevtoolsLog())
      .then(_ => opts.processor.gotoURL(opts.url))
      .then(_ => {
        opts.processor._devtoolsLog.messages.forEach( (nice) => {
          if(nice.params.type === 'Script') {
            opts.chunkPaths.forEach( (chunk) => {
              if(nice.params.response.url.indexOf(chunk) >= 0) {

                const bundleSize = nice.params.response.headers['Content-Length'] / 1000
                const statusSignal = nice.params.response.status
                const statusText = nice.params.response.statusText
                const mimeType = nice.params.response.mimeType
                const fromDiskCache = nice.params.response.fromDiskCache
                const fromSW = nice.params.response.fromServiceWorker
                const type = nice.params.type
                console.log(nice)
                return;
              }
            })
          }
        })
      })
  }
}
