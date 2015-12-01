module.exports = function (classes){
  'use strict';

  var debug = require('debug')('jsonrpc');

  var EventEmitter = classes.ES5Class.$define('EventEmitter', {}, {
    /**
     * Output a piece of debug information.
     */
    trace : function (direction, message){
      var msg = '   ' + direction + '   ' + message;
      debug(msg);
      return msg;
    },
    /**
     * Check if current request has an integer id
     * @param {Object} request
     * @return {Boolean}
     */
    hasId : function (request){
      return request && typeof request['id'] !== 'undefined' && /^\-?\d+$/.test(request['id']);
    }
  }).$inherit(require('eventemitter3').EventEmitter, []);

  return EventEmitter;
};

