const launchHeadless = require('./core/headless-launcher');

module.exports = class NetworkPlugin {
  constructor(options) {
    this.chunkPaths = [];
    this.url = options.url || '';
    this.flags = options.flags || [];
  }
  apply(compiler) {
    if(this.url.length === 0) {
        if(compiler.options.devServer) {
          const port = compiler.options.devServer.port || undefined;
          const host =  compiler.options.devServer.host || undefined;
          const publicPath = compiler.options.devServer.publicPath || undefined;
          if([port,host,publicPath].includes(undefined)) {
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
          this.chunkPaths.push(filename)
        });
      });
      callback();
    });

    compiler.plugin('done', () => {
      launchHeadless(this)
    });

  }
}
