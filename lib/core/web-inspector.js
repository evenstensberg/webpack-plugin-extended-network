module.exports = (function() {
  if (global.WebInspector) {
    return global.WebInspector;
  }

  if (global.self !== global) {
    global.self = global;
  }

  if (typeof global.window === 'undefined') {
    global.window = global;
  }

  global.Runtime = {};
  global.Runtime.experiments = {
    isEnabled(experimentName) {
      switch (experimentName) {
        case 'timelineLatencyInfo':
          return true;
        default:
          return false;
      }
    }
  };
  global.Runtime.queryParam = function(arg) {
    switch (arg) {
      case 'remoteFrontend':
        return false;
      case 'ws':
        return false;
      default:
        throw Error('Mock queryParam case not implemented.');
    }
  };

  global.TreeElement = {};
  global.WorkerRuntime = {};

  global.Protocol = {
    Agents() {}
  };

  global.WebInspector = {};
  const WebInspector = global.WebInspector;
  WebInspector._moduleSettings = {
    cacheDisabled: {
      addChangeListener() {},
      get() {
        return false;
      }
    },
    monitoringXHREnabled: {
      addChangeListener() {},
      get() {
        return false;
      }
    },
    showNativeFunctionsInJSProfile: {
      addChangeListener() {},
      get() {
        return true;
      }
    }
  };
  WebInspector.moduleSetting = function(settingName) {
    return this._moduleSettings[settingName];
  };

  global.NetworkAgent = {
    RequestMixedContentType: {
      Blockable: 'blockable',
      OptionallyBlockable: 'optionally-blockable',
      None: 'none'
    },
    BlockedReason: {
      CSP: 'csp',
      MixedContent: 'mixed-content',
      Origin: 'origin',
      Inspector: 'inspector',
      Other: 'other'
    },
    InitiatorType: {
      Other: 'other',
      Parser: 'parser',
      Redirect: 'redirect',
      Script: 'script'
    }
  };

  global.SecurityAgent = {
    SecurityState: {
      Unknown: 'unknown',
      Neutral: 'neutral',
      Insecure: 'insecure',
      Warning: 'warning',
      Secure: 'secure',
      Info: 'info'
    }
  };

  global.PageAgent = {
    ResourceType: {
      Document: 'document',
      Stylesheet: 'stylesheet',
      Image: 'image',
      Media: 'media',
      Font: 'font',
      Script: 'script',
      TextTrack: 'texttrack',
      XHR: 'xhr',
      Fetch: 'fetch',
      EventSource: 'eventsource',
      WebSocket: 'websocket',
      Manifest: 'manifest',
      Other: 'other'
    }
  };

  require('chrome-devtools-frontend/front_end/common/Object.js');
  require('chrome-devtools-frontend/front_end/common/ParsedURL.js');
  require('chrome-devtools-frontend/front_end/common/ResourceType.js');
  require('chrome-devtools-frontend/front_end/common/UIString.js');
  require('chrome-devtools-frontend/front_end/platform/utilities.js');
  require('chrome-devtools-frontend/front_end/sdk/Target.js');
  require('chrome-devtools-frontend/front_end/sdk/TargetManager.js');
  require('chrome-devtools-frontend/front_end/sdk/NetworkManager.js');
  require('chrome-devtools-frontend/front_end/sdk/NetworkRequest.js');

  WebInspector.targetManager = {
    observeTargets() { },
    addEventListener() { }
  };
  WebInspector.settings = {
    createSetting() {
      return {
        get() {
          return false;
        },
        addChangeListener() {}
      };
    }
  };
  WebInspector.console = {
    error() {}
  };
  WebInspector.VBox = function() {};
  WebInspector.HBox = function() {};
  WebInspector.ViewportDataGrid = function() {};
  WebInspector.ViewportDataGridNode = function() {};
  global.WorkerRuntime.Worker = function() {};

  require('chrome-devtools-frontend/front_end/common/SegmentedRange.js');
  require('chrome-devtools-frontend/front_end/bindings/TempFile.js');
  require('chrome-devtools-frontend/front_end/sdk/TracingModel.js');
  require('chrome-devtools-frontend/front_end/sdk/ProfileTreeModel.js');
  require('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js');
  require('chrome-devtools-frontend/front_end/timeline_model/TimelineJSProfile.js');
  require('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js');
  require('chrome-devtools-frontend/front_end/timeline_model/LayerTreeModel.js');
  require('chrome-devtools-frontend/front_end/timeline_model/TimelineModel.js');
  require('chrome-devtools-frontend/front_end/ui_lazy/SortableDataGrid.js');
  require('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js');
  require('chrome-devtools-frontend/front_end/timeline_model/TimelineProfileTree.js');
  require('chrome-devtools-frontend/front_end/components_lazy/FilmStripModel.js');
  require('chrome-devtools-frontend/front_end/timeline_model/TimelineIRModel.js');
  require('chrome-devtools-frontend/front_end/timeline_model/TimelineFrameModel.js');

  WebInspector.DeferredTempFile = function() {};
  WebInspector.DeferredTempFile.prototype = {
    write: function() {},
    finishWriting: function() {}
  };

  WebInspector.ConsoleMessage = function() {};
  WebInspector.ConsoleMessage.MessageSource = {
    Network: 'network'
  };
  WebInspector.ConsoleMessage.MessageLevel = {
    Log: 'log'
  };
  WebInspector.ConsoleMessage.MessageType = {
    Log: 'log'
  };

  WebInspector.NetworkLog = function(target) {
    this._requests = new Map();
    target.networkManager.addEventListener(
      WebInspector.NetworkManager.Events.RequestStarted, this._onRequestStarted, this);
  };

  WebInspector.NetworkLog.prototype = {
    requestForURL: function(url) {
      return this._requests.get(url) || null;
    },

    _onRequestStarted: function(event) {
      const request = event.data;
      if (this._requests.has(request.url)) {
        return;
      }
      this._requests.set(request.url, request);
    }
  };

  const Dispatcher = WebInspector.NetworkDispatcher;
  const origUpdateRequest = Dispatcher.prototype._updateNetworkRequestWithRequest;
  Dispatcher.prototype._updateNetworkRequestWithRequest = function(netRecord, request) {
    origUpdateRequest.apply(this, arguments);
    netRecord.isLinkPreload = Boolean(request.isLinkPreload);
    netRecord._isLinkPreload = Boolean(request.isLinkPreload);
  };

  WebInspector.NetworkManager.createWithFakeTarget = function() {

    const fakeNetworkAgent = {
      enable() {},
      getResponseBody() {
        throw new Error('Use driver.getRequestContent() for network request content');
      }
    };
    const fakeConsoleModel = {
      addMessage() {},
      target() {}
    };
    const fakeTarget = {
      _modelByConstructor: new Map(),
      get consoleModel() {
        return fakeConsoleModel;
      },
      networkAgent() {
        return fakeNetworkAgent;
      },
      registerNetworkDispatcher() { },
      model() { }
    };

    fakeTarget.networkManager = new WebInspector.NetworkManager(fakeTarget);
    fakeTarget.networkLog = new WebInspector.NetworkLog(fakeTarget);

    WebInspector.NetworkLog.fromTarget = () => {
      return fakeTarget.networkLog;
    };

    return fakeTarget.networkManager;
  };

  return WebInspector;
})();
