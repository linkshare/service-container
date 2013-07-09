var Definition, CommonTests, chai, expect, sinon, env, dir;

// Get the node environment - coverage causes us to look for the test library
env = process.env.NODE_TEST_ENV || 'test';

if (env === 'coverage') {
  dir = '../../lib-cov/';
} else {
  dir = '../../lib/';
}

Container        = require(dir + 'Container');
Definition       = require(dir + 'Definition');
CommonTests      = require('../CommonTests');
chai             = require('chai');
expect           = chai.expect;
sinon            = require('sinon');

chai.Assertion.includeStack = true;


// Use the service container to get the right Definition file
env        = process.env.NODE_ENV || 'test'; // Can be set for the coverage env

/**
 * Tests for the Definition.js Object
 */
describe('lib/Container.js', function () {

  /**
   * Create a utility method for constructing a properly initialized test
   * subject
   */
  var constructTestContainer = function () {
    var require, spy;
    require = function (file) {
      return function (arg) {
        this.test = true;
        this.arg  = arg;
        this.prop = null;
        this.sinj = null;
        this.set  = function (arg) {
          this.sinj = arg;
        };
      };
    };
    spy = sinon.spy(require);

    return new Container(spy, '/test/');
  };

  /**
   *
   */
  describe('#Constructor', function () {
    it('Should optionally require two arguments, the node require function and the root directory', function () {
      var container, require, root;
      require = function () {};
      root    = '/a/fake/root/dir';
      container = new Container(require, root);
      expect(container.require).to.equal(require);
      expect(container.root).to.equal(root);
    });
  });

  /**
   *
   */
  describe('#getParameterIdFromArgumentReference', function () {
    it('Should take a parameter like "%parameter%" and strip the "%" symbols', function () {
      var container, parameter;
      container = new Container();
      parameter = container.getParameterIdFromArgumentReference('%test_parameter.name%');
      expect(parameter).to.equal('test_parameter.name');

    });
  });

  /**
   *
   */
  describe('#isArgumentALiteral', function () {
    it('Should return false if the argument is a parameter like "%some_parameter%"', function () {
      var container, isALiteral;
      container = new Container();
      isALiteral = container.isArgumentALiteral('%some_parameter%');
      expect(isALiteral).to.be.false;
    });

    it('Should return false if the argument is a service reference like "@some_service"', function () {
      var container, isALiteral;
      container = new Container();
      isALiteral = container.isArgumentALiteral('@some_service');
      expect(isALiteral).to.be.false;
    });

    it('Should return false if the argument is an optional service reference like "@?some_service"', function () {
      var container, isALiteral;
      container = new Container();
      isALiteral = container.isArgumentALiteral('@?some_service');
      expect(isALiteral).to.be.false;
    });

    it('Should return true otherwise', function () {
      var container, isALiteral;
      container = new Container();
      isALiteral = container.isArgumentALiteral('some_@_@?_%_%_literal');
      expect(isALiteral).to.be.true;

      isALiteral = container.isArgumentALiteral(1);
      expect(isALiteral).to.be.true;
    });
  });

  /**
   *
   */
  describe('#isArgumentAService', function () {
    it('Should return true if the argument has an "@" symbol as the first character', function () {
      var container, isService;
      container = new Container();
      isService = container.isArgumentAService('@some_service');
      expect(isService).to.be.true;

      isService = container.isArgumentAService('@?some_optional_service');
      expect(isService).to.be.true;
    });

    it('Should return false otherwise', function () {
      var container, isService;
      container = new Container();
      isService = container.isArgumentAService('%some_param%');
      expect(isService).to.be.false;

      isService = container.isArgumentAService('some_literal');
      expect(isService).to.be.false;

      isService = container.isArgumentAService(111);
      expect(isService).to.be.false;
    });
  });

  /**
   *
   */
  describe('#isArgumentOptional', function () {
    it('Should return true if the argument has an "@?" symbol as the first two characters', function () {
      var container, isService;
      container = new Container();

      isService = container.isArgumentOptional('@?some_optional_service');
      expect(isService).to.be.true;
    });

    it('Should return false otherwise', function () {
      var container, isService;
      container = new Container();
      isService = container.isArgumentOptional('%some_param%');
      expect(isService).to.be.false;

      isService = container.isArgumentOptional('some_literal');
      expect(isService).to.be.false;

      isService = container.isArgumentOptional('@some_service');
      expect(isService).to.be.false;
    });
  });

  /**
   *
   */
  describe('#getServiceIdFromArgumentReference', function () {
    it('Should return a string with the "@" or "@?" symbols removed', function () {
      var container, result;
      container = new Container();

      result = container.getServiceIdFromArgumentReference('@some_service');
      expect(result).to.equal('some_service');

      result = container.getServiceIdFromArgumentReference('@?some_optional_service');
      expect(result).to.equal('some_optional_service');
    });
  });

  /**
   *
   */
  describe('#shallowCopyObject', function () {
    it('Should copy all of the first dimension keys to a new object', function () {
      var container, test, result;
      container = new Container();

      test = {
        test1:true,
        test2:true,
        test3:true
      };
      result = container.shallowCopyObject(test);
      expect(result).to.deep.equal(test);

      // Check that result is actually a new object
      result.new_key = true;
      expect(test.new_key).to.be.an('undefined');
    });
  });

  /**
   *
   */
  describe('#constructArguments', function () {
    describe('Should take an array of argumentReferences and properly construct and return an array of arguments', function () {
      it('Should return literal values as-is', function () {
        var container, test, result;
        container = new Container();
        test = [1, {}];
        result = container.constructArguments(test);
        expect(result).to.deep.equal(test);
      });

      it('Should return the values of parameters', function () {
        var container, test, result;
        container = new Container();
        container.setParameter('some_param', 1);
        test = ['%some_param%'];
        result = container.constructArguments(test);
        expect(result).to.deep.equal([1]);
      });

      it("Should create a new instance of a service that has not been previously constructed", function () {
        var container, definition, test, result;
        definition = new Definition();
        definition.file = '%param%';
        definition.properties = {prop:1};

        // Mock a require function that returns an object constructor
        container = constructTestContainer();
        container.require.withArgs('test_file');
        container.set('some_service', definition);
        container.setParameter('param', 'test_file');

        // Construct the service
        result = container.constructArguments(['@some_service'], false, {});
        result = result[0];

        // Check that the fake object was constructed as the service
        expect(result.test).to.be.true;
      });

      it('Should check for singleton services that have already been constructed and return those services', function () {
        var container, test, result;
        container = new Container();
        test = {testService: true};
        container.services['some_service'] = test;
        result = container.constructArguments(['@some_service']);
        expect(result).to.deep.equal([test]);
      });
    });
  });

  /**
   *
   */
  describe('#constructService', function () {

    it('Should return null if the service definition does not exist and the service is optional', function () {
      var container, result;
      container = new Container();
      result = container.constructService('some_non_existant_service', true, {});
      expect(result).to.be.null;
    });

    it('Should throw an error if the service is not defined and it is not optional', function () {
      var container, test;
      container = new Container();
      test = function () {
        container.constructService('some_non_existant_service', false, {});
      };
      expect(test).to.throw();
    });

    describe('Should try to load the service constructor', function () {
      it('Should use a literal if that is specified in the definition', function () {
        var container, definition, test, result;
        definition = new Definition();
        definition.file = './test_file';

        // Mock a require function that returns an object constructor
        container = constructTestContainer();
        container.require.withArgs('/test/test_file');
        container.set('some_service', definition);
        result = container.constructService('some_service', false, {});

        // Check that the fake object was constructed as the service
        expect(result.test).to.be.true;

        // Check that the require function was called with the expected args
        expect(container.require.calledOnce).to.be.true;
      });

      it('Should use a parameter if that is specified as the source file', function () {
        var container, definition, test, result;
        definition = new Definition();
        definition.file = '%param%';

        // Mock a require function that returns an object constructor
        container = constructTestContainer();
        container.require.withArgs('/test/test_file');
        container.set('some_service', definition);
        container.setParameter('param', './test_file');
        result = container.constructService('some_service', false, {});

        // Check that the fake object was constructed as the service
        expect(result.test).to.be.true;

        // Check that the require function was called with the expected args
        expect(container.require.calledOnce).to.be.true;
      });

      it('Should not add the root directory to npm modules', function () {
        var container, definition, test, result;
        definition = new Definition();
        definition.file = '%param%';

        // Mock a require function that returns an object constructor
        container = constructTestContainer();
        container.require.withArgs('test_file');
        container.set('some_service', definition);
        container.setParameter('param', 'test_file');
        result = container.constructService('some_service', false, {});

        // Check that the fake object was constructed as the service
        expect(result.test).to.be.true;

        // Check that the require function was called with the expected args
        expect(container.require.calledOnce).to.be.true;
      });

      it('Should throw an exception if the constructor loaded is not a function and isObject is not set', function () {
        var container, definition, require, result;
        definition = new Definition();
        definition.file = 'test_file';

        // Mock a require function that returns an object constructor
        require = function (arg) {
          return 1;
        };

        container = new Container(require, '/test/');
        container.set('some_service', definition);

        test = function () {
          container.constructService('some_service', false, {});
        };

        expect(test).to.throw();
      });

      it('Should not throw an exception if the constructor loaded is not a function and isObject is set', function () {
        var container, definition, require, result;
        definition = new Definition();
        definition.file = 'test_file';
        definition.isObject = true;

        // Mock a require function that returns an object constructor
        require = function (arg) {
          return 1;
        };

        container = new Container(require, '/test/');
        container.set('some_service', definition);

        test = function () {
          container.constructService('some_service', false, {});
        };

        expect(test).to.not.throw();
      });

      it('Should return an object if isObject is set', function () {
        var container, definition, require, result;
        definition = new Definition();
        definition.file = 'test_file';
        definition.isObject = true;

        // Mock a require function that returns an object constructor
        require = function (arg) {
          return {};
        };

        container = new Container(require, '/test/');
        container.set('some_service', definition);

        result = container.constructService('some_service', false, {});
        expect(result).to.deep.equal({});
      });

      it('Should use a different constructor if constructor is set', function () {
        var container, definition, require, result;
        definition = new Definition();
        definition.file = 'test_file';
        definition.constructorMethod = 'constructorMethod'

        // Mock a require function that returns an object constructor
        var spy = sinon.spy(function () {});
        require = function (arg) {
          return {
            constructorMethod: spy
          };
        };

        container = new Container(require, '/test/');
        container.set('some_service', definition);

        result = container.constructService('some_service', false, {});
        expect(spy.called).to.be.true;
      });
    });

    it('Should throw an error if the ID exists in the service tree param, indicating a circular reference', function () {
      var container, definition, test;
      definition = new Definition();
      definition.class = function () {};
      container = new Container();
      container.set('some_service', definition);
      test = function () {
        container.constructService('some_service', false, {some_service:true});
      };
      expect(test).to.throw();
    });

    it('Should set the id in the list of observed services', function () {
      var container, definition, test, result;
      definition = new Definition();
      definition.file = '%param%';

      // Mock a require function that returns an object constructor
      container = constructTestContainer();
      container.require.withArgs('test_file');
      container.set('some_service', definition);
      container.setParameter('param', 'test_file');

      test = {};
      result = container.constructService('some_service', false, test);

      // Check that this svc was added to the observed svc list
      expect(test.some_service).to.be.true;
    });

    it('Should set the new object into the list of existing services if this is a singleton', function () {
      var container, definition, test, result;
      definition = new Definition();
      definition.file = '%param%';
      definition.isSingleton = true;

      // Mock a require function that returns an object constructor
      container = constructTestContainer();
      container.require.withArgs('test_file');
      container.set('some_service', definition);
      container.setParameter('param', 'test_file');

      test = {};
      result = container.constructService('some_service', false, test);

      // Check that this svc was added to the constructed services
      expect(container.services['some_service']).to.deep.equal(result);
    });

    it('Should construct any arguments for Constructor Injection', function () {
      var container, definition, test, result;
      definition = new Definition();
      definition.file = '%param%';
      definition.arguments = [1];

      // Mock a require function that returns an object constructor
      container = constructTestContainer();
      container.require.withArgs('test_file');
      container.set('some_service', definition);
      container.setParameter('param', 'test_file');
      result = container.constructService('some_service', false, {});

      // Check that the fake object was constructed as the service
      expect(result.test).to.be.true;

      // Check that the constructor arg was applied
      expect(result.arg).to.equal(1);
    });

    it('Should perform any method calls for Setter Injection', function () {
      var container, definition, test, result;
      definition = new Definition();
      definition.file = '%param%';
      definition.calls = [['set', [1]]];

      // Mock a require function that returns an object constructor
      container = constructTestContainer();
      container.require.withArgs('test_file');
      container.set('some_service', definition);
      container.setParameter('param', 'test_file');
      result = container.constructService('some_service', false, {});

      // Check that the fake object was constructed as the service
      expect(result.test).to.be.true;

      // Check that the setter injection was applied
      expect(result.arg).to.be.undefined;
      expect(result.sinj).to.equal(1);
    });

    it('Should set any properties for Property Injection', function () {
      var container, definition, result;
      definition = new Definition();
      definition.file = '%param%';
      definition.properties = {prop:1};

      // Mock a require function that returns an object constructor
      container = constructTestContainer();
      container.require.withArgs('test_file');
      container.set('some_service', definition);
      container.setParameter('param', 'test_file');
      result = container.constructService('some_service', false, {});

      // Check that the fake object was constructed as the service
      expect(result.test).to.be.true;

      // Check that the property injection was applied
      expect(result.arg).to.be.undefined;
      expect(result.prop).to.equal(1);
    });
  });

  /**
   *
   */
  describe('#get', function () {
    it('Should call constructService', function () {
      var container, test, spy, result;
      container = new Container();
      spy = sinon.spy(function () {
        return true;
      });

      container.constructService = spy;
      result = container.get('some_service');
      expect(result).to.be.true;
      expect(spy.calledOnce).to.be.true;
    });
  });

  /**
   *
   */
  describe('#set', function () {
    it('Should add the service ID and definition to the serviceDefinitions property', function () {
      var container, test;
      container = new Container();

      test = {class:'test'};
      container.set('some_service', test);
      expect(container.serviceDefinitions['some_service']).to.deep.equal(test);
    });
  });

  /**
   *
   */
  describe('#has', function () {
    it('Should return true if the service with the given ID exists', function () {
      var container, test, result;
      container = new Container();
      test = {class:'test'};
      container.set('some_service', test);
      result = container.has('some_service');
      expect(result).to.be.true;
    });
  });

  /**
   *
   */
  describe('#getParameter', function () {
    it('Should return the value of the given parameter', function () {
      var container, test, result;
      container = new Container();
      test = 'value';
      container.setParameter('some_param', test);
      result = container.getParameter('some_param');
      expect(result).to.deep.equal(test);
    });
    it('Should return undefined if the parameter does not exist', function () {
      var container, test, result;
      container = new Container();
      result = container.getParameter('some_param');
      expect(result).to.be.an('undefined');
    });
  });

  /**
   *
   */
  describe('#hasParameter', function () {
    it('Should return true if the given parameter exists', function () {
      var container, test, result;
      container = new Container();
      test = 'value';
      container.setParameter('some_param', test);
      result = container.hasParameter('some_param');
      expect(result).to.be.true;
    });

    it('Should return false if the given parameter does not exist', function () {
      var container, result;
      container = new Container();
      result = container.hasParameter('some_param');
      expect(result).to.be.false;
    });
  });

  /**
   *
   */
  describe('#setParameter', function () {
    it('Should set the value of the given parameter', function () {
      var container, test, result;
      container = new Container();
      test = 'value';
      container.setParameter('some_param', test);
      result = container.getParameter('some_param');
      expect(result).to.deep.equal(test);
    });
  });

  /**
   *
   */
  describe('#setParameters', function () {
    it('Should replace the existing parameters with the new parameters object', function () {
      var container, test;
      container = new Container();
      test = {some_param:1, other_param:3};
      container.setParameters(test);
      expect(container.parameters).to.deep.equal(test);
    });
  });
});
