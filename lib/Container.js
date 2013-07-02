/*******************************************************************************
 *
 *  CONTAINER.JS
 *
 *  Author: Brandon Eum
 *  Date: July 2013
 *
 ******************************************************************************/

/**
 * The service container - inject the containers dependencies in through constructor
 * injection
 *
 * @param {function} require The require node function, inject to be able to mock it
 * @param {string} rootdir The root directory from which to require files
 * @returns object An instance of the container
 */
var Container = function Container(require, rootdir) {
  this.parameters         = {};
  this.services           = {};
  this.serviceDefinitions = {};

  // For constructing services - keep track of services already seen to prevent
  // circular references
  this.previouslyObservedServices = {};

  // Scoped services are out of scope (haha) for now
  this.scopeChildren  = null;
  this.scopedServices = null;
  this.scopeStacks    = null;

  // Injected Dependencies
  this.require = require;
  this.root    = rootdir;
};

/**
 *
 * @param {type} id
 * @returns {unresolved}
 */
Container.prototype.get = function get(id) {
  // Reset the previously observered services - this is meant to prevent circular
  // dependencies
  return this.constructService(id, false, {}, {});
};


/**
 * Transforms the raw argument name to the parameter name
 *
 * @param {string} argumentId
 */
Container.prototype.getParameterIdFromArgumentReference = function (argumentId) {
  return argumentId.replace(/%/g, '');
};

/**
 * Checks if a given argument is a literal
 * @param {string} arg
 *
 */
Container.prototype.isArgumentALiteral = function (arg) {
  if (typeof arg !== 'string') {
    return true;

  // Check if this is a service or a parameter
  } else if (arg.indexOf('@') !== 0 && !(/^%[^%]+%$/.test(arg))) {
    return true;

  } else {
    return false;
  }
};

/**
 * Checks if a given argument is a service or a parameter
 * @param {string} argumentId
 */
Container.prototype.isArgumentAService = function isArgumentAService(argumentId) {
  if (typeof argumentId !== 'string') {
    return false;
  } else {
    return (argumentId.indexOf('@') === 0);
  }
};

/**
 * Checks if a given argument is an optional service
 * @param {string} argumentId
 * @returns {Boolean} Whether or not it is optional
 */
Container.prototype.isArgumentOptional = function isArgumentOptional(argumentId) {
  return (argumentId.indexOf('@?') !== -1);
};

/**
 *
 * @param {string} argumentId
 * @returns {String}
 */
Container.prototype.getServiceIdFromArgumentReference = function getServiceIdFromArgumentReference(argumentId) {
  var stripped;
  stripped = argumentId.replace(/^@/, '');
  stripped = stripped.replace(/^\?/, '');
  return stripped;
};

/**
 * Used for copying the service tree dependencies
 *
 * @param {object} object
 * @returns {object} A shallow copy of the object passed in
 */
Container.prototype.shallowCopyObject = function shallowCopyObject(object) {
  var i, newObject;
  newObject = {};
  for (i in object) {
    newObject[i] = object[i];
  }

  return newObject;
};

/**
 * Construct the arguments as either services or parameters
 *
 * @param {Array} argumentReferences
 * @param {Object} serviceTree A list of previously seen services while building the current service
 * @returns {Array} An array of constructed arguments and parameters
 */
Container.prototype.constructArguments = function (argumentReferences, serviceTree) {
  var i, argSvcId, argSvcTree, argIsOptional, newSvc, argParamId;

  arguments = [];
  for (i in argumentReferences) {

    if (this.isArgumentALiteral(argumentReferences[i])) {
      arguments.push(argumentReferences[i]);


    } else if (this.isArgumentAService(argumentReferences[i])) {
      argSvcId   = this.getServiceIdFromArgumentReference(argumentReferences[i]);

      // Reuse previously constructed services if possible
      if (this.services[argSvcId]) {
        arguments.push(this.services[argSvcId]);

      } else {
        // Recursively construct the service
        argSvcTree    = this.shallowCopyObject(serviceTree);
        argIsOptional = this.isArgumentOptional(argumentReferences[i]);
        newSvc = this.constructService(argSvcId, argIsOptional, argSvcTree);
        this.services[argSvcId] = newSvc;
        arguments.push(newSvc);
      }

    // The argument is a parameter
    } else {
      argParamId = this.getParameterIdFromArgumentReference(argumentReferences[i]);
      arguments.push(this.getParameter(argParamId));
    }
  }

  return arguments;
};

