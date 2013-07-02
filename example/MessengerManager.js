/**
 * Example class takes the example messenger classes and prints all messages
 * to the console
 */
var MessengerManager = function MessengerManager() {
  this.messengers = [];
};

MessengerManager.prototype.addMessenger = function (messenger) {
  this.messengers.push(messenger);
};

MessengerManager.prototype.printAllMessages = function () {
  var i;
  for (i in this.messengers) {
    this.messengers[i].printMessage();
  }
};

module.exports = MessengerManager;