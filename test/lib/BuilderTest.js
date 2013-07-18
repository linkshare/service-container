var Builder, Container, CommonTests, chai, expect, sinon, env, dir;

// Get the node environment - coverage causes us to look for the test library
env = process.env.NODE_TEST_ENV || 'test';

if (env === 'coverage') {
  dir = '../../lib-cov/';
} else {
  dir = '../../lib/';
}

Builder       = require(dir + 'Builder');
Container     = require(dir + 'Container');
Definition    = require(dir + 'Definition');
CommonTests   = require('../CommonTests');
chai          = require('chai');
expect        = chai.expect;
sinon         = require('sinon');

chai.Assertion.includeStack = true;


// Use the service container to get the right Definition file
env        = process.env.NODE_ENV || 'test'; // Can be set for the coverage env

/**
 * Tests for the Definition.js Object
 */
describe('lib/Builder.js', function () {

  /**
     *
     * @returns {Object}
     */
    var buildMockFs = function () {
      var mockFs;
      mockFs = {};
      mockFs.readdirSync = function (path) {
        if (path === '/test') {
          return ['services.json', 'parameters.json', 'subdir', 'node_modules'];
        } else if (path === '/test/subdir') {
          return ['services.json', 'services_test.json'];
        } else if (path === '/test/node_modules') {
          return ['services.json'];
        } else {
          return [];
        }
      };

      mockFs.statSync = function (file) {
        if (/(services.json|parameters.json|services_test.json)$/.test(file)) {
          return {
            isDirectory: function () { return false; },
            isFile: function () { return true; }
          }
        } else {
          return {
            isDirectory: function () { return true; },
            isFile: function () { return false; }
          }
        }
      };

      return mockFs;
    };

  /**
   *
   */
  describe('#Constructor', function () {
    it('Should not require any arguments', function () {
      expect(function () { new Builder(); }).to.not.throw();
    });
  });

  /**
   *
   */
  describe('#buildContainer', function () {
    it('Should construct and return a new container', function () {
      var builder, result, mockFs;
      mockFs = buildMockFs();
      builder = new Builder(mockFs, null, Container, null);
      result = builder.buildContainer('/');
      expect(result).to.be.an.instanceof(Container);
    });

    it('Should find files with #findServiceJsonFiles', function () {
      var builder, result, mockFs, spy;
      mockFs = buildMockFs();
      spy = sinon.spy(function () {
        return [];
      });

      builder = new Builder(mockFs, null, Container, null);
      builder.findServiceJsonFiles = spy;
      result = builder.buildContainer('/test');

      expect(result).to.be.an.instanceof(Container);
      expect(spy.called).to.be.true;
    });

    it('Should loop through the files and parse them with #parseFile', function () {
      var builder, result, mockFs, spy;
      mockFs = buildMockFs();
      spy = sinon.spy(function () {
        return;
      });

      builder = new Builder(mockFs, null, Container, null);
      builder.parseFile = spy;
      result = builder.buildContainer('/test');

      expect(result).to.be.an.instanceof(Container);
      expect(spy.calledThrice).to.be.true;
    });
  });

  /**
   *
   */
  describe('#findServiceJsonFiles', function () {

    it('Should recursively find files starting with the root directory', function () {
      var builder, mockFs, result, expected;
      mockFs = buildMockFs();
      builder = new Builder(mockFs, null, null, null);
      result = builder.findServiceJsonFiles('/test', 0);
      expected = [
        { file: '/test/services.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:false },
        { file: '/test/parameters.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:true },
        { file: '/test/subdir/services.json', dir: '/test/subdir', level: 1, isEnvFile: false, isParamFile:false }
      ];
      expect(result).to.deep.equal(expected);
    });

    it('Should look for services_[ENV].json files if the environment is set', function () {
      var builder, mockFs, result, expected;
      mockFs = buildMockFs();
      builder = new Builder(mockFs, null, null, null);
      builder.options.env = 'test';

      result = builder.findServiceJsonFiles('/test', 0);
      expected = [
        { file: '/test/services.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:false },
        { file: '/test/parameters.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:true },
        { file: '/test/subdir/services.json', dir: '/test/subdir', level: 1, isEnvFile: false, isParamFile:false },
        { file: "/test/subdir/services_test.json", dir: '/test/subdir', level: 1, isEnvFile: true, isParamFile:false }
      ];
      expect(result).to.deep.equal(expected);
    });

    it('Should look in the "node_modules" folder if the flag is set', function () {
      var builder, mockFs, result, expected;
      mockFs = buildMockFs();
      builder = new Builder(mockFs, null, null, null);
      builder.options.ignoreNodeModulesDirectory = false;

      result = builder.findServiceJsonFiles('/test', 0);
      expected = [
        { file: '/test/services.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:false },
        { file: '/test/parameters.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:true },
        { file: '/test/subdir/services.json', dir: '/test/subdir', level: 1, isEnvFile: false, isParamFile:false },
        { file: "/test/node_modules/services.json", dir: '/test/node_modules', level: 1, isEnvFile: false, isParamFile:false }
      ];
      expect(result).to.deep.equal(expected);
    });

    it('Should set the level in the folder structure that each file was found at', function () {
      var builder, mockFs, result, expected;
      mockFs = buildMockFs();
      builder = new Builder(mockFs, null, null, null);
      builder.options.env = 'test';

      result = builder.findServiceJsonFiles('/test', 0);

      // Levels are set in expected results
      expected = [
        { file: '/test/services.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:false },
        { file: '/test/parameters.json', dir: '/test', level: 0, isEnvFile: false, isParamFile:true },
        { file: '/test/subdir/services.json', dir: '/test/subdir', level: 1, isEnvFile: false, isParamFile:false },
        { file: "/test/subdir/services_test.json", dir: '/test/subdir', level: 1, isEnvFile: true, isParamFile:false }
      ];
      expect(result).to.deep.equal(expected);
    });
  });

  /**
   *
   */
  describe('#sortFilesByHierarchy', function () {
    it('Should take a set of files and sort the levels highest to lowest', function () {
      var builder, test, result, expected;
      builder = new Builder(null, null, null, Definition);
      test = [
        {file: 'test1', level: 1, isEnvFile:false},
        {file: 'test2', level: 2, isEnvFile:false},
        {file: 'test3', level: 3, isEnvFile:false}
      ];
      expected = [
        {file: 'test3', level: 3, isEnvFile:false},
        {file: 'test2', level: 2, isEnvFile:false},
        {file: 'test1', level: 1, isEnvFile:false}
      ];
      result = builder.sortFilesByHierarchy(test);
      expect(result).to.deep.equal(expected);
    });

    it('Should place environment specific files below non-enviornment files', function () {
      var builder, test, result, expected;
      builder = new Builder(null, null, null, Definition);
      test = [
        {file: 'test1', level: 1, isEnvFile:false},
        {file: 'test2', level: 2, isEnvFile:true},
        {file: 'test3', level: 3, isEnvFile:false}
      ];
      expected = [
        {file: 'test3', level: 3, isEnvFile:false},
        {file: 'test1', level: 1, isEnvFile:false},
        {file: 'test2', level: 2, isEnvFile:true}
      ];
      result = builder.sortFilesByHierarchy(test);
      expect(result).to.deep.equal(expected);
    });

    it('Should place parameter.json files last', function () {
      var builder, test, result, expected;
      builder = new Builder(null, null, null, Definition);
      test = [
        {file: 'test1', level: 1, isEnvFile:false, isParamFile:true},
        {file: 'test2', level: 2, isEnvFile:true},
        {file: 'test3', level: 3, isEnvFile:false}
      ];
      expected = [
        {file: 'test3', level: 3, isEnvFile:false},
        {file: 'test2', level: 2, isEnvFile:true},
        {file: 'test1', level: 1, isEnvFile:false, isParamFile:true},
      ];
      result = builder.sortFilesByHierarchy(test);
      expect(result).to.deep.equal(expected);
    });
  });

  /**
   *
   */
  describe('#parseFiles', function () {
    /**
     *
     */
    var buildMockRequire = function () {
      var mockRequire, spy;
      mockRequire = function (path) {
        return {
          parameters: {
            test: 1
          },
          services: {
            test_service: {
              class: 'some_file',
              arguments: [1],
              calls: [['set', [1]]],
              properties: {hello: 1}
            },
            another_service: {
              class: 'another_file'
            }
          }
        };
      };

      spy = sinon.spy(mockRequire);
      return spy;
    };

    it('Should require the config file specified by the path', function () {
      var builder, container, mockFs, mockRequire, result;
      mockFs      = buildMockFs();

      // Setup the spy to only accept a specific argument
      mockRequire = buildMockRequire();
      mockRequire.withArgs('/test/subdir');

      builder     = new Builder(mockFs, mockRequire, null, Definition);
      container   = new Container();

      builder.parseFile('/test/subdir', container);
      expect(builder.require.calledOnce).to.be.true;

      result = container.serviceDefinitions['test_service'];
      expect(result).to.be.an.instanceof(Definition);
      expect(result.file).to.equal('some_file');
      expect(result.arguments).to.deep.equal([1]);
      expect(result.calls).to.deep.equal([['set', [1]]]);
      expect(result.properties).to.deep.equal({hello: 1});

      result = container.parameters;
      expect(result).to.deep.equal({test: 1});
    });

    it('Should add the parameters in the config to the container', function () {
      var builder, container, mockFs, mockRequire, result;
      mockFs      = buildMockFs();
      mockRequire = buildMockRequire();
      builder     = new Builder(mockFs, mockRequire, null, Definition);
      container   = new Container();
      builder.parseFile('/test/subdir', container);

      result = container.parameters;
      expect(result).to.deep.equal({test: 1});
    });

    it('Should call #buildDefinition on each of the services it finds', function () {
      var builder, container, mockFs, mockRequire, spy;
      mockFs      = buildMockFs();
      mockRequire = buildMockRequire();
      builder     = new Builder(mockFs, mockRequire, null, Definition);
      spy = sinon.spy(function () { return true; });
      builder.buildDefinition = spy;

      container   = new Container();
      builder.parseFile('/test/subdir', container);

      expect(spy.calledTwice).to.be.true;
    });
  });

  /**
   *
   */
  describe('#buildDefinition', function () {
    it('Should take the service config and set the appropriate fields of the defintion object', function () {
      var builder, test, result;
      builder = new Builder(null, null, null, Definition);
      test = {
        class: './test',
        arguments: [1],
        calls: [['set', [1]]],
        properties: {test: true}
      };
      result = builder.buildDefinition(test);
      expect(result).to.be.an.instanceof(Definition);
      expect(result.file).to.equal(test.class);
      expect(result.arguments).to.deep.equal(test.arguments);
      expect(result.calls).to.deep.equal(test.calls);
      expect(result.properties).to.deep.equal(test.properties);
    });
  });
});


