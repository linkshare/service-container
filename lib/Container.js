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
    this.parameters = {};
    this.services = {};
    this.serviceDefinitions = {};

    // For constructing services - keep track of services already seen to prevent
    // circular references
    this.previouslyObservedServices = {};

    // Scoped services are out of scope (haha) for now
    this.scopeChildren = null;
    this.scopedServices = null;
    this.scopeStacks = null;

    // Injected Dependencies
    this.require = require;
    this.root = rootdir;
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
 * Used for creating a deep copy of a parameter object
 *
 * @param {Object} the source object
 * @returns {Object} The deep copied object
 */
Container.prototype.deepCopyObject = function deepCopyObject(object) {
    // if it is not an object - can return immediately
    // parameters are automatically copied
    if (object !== Object(object) || object === null) {
        return object;
    }

    var newObject;
    if (object instanceof Array) {
        newObject = [];
    } else {
        newObject = {};
    }

    for (var i in object) {
        if (object.hasOwnProperty(i)) {
            if ("string" == typeof object[i])
                newObject[i] = this.fillParameter(object[i]);
            else
                newObject[i] = this.deepCopyObject(object[i]);
        }
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
Container.prototype.constructArguments = function (argumentReferences, serviceTree, ns) {
    var i, arguments;

    arguments = [];
    for (i in argumentReferences) {
        arguments.push(this.constructArgument(argumentReferences[i], serviceTree, ns));
    }

    return arguments;
};

/**
 * Construct a single argument
 *
 * @param {string} reference
 * @param {type} serviceTree
 * @param ns The service namespace
 * @returns {undefined}
 */
Container.prototype.constructArgument = function (reference, serviceTree, ns) {
    var id, argSvcTree, argIsOptional, argParamId, argument;

    if (this.isArgumentALiteral(reference)) {
        argument = reference;


    } else if (this.isArgumentAService(reference)) {
        id = this.getServiceIdFromArgumentReference(reference);

        // Reuse previously constructed services if possible - try the namespaced
        // version of a service first, but fall back to the normal id
        if (this.services[ns + id]) {
            argument = this.services[ns + id];

        } else if (this.services[id]) {
            argument = this.services[id];

        } else {
            // Recursively construct the service
            argSvcTree = this.shallowCopyObject(serviceTree);
            argIsOptional = this.isArgumentOptional(reference);
            argument = this.constructService(id, argIsOptional, argSvcTree, ns);
        }

        // The argument is a parameter
    } else {
        argParamId = this.getParameterIdFromArgumentReference(reference);
        argument = this.getParameter(argParamId, ns);
    }

    return argument;
};

/**
 *
 * @param {string} id
 * @param {boolean} isOptional
 * @param {object} serviceTree Make sure that there are no circular references while constructing a service
 * @param ns
 * @returns {unresolved}
 */
Container.prototype.constructService = function constructService(id, isOptional, serviceTree, ns) {
    var i, definition, arguments, argument, svc, calls, properties, classFile,
        namespace;

    var finalId = ns + id;

    // Get the service definition with a preference for a given namespace
    definition = this.serviceDefinitions[finalId];

    if (!definition) {
        finalId = id;
        definition = this.serviceDefinitions[finalId];
    }


    // There is no definition for this service
    if (!definition) {
        if (!isOptional) {
            throw new Error(
                "Container.constructService: The service: " + finalId + " was not defined"
            );
        } else {
            return null;
        }
    }

    if (definition.isSingleton && this.services[finalId]) {
        return this.services[finalId];
    }

    // Get this service's namespace
    namespace = (definition.namespace) ? definition.namespace + '.' : '';

    // Try to load the constructor class for the service definition
    if (!definition.class) {
        if (this.isArgumentALiteral(definition.file)) {
            classFile = definition.file;
        } else {
            // Check under the namespace for the class file
            classFile = this.getParameter(
                this.getParameterIdFromArgumentReference(definition.file),
                namespace
            );
        }

        if (!classFile) {
            throw new Error(
                'The class file for the service: "' + finalId + '" could not be found'
            );
        }

        // Check if the class file path is relative or absolute
        classFile = classFile.replace(/^\.\.\//, './../');
        if (/^\.\//.test(classFile)) {
            // Remove references to the root dir
            classFile = definition.rootDirectory + classFile.replace('./', '/');
        }

        // Load the class module
        definition.class = this.require(classFile);
    }

    // The constructor is not a function - throw an exception even if this service
    // is specified as optional because that's just wrong
    if (typeof definition.class !== 'function' && !definition.isObject && typeof definition.class[definition.constructorMethod] !== 'function') {
        throw new Error(
            "Container.constructService: The constructor for the service: " + finalId +
            " was not a function"
        );
    }

    // Check if we are trying to construct a service that we are already attempting
    // to construct earlier in the recursive process
    if (serviceTree[finalId]) {
        throw new Error(
            "Container.constructService: There is a circular " +
            "reference to the service: " + finalId
        );
    }

    // Add this ID to the tree of services that we are in the process of constructing
    serviceTree[finalId] = true;

    // Construct the arguments for this service
    arguments = this.constructArguments(definition.arguments, serviceTree, namespace);

    // Construct the object with the right arguments if this is a constructor
    // function
    if (definition.isObject) {
        svc = definition.class;
    } else if (definition.constructorMethod) {
        svc = Object.create(definition.class[definition.constructorMethod].prototype);
        definition.class[definition.constructorMethod].apply(svc, arguments);
    } else {
        svc = Object.create(definition.class.prototype);
        definition.class.apply(svc, arguments);
    }

    // Apply setter injection
    calls = definition.calls;
    for (i in calls) {
        arguments = this.constructArguments(calls[i][1], serviceTree, namespace);
        svc[calls[i][0]].apply(svc, arguments);
    }

    // Apply property injection
    properties = definition.properties;
    for (i in properties) {
        argument = this.constructArgument(properties[i], serviceTree, namespace);
        svc[i] = argument;
    }

    // Set the service into the services object if it is a singleton or a static
    // object
    if (definition.isSingleton || definition.isObject) {
        this.services[finalId] = svc;
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
Container.prototype.getParameter = function (name, ns) {
    ns = ns || '';
    var parameter = this.parameters[ns + name];

    // Default to the non-namespaced param if the namespaced version was not found
    parameter = parameter || this.parameters[name];

    if ("string" == typeof parameter)
        return this.fillParameter(parameter);
    else
        return this.deepCopyObject(parameter);
    //return "string" == typeof parameter ? this.fillParameter(parameter) : this.deepCopyObject(parameter);
};

/**
 * Fill a parameter
 *
 * @param {string} name The name of the parameter
 * @returns {string} The filled parameter
 */
Container.prototype.fillParameter = function (parameter) {
    var vars = parameter.match(/(%[a-zA-Z-_]*%)/g);
    if (null == vars) return parameter;

    vars.forEach(function (current_var) {
        var var_name = current_var.replace(/%/g, "");
        var value = this.getParameter(var_name);
        parameter = parameter.replace(current_var, value);
    }.bind(this));

    return parameter;
}

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

/**
 *
 * @returns {{}|*}
 */
Container.prototype.getParameterBag = function () {
    var parameters = {};
    Object
        .keys(this.parameters)
        .map(function (key_name) {
            parameters[key_name] = this.getParameter(key_name);
        }.bind(this));

    return parameters;
}

module.exports = Container;
