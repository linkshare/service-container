/*******************************************************************************
 *
 *  DEFINITION.JS
 *
 *  Author: Brandon Eum
 *  Date: July 2013
 *
 ******************************************************************************/

/**
 * Represents a service definition
 *
 * @returns {Definition} An instance of a service definition
 */
var Definition = function Definition() {
  // Properties for class contstruction
  this.file              = null;
  this.class             = null;     // The class (if already loaded)
  this.constructorMethod = null;     // A specific cosntructor function
  this.factoryClass      = null;

  // Different methods of dependency injection
  this.arguments    = []; // Constructor Injection
  this.calls        = []; // Setter Injection
  this.properties   = {}; // Property Injection

  // Service attributes
  this.tags        = {};   // Tags for this class
  this.isSingleton = false;
  this.isObject    = false;

  // TODO: Do something with these eventually
  this.scope        = null;
  this.isPublic     = true;
  this.isSynthetic  = false;
  this.isAbstract   = false;
  this.configurator = null;
};

/**
 * Add a method to call after construction with arguments
 *
 * @param {string} method
 * @param {array} arguments
 * @returns {Definition}
 */
Definition.prototype.addMethodCall = function addMethodCall(method, arguments) {
  if (!method || typeof method !== 'string') {
    throw "Container.Definition.addMethodCall: Method name must be a valid string.";
  }

  this.calls.push([method, arguments]);
  return this;
};

/**
 * Add post-construction method calls
 *
 * @param {array} calls An array of objects with a "method" name and
 * @returns {Definition} A reference to the Definition instance for chainability
 */
Definition.prototype.setMethodCalls = function setMethodCalls(calls) {
  var i;
  for (i in calls) {
    this.addMethodCall(calls[i][0], calls[i][1]);
  }
  return this;
};

/**
 * Check if a method call exists
 *
 * @param {string} method
 * @returns {Boolean}
 */
Definition.prototype.hasMethodCall = function hasMethodCall(method) {
  var i;
  for (i in this.calls) {
    if (this.calls[i][0] === method) {
      return true;
    }
  }

  return false;
};


/**
 *
 * @param {type} tags
 * @returns {setTags}
 */
Definition.prototype.setTags = function setTags(tags) {
  if (typeof tags !== 'object' || !tags) {
    throw 'Container.Definition.setTags: Tags must be an object';
  }
  this.tags = tags;
};


/**
 * Get a tag by name
 *
 * @param {string} tag
 * @returns {string}
 */
Definition.prototype.getTag = function setTags(tag) {
  return (this.tags[tag] ? this.tags[tag] : []);
};


/**
 *
 * @param {string} name
 * @param {array} attributes
 * @returns {Definition}
 */
Definition.prototype.addTag = function setTags(name, attributes) {
  if (!this.tags[name]) {
    this.tags[name] = [];
  }

  this.tags[name].push(attributes);
  return this;
};

/**
 *
 * @param {string} name
 * @returns {Boolean}
 */
Definition.prototype.hasTag = function hasTag(name) {
  return (typeof this.tags[name] === 'object');
};

/**
 *
 * @param {string} name
 * @returns {Definition}
 */
Definition.prototype.clearTag = function clearTag(name) {
  delete this.tags[name];
  return this;
};

module.exports = Definition;