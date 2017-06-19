const NetworkRecorder = require('./network-recorder');
const EventEmitter = require('events').EventEmitter;
const DevtoolsLog = require('./devtools-log');

const DEFAULT_PAUSE_AFTER_LOAD = 0;
const DEFAULT_NETWORK_QUIET_THRESHOLD = 5000;
const DEFAULT_PAUSE_AFTER_NETWORK_QUIET = 0;

const _uniq = arr => Array.from(new Set(arr));

module.exports = class Processor {
  static get MAX_WAIT_FOR_FULLY_LOADED() {
    return 30 * 1000;
  }
  constructor(connection) {
    this._traceEvents = [];
    this._traceCategories = Processor.traceCategories;
    this._eventEmitter = new EventEmitter();
    this._connection = connection;
    this._devtoolsLog = new DevtoolsLog(/^(Page|Network)\./);
    this._domainEnabledCounts = new Map();
    this._networkStatusMonitor = null;

    connection.on('notification', event => {
      this._devtoolsLog.record(event);
      if (this._networkStatusMonitor) {
        this._networkStatusMonitor.dispatch(event.method, event.params);
      }
      this._eventEmitter.emit(event.method, event.params);
    });
  }

  static get traceCategories() {
    return [
      '-*',
      'toplevel',
      'blink.console',
      'blink.user_timing',
      'benchmark',
      'loading',
      'latencyInfo',
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
      'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-devtools.screenshot'
    ];
  }
  connect() {
    return this._connection.connect();
  }
  on(eventName, cb) {
    this._eventEmitter.on(eventName, cb);
  }

  once(eventName, cb) {
    this._eventEmitter.once(eventName, cb);
  }

  off(eventName, cb) {
    this._eventEmitter.removeListener(eventName, cb);
  }

  sendCommand(method, params, cmdOpts) {
    const domainCommand = /^(\w+)\.(enable|disable)$/.exec(method);
    if (domainCommand) {
      const enable = domainCommand[2] === 'enable';
    }

    return this._connection.sendCommand(method, params, cmdOpts);
  }


  _waitForNetworkIdle(networkQuietThresholdMs, pauseAfterNetworkQuietMs) {
    let idleTimeout;
    let cancel;

    const promise = new Promise((resolve, reject) => {
      const onIdle = () => {
        this._networkStatusMonitor.once('network-2-busy', onBusy);
        idleTimeout = setTimeout(_ => {
          cancel();
          resolve();
        }, networkQuietThresholdMs);
      };

      const onBusy = () => {
        this._networkStatusMonitor.once('network-2-idle', onIdle);
        clearTimeout(idleTimeout);
      };

      const domContentLoadedListener = () => {
        if (this._networkStatusMonitor.is2Idle()) {
          onIdle();
        } else {
          onBusy();
        }
      };

      this.once('Page.domContentEventFired', domContentLoadedListener);
      cancel = () => {
        clearTimeout(idleTimeout);
        this.off('Page.domContentEventFired', domContentLoadedListener);
        this._networkStatusMonitor.removeListener('network-2-busy', onBusy);
        this._networkStatusMonitor.removeListener('network-2-idle', onIdle);
      };
    }).then(() => {
      return new Promise(resolve => setTimeout(resolve, pauseAfterNetworkQuietMs));
    });

    return {
      promise,
      cancel
    };
  }

  _waitForLoadEvent(pauseAfterLoadMs) {
    let loadListener;
    let loadTimeout;

    const promise = new Promise((resolve, reject) => {
      loadListener = function() {
        loadTimeout = setTimeout(resolve, pauseAfterLoadMs);
      };
      this.once('Page.loadEventFired', loadListener);
    });
    const cancel = () => {
      this.off('Page.loadEventFired', loadListener);
      clearTimeout(loadTimeout);
    };

    return {
      promise,
      cancel
    };
  }

  _waitForFullyLoaded(pauseAfterLoadMs, networkQuietThresholdMs, pauseAfterNetworkQuietMs,
      maxWaitForLoadedMs) {
    let maxTimeoutHandle;

    const waitForLoadEvent = this._waitForLoadEvent(pauseAfterLoadMs);
    const waitForNetworkIdle = this._waitForNetworkIdle(networkQuietThresholdMs,
        pauseAfterNetworkQuietMs);

    const loadPromise = Promise.all([
      waitForLoadEvent.promise,
      waitForNetworkIdle.promise
    ]).then(() => {
      return function() {
        clearTimeout(maxTimeoutHandle);
      };
    });
    const maxTimeoutPromise = new Promise((resolve, reject) => {
      maxTimeoutHandle = setTimeout(resolve, maxWaitForLoadedMs);
    }).then(_ => {
      return function() {
        waitForLoadEvent.cancel();
        waitForNetworkIdle.cancel();
      };
    });

    return Promise.race([
      loadPromise,
      maxTimeoutPromise
    ]).then(cleanup => cleanup());
  }

  _beginNetworkStatusMonitoring(startingUrl) {
    this._networkStatusMonitor = new NetworkRecorder([]);
    return this.sendCommand('Network.enable');
  }

  _endNetworkStatusMonitoring() {
    this._networkStatusMonitor = null;
    const finalUrl = this._monitoredUrl;
    this._monitoredUrl = null;
    return finalUrl;
  }

  gotoURL(url) {
    const waitForLoad = true;
    const disableJS = false;
    const pauseAfterLoadMs = DEFAULT_PAUSE_AFTER_LOAD;
    const networkQuietThresholdMs = DEFAULT_NETWORK_QUIET_THRESHOLD;
    const pauseAfterNetworkQuietMs = DEFAULT_PAUSE_AFTER_NETWORK_QUIET;
    const maxWaitMs = Processor.MAX_WAIT_FOR_FULLY_LOADED;

    return this._beginNetworkStatusMonitoring(url)
      .then(_ => this.sendCommand('Page.enable'))
      .then(_ => this.sendCommand('Emulation.setScriptExecutionDisabled', {value: disableJS}))
      .then(_ => this.sendCommand('Page.navigate', {url}))
      .then(_ => waitForLoad && this._waitForFullyLoaded(pauseAfterLoadMs,
          networkQuietThresholdMs, pauseAfterNetworkQuietMs, maxWaitMs))
      .then(_ => this._endNetworkStatusMonitoring());
  }
  beginTrace(flags) {
    const additionalCategories = (flags && flags.additionalTraceCategories &&
        flags.additionalTraceCategories.split(',')) || [];
    const traceCategories = this._traceCategories.concat(additionalCategories);
    const tracingOpts = {
      categories: _uniq(traceCategories).join(','),
      transferMode: 'ReturnAsStream',
      options: 'sampling-frequency=10000'
    };


    return this.sendCommand('Page.enable')
      .then(_ => this.sendCommand('Tracing.start', tracingOpts));
  }

  beginDevtoolsLog() {
    this._devtoolsLog.reset();
    this._devtoolsLog.beginRecording();
  }
  endDevtoolsLog() {
    this._devtoolsLog.endRecording();
    return this._devtoolsLog.messages;
  }
}
