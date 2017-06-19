'use strict';
const Connection = require('./connection.js');
const WebSocket = require('ws');
const http = require('http');

const hostname = 'localhost';

module.exports = class CriConnection extends Connection {
  constructor(port) {
    super();
    this.port = port;
  }
  connect() {
    return this._runJsonCommand('new')
      .then(response => this._connectToSocket(response));
  }

  _connectToSocket(response) {
    const url = response.webSocketDebuggerUrl;
    this._pageId = response.id;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, {
        perMessageDeflate: false
      });
      ws.on('open', () => {
        this._ws = ws;
        resolve();
      });
      ws.on('message', data => this.handleRawMessage(data));
    });
  }

  _runJsonCommand(command) {
    return new Promise((resolve, reject) => {
      http.get({
        hostname: hostname,
        port: this.port,
        path: '/json/' + command
      }, response => {
        let data = '';
        response.on('data', chunk => {
          data += chunk;
        });
        response.on('end', _ => {
          if (response.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
              return;
            } catch (e) {
              if (data === 'Target is closing' || data === 'Target activated') {
                return resolve({message: data});
              }
              return reject(e);
            }
          }
          reject(new Error(`Protocol JSON API error (${command}), status: ${response.statusCode}`));
        });
      });
    });
  }
  sendRawMessage(message) {
    this._ws.send(message);
  }
};
