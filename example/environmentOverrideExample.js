/**
 * An example of how to override the parameters based on environment
 *
 * In the simpleExample we used the same class multiple times with different
 * parameters to demonstrate the power of the service container.  This time the
 * demo is about overriding the messages and the service class using a separate
 * services_test.json file.
 *
 */

var ServiceContainer, container, helloMessenger, worldMessenger, exclamationMessenger;

// Create a service container with this directory as the root - this will load
// the services.json file from this directory and create service definitions
// Passing the options as the second parameter with the env specified as "test"
// will force the container to load services_test.json files
ServiceContainer = require('../ServiceContainer');
container = ServiceContainer.buildContainer(__dirname, {env: 'test'});

// Grab instances of the services - the underlying class will be different
helloMessenger       = container.get('hello_messenger');
worldMessenger       = container.get('world_messenger');
exclamationMessenger = container.get('exclamation_messenger');


// Using a different class, the printMessage function is overridden and appears
// differently
// This is great for injecting mock classes (with a mock library like sinon.js)
// to unit test specific JS Objects
helloMessenger.printMessage();       // Print "This is a test: Hello"
worldMessenger.printMessage();       // Print "This is a test: world"
exclamationMessenger.printMessage(); // Print "This is a test: !"
