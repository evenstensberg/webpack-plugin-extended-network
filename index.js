'use strict';
const chalk = require('chalk');
const path = require('path');

const printHeaderBasedOnWidth = (title) => {
  const half = Math.round(process.stdout.columns / 2);
  for (let k = 0; k < process.stdout.columns; k++) {
    if (k === half) {
      process.stdout.write(title);
      k += title.length;
    }
    process.stdout.write(chalk.blue.bold('-'));
  }
};

module.exports = class NetworkPlugin {
  constructor(options) {
    this.chunkPaths = [];
    this.url = options.url || '';
  }

  apply(compiler) {
    if (this.url.length === 0) {
      if (compiler.options.devServer) {
        const port = compiler.options.devServer.port || undefined;
        const host = compiler.options.devServer.host || undefined;
        const publicPath = compiler.options.devServer.publicPath || undefined;
        if ([port, host, publicPath].includes(undefined)) {
          throw new SyntaxError('Make sure devServer has the properties port, host and publicPath');
        }
        this.url = `http://${host}:${port}`;
      } else {
        throw new SyntaxError('No URL detected nor any devServer configuration');
      }
    }
    compiler.plugin('emit', (compilation, callback) => {
      compilation.chunks.forEach(chunk => {
        chunk.files.forEach(filename => {
          this.chunkPaths.push(filename);
        });
      });
      callback();
    });

    compiler.plugin('done', () => {
      console.log("HEY")
      require('./test.js')()
    })
  }
};
