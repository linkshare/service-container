/*******************************************************************************
 *
 * COMMONTESTS.JS
 *
 * Author: Brandon Eum
 * Date: July 2013
 *
 ******************************************************************************
 * A suite of common functions for
 *
 */

var chai, expect;
chai = require('chai');
chai.config.includeStack = true;
expect = chai.expect;


/**
 * Runs through all combinations of possible JS types and makes sure that anything
 * other than the required type throws an exception.
 *
 * @param {String} type
 * @param {mixed} object
 * @param {String} methodName
 */
module.exports.checkRequiredType = function (type, object, methodName) {
  var string, nil, obj, num, bool, test;

  string = 'test string';
  nil    = null;
  obj    = {};
  num    = 1;
  bool   = true;
  func   = function () {};

  test = string;
  if (type === 'string') {
    expect(function () { object[methodName](test); }).to.not.throw();
  } else {
    expect(function () { object[methodName](test); }).to.throw();
  }

  if (type === 'undefined') {
    expect(function () { object[methodName](); }).to.not.throw();
  } else {
    expect(function () { object[methodName](); }).to.throw();
  }

  test = nil;
  if (type === 'null') {
    expect(function () { object[methodName](test); }).to.not.throw();
  } else {
    expect(function () { object[methodName](test); }).to.throw();
  }

  test = obj;
  if (type === 'object') {
    expect(function () { object[methodName](test); }).to.not.throw();
  } else {
    expect(function () { object[methodName](test); }).to.throw();
  }

  test = num;
  if (type === 'number') {
    expect(function () { object[methodName](test); }).to.not.throw();
  } else {
    expect(function () { object[methodName](test); }).to.throw();
  }

  test = bool;
  if (type === 'boolean') {
    expect(function () { object[methodName](test); }).to.not.throw();
  } else {
    expect(function () { object[methodName](test); }).to.throw();
  }

  test = func;
  if (type === 'function') {
    expect(function () { object[methodName](test); }).to.not.throw();
  } else {
    expect(function () { object[methodName](test); }).to.throw();
  }
};