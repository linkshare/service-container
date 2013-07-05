/*******************************************************************************
 *
 *  BUILDER.JS
 *
 *  Author: Brandon Eum
 *  Date: July 2013
 *
 ******************************************************************************/

/**
 * The builder is responsible for constructing the container and the definitions
 * based on the services.json files located anywhere within the application
 *
 *
 * @param {Object} fs Node file system library
 * @param {function} require The require function, injected so it can be mocked
 * @param {Container} Container The constructor for the container class
 * @param {Definition} Definition The constructor for the service Definition class
 * @returns {Builder} An instance of the container builder
 */
var Builder = function Builder(fs, require, Container, Definition) {
  this.options    = {
    env: false,
    ignoreNodeModulesDirectory: true
  };

  this.fs         = fs;
  this.require    = require;
  this.Container  = Container;
  this.Definition = Definition;
};

/**
 * Looks for services.json files from the rootdirectory and below and constructs
 * a container based on the configurations it finds.
 *
 * @param {string} rootdirectory Absolute path for the root directory for this container
 * @param {Object} options Options for constructing the container
 * @returns {Container} An initialized container instance
 */
Builder.prototype.buildContainer = function (rootdirectory, options) {
  var container, files, i;

  // Set the options, or use the defaults
  this.options = options || this.options;

  // Construct a new Container
  container = new this.Container(this.require, rootdirectory);

  // Parse all of the service.json files and compile definitions
  files = this.findServiceJsonFiles(rootdirectory);
  files = this.sortFilesByHierarchy(files);

  // Ensure that we iterate in sorted order
  for (i = 0; i < files.length; i++) {
    this.parseFile(files[i], container);
  }

  return container;
};

/**
 * Returns a list of absolute paths to the JSON configuration files
 *
 * @param {string} absolutePath The absolute path to search
 * @param {integer} level The hierarchy level this file was found at
 * @returns {Array} An array of paths to the configuration filess
 */
Builder.prototype.findServiceJsonFiles = function (absolutePath, level) {
  var files, filepath, svcjsonfiles, i, stat, pattern, envPattern;

  // Setup the pattern to find files
  if (this.options.env) {
    pattern    = new RegExp("services.json$");
    envPattern = new RegExp("services_" + this.options.env + ".json$");
  } else {
    pattern    = new RegExp("services.json$");
    envPattern = null;
  }

  svcjsonfiles = [];
  files = this.fs.readdirSync(absolutePath);

  for (i in files) {
    filepath = absolutePath + '/' + files[i];
    stat = this.fs.statSync(filepath);

    // Recursively search for files - ignore the node modules directory
    if (stat.isDirectory() && (!this.options.ignoreNodeModulesDirectory || filepath.indexOf('node_modules') === -1)) {
      svcjsonfiles = svcjsonfiles.concat(this.findServiceJsonFiles(filepath, level + 1));
    } else if (stat.isFile()) {

      // Set the filepath, level, and isEnvFile flag for sorting in the right
      // order
      if (pattern.test(filepath)) {
        svcjsonfiles.push({file: filepath, level: level, isEnvFile:false});
      } else if (envPattern && envPattern.test(filepath)) {
        svcjsonfiles.push({file: filepath, level: level, isEnvFile:true});
      }
    }

    // Ignore files that do not match and are not directories
  }

  return svcjsonfiles;
};

/**
 * The rules for sorting are as follows
 *   - Environment specific files are parsed last
 *   - Lower levels are parsed after higher levels
 *
 * @param {Array} files
 * @returns {Array}
 */
Builder.prototype.sortFilesByHierarchy = function (files) {
  var i, result, envFiles, nonEnvFiles, sortFunc;
  envFiles    = [];
  nonEnvFiles = [];
  for (i in files) {
    if (files[i].isEnvFile) {
      envFiles.push(files[i]);
    } else {
      nonEnvFiles.push(files[i]);
    }
  }
  
  sortFunc = function (a, b) {
    // Lower levels are parsed later - Meaning that files higher in the app
    // structure take precedence over files lower in the file structure
    if (a.level < b.level) {
      return true;
    }

    // b was either an envFile or it had a lower level than a
    return false;
  };
  
  envFiles.sort(sortFunc);
  nonEnvFiles.sort(sortFunc);
  result = nonEnvFiles.concat(envFiles);

  return result;
};

/**
 * Takes a services.json file and creates service definitions or adds parameters
 * to the container instance being constructed.
 *
 * @param {String} path The absolute path of the services.json file to be parsed
 * @param {Container} container The container instance to add services and parameters to
 * @returns {undefined}
 */
Builder.prototype.parseFile = function (path, container) {
  var i, config, serviceConfigs;

  // Get the config file
  config = this.require(path.file);

  // Add parameters
  container.setParameters(config.parameters);

  // Add service definitions
  serviceConfigs = config.services;
  for (i in serviceConfigs) {
    container.set(i, this.buildDefinition(serviceConfigs[i]));
  }
};

/**
 *
 * @param {Object} config
 * @returns {Definition}
 */
Builder.prototype.buildDefinition = function (config) {
  var definition;
  definition = new this.Definition();
  definition.file       = config.class;
  definition.arguments  = config.arguments;
  definition.calls      = config.calls;
  definition.properties = config.properties;
  return definition;
};

module.exports = Builder;