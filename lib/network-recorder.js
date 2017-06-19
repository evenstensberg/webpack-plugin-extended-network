'use strict';
const NetworkManager = require('./web-inspector').NetworkManager;
const EventEmitter = require('events').EventEmitter;

class NetworkRecorder extends EventEmitter {
  constructor(recordArray) {
    super();
    this._records = recordArray;
    this.networkManager = NetworkManager.createWithFakeTarget();
    this.startedRequestCount = 0;
    this.finishedRequestCount = 0;
    this.networkManager.addEventListener(this.EventTypes.RequestStarted,
      this.onRequestStarted.bind(this));
    this.networkManager.addEventListener(this.EventTypes.RequestFinished,
      this.onRequestFinished.bind(this));
  }

  get EventTypes() {
    return NetworkManager.Events;
  }

  activeRequestCount() {
    return this.startedRequestCount - this.finishedRequestCount;
  }

  isIdle() {
    return this.activeRequestCount() === 0;
  }

  is2Idle() {
    return this.activeRequestCount() <= 2;
  }

  onRequestStarted(request) {
    this.startedRequestCount++;
    this._records.push(request.data);

    const activeCount = this.activeRequestCount();

    if (activeCount === 1) {
      this.emit('networkbusy');
    }
    if (activeCount === 3) {
      this.emit('network-2-busy');
    }
  }

  onRequestFinished(request) {
    this.finishedRequestCount++;
    this.emit('requestloaded', request.data);

    if (this.isIdle()) {
      this.emit('networkidle');
    }

    if (this.is2Idle()) {
      this.emit('network-2-idle');
    }
  }

  onRequestWillBeSent(data) {
    this.networkManager._dispatcher.requestWillBeSent(data.requestId,
      data.frameId, data.loaderId, data.documentURL, data.request,
      data.timestamp, data.wallTime, data.initiator, data.redirectResponse,
      data.type);
  }

  onRequestServedFromCache(data) {
    this.networkManager._dispatcher.requestServedFromCache(data.requestId);
  }

  onResponseReceived(data) {
    this.networkManager._dispatcher.responseReceived(data.requestId,
      data.frameId, data.loaderId, data.timestamp, data.type, data.response);
  }

  onDataReceived(data) {
    this.networkManager._dispatcher.dataReceived(data.requestId, data.timestamp,
      data.dataLength, data.encodedDataLength);
  }

  onLoadingFinished(data) {
    this.networkManager._dispatcher.loadingFinished(data.requestId,
      data.timestamp, data.encodedDataLength);
  }

  onLoadingFailed(data) {
    this.networkManager._dispatcher.loadingFailed(data.requestId,
      data.timestamp, data.type, data.errorText, data.canceled,
      data.blockedReason);
  }

  onResourceChangedPriority(data) {
    this.networkManager._dispatcher.resourceChangedPriority(data.requestId,
      data.newPriority, data.timestamp);
  }

  dispatch(method, params) {
    if (!method.startsWith('Network.')) {
      return;
    }

    switch (method) {
      case 'Network.requestWillBeSent': return this.onRequestWillBeSent(params);
      case 'Network.requestServedFromCache': return this.onRequestServedFromCache(params);
      case 'Network.responseReceived': return this.onResponseReceived(params);
      case 'Network.dataReceived': return this.onDataReceived(params);
      case 'Network.loadingFinished': return this.onLoadingFinished(params);
      case 'Network.loadingFailed': return this.onLoadingFailed(params);
      case 'Network.resourceChangedPriority': return this.onResourceChangedPriority(params);
      default: return;
    }
  }
  static recordsFromLogs(devtoolsLog) {
    const records = [];
    const nr = new NetworkRecorder(records);
    devtoolsLog.forEach(message => {
      nr.dispatch(message.method, message.params);
    });
    return records;
  }
}

module.exports = NetworkRecorder;
