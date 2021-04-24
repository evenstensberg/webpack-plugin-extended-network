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

class NetworkPlugin {
  constructor(options) {
    this.chunkPaths = [];
    this.url = options.url || null;
    
  }

  apply(compiler) {
    if (!this.url) {
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
    compiler.hooks.done.tapAsync(  {
      name: "webpack-network-plugin",
      stage: 9999,
    }, async () => {
      const runner = require('./test.js');
      await runner(this.chunkPaths, this.url);
    })

    compiler.hooks.emit.tap('NetworkPlugin', (compilation) => {
      compilation.chunks.forEach(chunk => {
        chunk.files.forEach(filename => {
          this.chunkPaths.push(filename);
        });
      });
    });

  }
};

module.exports = NetworkPlugin;