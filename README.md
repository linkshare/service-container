# Service Container


A Symfony2-style dependency injection library for Node.js

# Purpose


Inspired by the [Symfony2 Service Container](http://fabien.potencier.org/article/13/introduction-to-the-symfony-service-container)

A service container increases the usability of classes by allowing a configuration
file to specify which classes should be used to construct a class.  The container
will construct an instance of the class for you using the parameters that you
specify, allowing you to specify different classes to use in different situations
or different environments.

For example, if you have a class that makes HTTP requests.  In your production
environment you would want this to be a real http client.  In your unit test
environment, there is significant complication and overhead in using a real HTTP
client, so you would probably want to use a mock class instead that delivers canned
and predictable responses.

With a service container, you can reconfigure your class through a configuration
file without actually touching your code.

The Symfony 2 Guide Book provides a great [explanation](http://symfony.com/doc/current/book/service_container.html)


# Installation


    npm install service-container

Or add to your package.json dependencies.


# Usage

There are two pieces to using the service container, the container itself and the
`services.json` configuration files.

The `services.json` file specifies [3 types of dependency injection](http://symfony.com/doc/current/components/dependency_injection/types.html):
* Constructor Injection
* Setter Injection
* Property Injection

Constructor injection allows you to specify JSON literal parameters as arguments
for your class instances or it will allow you to specify another service as an
argument (be careful about circular dependencies!).

Setter injection will attempt to call the method that you specify with the arguments
(either parameters or other services) that you define.  This is useful for adding
dependency injection for existing libraries that do not conform to Constructor
Injection.

Property injection will directly attempt to set the property on the object with
the argument that you specify, either another service or a JSON literal parameter.


## Initializing and using the container

Create a container like:

```javascript
var ServiceContainer = require('service-container');

// Create an instance of the container with the environment option set
// This will include both services.json and services_[ENV].json files to override
// any environment-specific parameters
var options = {
  env: 'test',
  ignoreNodeModulesDirectory: true
};
var container = ServiceContainer(__dirname, options);
```

There are two available options:
* `env` - Which will cause the builder to search for `services_[ENV].json` files
* `ignoreNodeModulesDirectory` - Which will prevent a recursive search through your dependent modules


Get an instance of a service like:

```javascript
// Get an example mailer service
var mailer = container.get('mailer');
mailer.sendMail('Hello');

// Get a parameter
var maxcount = container.getParameter('mailer.maxcount');
```

The section below goes over how to configure and construct services.

## services.json

When initializing the container, you'll pass it the root directory for it to search
for the services.json files.  The Builder will recursively search through directories
below the root directory to search for services.json files.  If the `env` option
is specified then files named services_[ENV].json will also be parsed.  Allowing
you to override any parameters setup earlier.

The hierarchy of services and parameters are as follows:
* services.json files at lower folder levels are overridden by those at higher levels
* services.json files are overriden by services_[ENV].json files

This allows you to override the specifics of a module from the application level
and allows you to override any parameter based on whether this is your dev, test,
qa or production environment.

```javascript
{
  "parameters": {
    "dependency_service.file":"./CoolClass",   // File paths are relative to the root passed into the builder
    "dependency2_service.file":"./OtherClass",
    "my_service.file":"MyClass",
    "my_service.example_param":"yes",          // Parameter names are arbitrary
    "my_service.obj_param":{isExample: true}   // Can use literals as parameters
  },
  "services": {
    "dependency_service": {
      "class":"%depency_service.file%",
      "arguments":[]  // No Arguments
    },
    "dependency2_service": {
      "class":"%depency2_service.file%",
      "arguments":[]
    },
    "my_service": {
      "class":"%my_service.file%" // Parameters use % symbols, services use @
      "arguments": ["@dependency_service", "%my_service.example_param%", "@?optional_service"] // Optional services have @? at the beginning
      "calls": [
        ["setSecondDependency", ["@dependency2_service"]] // Method calls have the method name and an array of arguments
      ],
      "properties": {
        "myServiceProperty":"%my_service.obj_param%"
      }
    }
  }
}
```

## Examples

Check out the `example` directory to see some of the more common use cases for a
service container.

Included:
* Basic usage
* Overriding/Using mocks with the environment option
* Using an argument as a service


##TODO
* tags
* scoped services

## Run the Tests

    make unittest

## Create Unit Test Coverage

    make coverage

Open the file `coverage.html` that gets generated in the root directory
