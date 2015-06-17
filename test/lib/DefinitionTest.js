var Definition, CommonTests, chai, expect, sinon, env, dir;

// Get the node environment - coverage causes us to look for the test library
env = process.env.NODE_TEST_ENV || 'test';

if (env === 'coverage') {
  dir = '../../lib-cov/';
} else {
  dir = '../../lib/';
}

Definition       = require(dir + 'Definition');
CommonTests      = require('../CommonTests');
chai             = require('chai');
expect           = chai.expect;
sinon            = require('sinon');

chai.config.includeStack = true;


// Use the service container to get the right Definition file
env        = process.env.NODE_ENV || 'test'; // Can be set for the coverage env

/**
 * Tests for the Definition.js Object
 */
describe('lib/Definition.js', function () {

  /**
   *
   */
  describe('#Constructor', function () {
    it('Should not require any arguments', function () {
      expect(function () { new Definition(); }).to.not.throw();
    });
  });

  /**
   *
   */
  describe('#addMethodCall', function () {
    it('Should require a string as the first argument, this represents the method to be called', function () {
      var definition = new Definition();
      CommonTests.checkRequiredType('string', definition, 'addMethodCall');
    });

    it('Should have an optional second argument for arguments to use when calling the method', function () {
      var definition = new Definition();
      definition.addMethodCall('testMethod', []);
    });

    it('Should add the method and arguments to the "calls" property', function () {
      var definition, arguments;
      definition = new Definition();
      arguments  = [1, "hello"];
      definition.addMethodCall('testMethod', arguments);
      expect(definition.calls).to.be.an.instanceOf(Array);
      expect(definition.calls[0][0]).to.equal('testMethod');
      expect(definition.calls[0][1]).to.equal(arguments);
    });
  });

  /**
   *
   */
  describe('#setMethodCalls', function () {
    it('Should use the first and second element of each item to call #addMethodCall', function () {
      var definition, calls, spy;
      definition = new Definition();
      spy = sinon.spy(definition, "addMethodCall");

      calls = [
        ['someMethod', [1, 2]],
        ['otherMethod', ['hello', {}]],
      ];

      definition.setMethodCalls(calls);
      expect(spy.calledTwice).to.be.true;
      expect(spy.getCall(0).args).to.deep.equal(calls[0]);
      expect(spy.getCall(1).args).to.deep.equal(calls[1]);
      expect(definition.calls).to.deep.equal(calls);
    });
  });

  /**
   *
   */
  describe('#hasMethodCall', function () {
    it('Should return true if a call to the specified method exists', function () {
      var definition, calls;
      definition = new Definition();

      calls = [
        ['someMethod', [1, 2]],
        ['otherMethod', ['hello', {}]],
      ];

      definition.setMethodCalls(calls);

      expect(definition.hasMethodCall('someMethod')).to.be.true;
    });
    it('Should return false if a call to the specified method does not exist', function () {
      var definition, calls;
      definition = new Definition();

      calls = [
        ['someMethod', [1, 2]],
        ['otherMethod', ['hello', {}]],
      ];

      definition.setMethodCalls(calls);

      expect(definition.hasMethodCall('nonExistantMethod')).to.be.false;
    });
  });

  /**
   *
   */
  describe('#addTag', function () {
    it('Should take two arguments for name and atrributes and create a tag if none exists', function () {
      var definition;
      definition = new Definition();
      definition.addTag('name', {isCool:true});
      expect(definition.tags['name']).to.deep.equal([{isCool:true}]);
    });
    it('Should add attributes to the tag if the tag already exists', function () {
      var definition;
      definition = new Definition();
      definition.addTag('name', {isCool:true});
      expect(definition.tags['name']).to.deep.equal([{isCool:true}]);

      definition.addTag('name', {isRad:true});
      expect(definition.tags['name']).to.deep.equal([{isCool:true}, {isRad:true}]);
    });
  });

  /**
   *
   */
  describe('#setTags', function () {
    it('Should take an object of tags and replace the tags property with the argument', function () {
      var definition, tags;
      definition = new Definition();
      definition.addTag('name', {isCool:true});
      expect(definition.tags).to.deep.equal({name: [{isCool:true}]});

      tags = {
        'other':[{some:'attribute'}],
        'another': []
      };

      definition.setTags(tags);
      expect(definition.tags).to.deep.equal(tags);
    });

    it('Should require the tags to set to be an object', function () {
      var definition = new Definition();
      CommonTests.checkRequiredType('object', definition, 'setTags');
    });
  });


  /**
   *
   */
  describe('#getTag', function () {
    it('Should get all of the attributes for the tag by name', function () {
      var definition, attributes, result;
      definition = new Definition();
      attributes = [{isCool:true}]
      definition.addTag('name', {isCool:true});
      expect(definition.tags['name']).to.deep.equal(attributes);

      result = definition.getTag('name');
      expect(result).to.deep.equal(attributes);
    });
  });

  /**
   *
   */
  describe('#hasTag', function () {
    it('Should return true if a tag with the specified name exists', function () {
      var definition;
      definition = new Definition();
      definition.addTag('name', {isCool:true});
      expect(definition.hasTag('name')).to.be.true;
    });

    it('Should return false if a tag with the specified name does not exist', function () {
      var definition;
      definition = new Definition();
      expect(definition.hasTag('other')).to.be.false;
    });
  });

  /**
   *
   */
  describe('#clearTag', function () {
    it('Should completely remove the tag', function () {
      var definition;
      definition = new Definition();
      definition.addTag('name', {isCool:true});
      expect(definition.hasTag('name')).to.be.true;
      definition.clearTag('name');
      expect(definition.hasTag('name')).to.be.false;
    });
  });
});


