/**
 * A simple example on how to use the service container
 *
 * Uses the same class initialized differently to have two different behaviors
 * within the same app
 *
 * Loads the services from the services.json file in this folder.
 */

var ServiceContainer, container, helloMessenger, worldMessenger, exclamationMessenger;

// Create a service container with this directory as the root - this will load
// the services.json file from this directory and create service definitions
ServiceContainer = require('../ServiceContainer');
container = ServiceContainer.buildContainer(__dirname);

// Grab instances of the services
helloMessenger       = container.get('hello_messenger');
worldMessenger       = container.get('world_messenger');
exclamationMessenger = container.get('exclamation_messenger');

// Output messags to the screen.  The first prints "hello" the second prints "world"
// and the last prints the "!" character

// Under the hood they all use the same class but they are initialized differently
// with constructor, setter, and property injection respectively
helloMessenger.printMessage();       // Print "hello "
worldMessenger.printMessage();       // Print "world"
exclamationMessenger.printMessage(); // Print "!"
