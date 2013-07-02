/*******************************************************************************
 *
 *  INDEX.JS
 *
 *  Author: Brandon Eum
 *  Date: July 2013
 *
 ******************************************************************************/

/**
 * Construct a Builder object
 */
module.exports = (function () {
  var fs, Builder, Container, Definition;
  fs         = require('fs');
  Builder    = require('./lib/Builder');
  Container  = require('./lib/Container');
  Definition = require('./lib/Definition');

  // Create an instance of the builder with the proper dependencies injected
  var builder = new Builder(fs, require, Container, Definition);

  // Return the initialized builder
  return builder;
}());