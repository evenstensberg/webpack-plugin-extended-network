'use strict';
const launchHeadless = require('./lib/headless-launcher');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

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
    this.flags = options.flags || [];
    this.headless = (options.headless === false) ? false : true;
    this.printJSON = (options.printJSON === true) ? true : false;
    this.printPath = options.printPath || path.join(process.cwd() + '/network-records.json');
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
      launchHeadless(this).then(chunkInfo => {
        process.stdout.write('\n' + chalk.bold('webpack-plugin-extended-network:') + '\n\n');
        chunkInfo.forEach( (chunk) => {
          const scriptInjection = Object.keys(chunk.attributes).map( (elem, index) => {
            if (index % 2 === 0) {
              return chunk.attributes[index] + '=' + chunk.attributes[index + 1];
            }
          }).filter(val => val);
          process.stdout.write(chalk.red('Asset: ') + chunk.chunkName + '\n\n');
          printHeaderBasedOnWidth('General');
          process.stdout.write('\n\n' + chalk.bold('Type: ') +
            chunk.params.type + '\n' +
            chalk.bold('Resource URL: ') + chunk.params.response.url + '\n' +
            chalk.bold('Status: ') + chunk.params.response.status + '\n' +
            chalk.bold('Status Text: ') + chunk.params.response.statusText + '\n\n'
          );
          printHeaderBasedOnWidth('Headers');
          process.stdout.write('\n\n');
          Object.keys(chunk.params.response.headers).forEach(header => {
            process.stdout.write(
              '\n' + chalk.bold(header + ': ') + chunk.params.response.headers[header] + '\n'
            );
          });
          process.stdout.write('\n');
          printHeaderBasedOnWidth('Other');
          process.stdout.write('\n\n');
          process.stdout.write(
            chalk.bold('Served from Disk Cache: ') + chunk.params.response.fromDiskCache + '\n' +
            chalk.bold('Served from Service Worker: ') +
            chunk.params.response.fromServiceWorker + '\n' +
            chalk.bold('Protocol: ') + chunk.params.response.protocol + '\n' +
            chalk.bold('Security State: ') + chunk.params.response.securityState + '\n'
          );
          process.stdout.write(chalk.bold('HTML tag: ') + '< ' + chunk.injectionType + ' ');
          scriptInjection.forEach( (item) => {
            process.stdout.write(item + ' ');
          });
          process.stdout.write('>\n\n');
          for (let k = 0; k < process.stdout.columns; k++) {
            process.stdout.write(chalk.blue.bold('#'));
          }
          process.stdout.write('\n\n');
        });
        if (this.printJSON === true) {
          fs.writeFileSync(this.printPath, JSON.stringify(chunkInfo, null, 2), 'utf-8');
        }
      });
    });
  }
};
