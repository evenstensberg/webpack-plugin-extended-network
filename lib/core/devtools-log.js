class DevtoolsLog {

  constructor(regexFilter) {
    this._filter = regexFilter;
    this._messages = [];
    this._isRecording = false;
  }
  get messages() {
    return this._messages;
  }

  reset() {
    this._messages = [];
  }

  beginRecording() {
    this._isRecording = true;
  }

  endRecording() {
    this._isRecording = false;
  }

  record(message) {
    if (this._isRecording && (!this._filter || this._filter.test(message.method))) {
      this._messages.push(message);
    }
  }
}

module.exports = DevtoolsLog;
