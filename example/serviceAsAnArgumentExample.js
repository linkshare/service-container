/**
 * An example of how to use another service as an argument
 *
 * In the services.json file for the messenger_manager service, the "addMessenger"
 * method is called with the 3 services we saw in the simpleExample.js.
 *
 * By using Setter Injection through the calls array, we can add an arbitrary
 * number of messenger services controlled through the configuration file and
 * not through code.
 */

var ServiceContainer, container, helloMessenger, worldMessenger, exclamationMessenger;

// Create a service container with this directory as the root - this will load
// the services.json file from this directory and create service definitions
ServiceContainer = require('../ServiceContainer');
container = ServiceContainer.buildContainer(__dirname);

// Grab an instance of the messenger manager service
messengerManager = container.get('messenger_manager');

// Loop through all of the services that were added through setter injection and
// print their messages
messengerManager.printAllMessages();
