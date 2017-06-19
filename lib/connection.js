'use strict';
const EventEmitter = require('events').EventEmitter;

class Connection {
  constructor() {
    this._lastCommandId = 0;
    this._callbacks = new Map();
    this._eventEmitter = new EventEmitter();
  }

  sendCommand(method, params = {}, cmdOpts = {}) {
    const id = ++this._lastCommandId;
    const message = JSON.stringify({id, method, params});

    this.sendRawMessage(message);
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, {resolve, reject, method, options: cmdOpts});
    });
  }
  on(eventName, cb) {
    this._eventEmitter.on(eventName, cb);
  }

  handleRawMessage(message) {
    const object = JSON.parse(message);
    if (this._callbacks.has(object.id)) {
      const callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);

      return callback.resolve(Promise.resolve().then(_ => {
        return object.result;
      }));
    } else {
      this.emitNotification(object.method, object.params);
    }
  }
  emitNotification(method, params) {
    this._eventEmitter.emit('notification', {method, params});
  }
}

module.exports = Connection;
