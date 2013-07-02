/**
 * Example class that logs messages to the console
 */
var Messenger = function Messenger(msg) {
  this.message = msg || '';
};

Messenger.prototype.setMessage = function (msg) {
  this.message = msg;
};

Messenger.prototype.printMessage = function () {
  console.log(this.message);
};

module.exports = Messenger;