/**
 *
 * @param {string} id
 * @param {boolean} isOptional
 * @param {object} serviceTree Make sure that there are no circular references while constructing a service
 * @returns {unresolved}
 */
Container.prototype.constructService = function constructService(id, isOptional, serviceTree) {
  var i, definition, arguments, svc, calls, properties, classFile;
  definition = this.serviceDefinitions[id];

  // There is no definition for this service
  if (!definition) {
    if (!isOptional) {
      throw "Container.constructService: The service: " + id + " was not defined";
    } else {
      return null;
    }
  }

  // Try to load the constructor class for the service definition
  if (!definition.class) {
    if (this.isArgumentALiteral(definition.file)) {
      classFile = definition.file;
    } else {
      classFile = this.getParameter(this.getParameterIdFromArgumentReference(definition.file));
    }

    // Check if the class file path is relative or absolute
    if (classFile.indexOf('/') !== -1) {
      classFile = this.root + classFile.replace('./', '/');  // Remove references to the root dir
    } 

    // Load the class module
    definition.class = this.require(classFile);
  }

  // The constructor is not a function - throw an exception even if this service
  // is specified as optional because that's just wrong
  if (typeof definition.class !== 'function') {
    throw "Container.constructService: The constructor for the service: " + id + " was not a function";
  }

  // Check if we are trying to construct a service that we are already attempting
  // to construct earlier in the recursive process
  if (serviceTree[id]) {
    throw "Container.constructService: There is a circular reference to the service: " + id;
  }

  // Add this ID to the tree of services that we are in the process of constructing
  serviceTree[id] = true;

  // Construct the arguments for this service
  arguments = this.constructArguments(definition.arguments, serviceTree);

  // Construct the object with the right arguments
  svc = new definition.class();
  definition.class.apply(svc, arguments);

  // Apply setter injection
  calls = definition.calls;
  for (i in calls) {
    arguments = this.constructArguments(calls[i][1], serviceTree);
    svc[calls[i][0]].apply(svc, arguments);
  }

  // Apply property injection
  properties = definition.properties;
  for (i in properties) {
    arguments = this.constructArguments([properties[i]], serviceTree);
    svc[i] = arguments[0];
  }

  return svc;
};

/**
 *
 * @param {string} id
 * @param {Definition} serviceDefinition
 * @param {string} scope
 * @returns {undefined}
 */
Container.prototype.set = function (id, serviceDefinition, scope) {
  this.serviceDefinitions[id] = serviceDefinition;
};

/**
 *
 * @param {string} id
 * @returns {Boolean}
 */
Container.prototype.has = function (id) {
  return (typeof this.serviceDefinitions[id] !== 'undefined');
};

/**
 * Get a parameter
 *
 * @param {string} name The name of the parameter
 * @returns {string} The value of the parameter
 */
Container.prototype.getParameter = function (name) {
  return this.parameters[name];
};

/**
 *
 * @param {string} name
 * @param {mixed} value
 * @returns {Container}
 */
Container.prototype.setParameter = function (name, value) {
  this.parameters[name] = value;
  return this;
};

/**
 *
 * @param {Object} parameters
 * @returns {Container}
 */
Container.prototype.setParameters = function (parameters) {
  var i;
  for (i in parameters) {
    this.setParameter(i, parameters[i]);
  }
};

/**
 *
 * @param {string} name
 * @returns {Boolean} Returns true if the parameter exists
 */
Container.prototype.hasParameter = function (name) {
  return (typeof this.parameters[name] !== 'undefined');
};

module.exports = Container;
