/**
 * Example mock class
 *
 * You can achieve similar things with sinon.js for unit testing purposes
 */
var MockMessenger = function MockMessenger(msg) {
  this.message = msg || '';
};

MockMessenger.prototype.setMessage = function (msg) {
  this.message = msg;
};

MockMessenger.prototype.printMessage = function () {
  console.log('This is a test: ' + this.message);
};

module.exports = MockMessenger;