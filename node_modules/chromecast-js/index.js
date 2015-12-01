var util = require( 'util' );
var events = require( 'events' );
var os = require( 'os' );
var ssdp = require('node-ssdp').Client;
var http = require('http');
var Device = require('./device').Device;
var debug = require('debug')('chromecast-js');

exports.Device = Device;

var Browser = function( options ) {
  events.EventEmitter.call( this );
  this.init( options );
};

util.inherits(Browser, events.EventEmitter );

exports.Browser = Browser;

Browser.prototype.update = function(device) {
    var dev_config = {addresses: device.addresses, name: device.name};
    this.device = new Device(dev_config);
    this.emit('deviceOn', this.device);
};

Browser.prototype.init = function(options) {
  var self = this;
  var responseCallback = function (headers, statusCode, rinfo) {
    if (statusCode !== 200) return;
    if (!headers['LOCATION']) return;

    var request = http.get(headers['LOCATION'], function(res) {
      var body = '';
      res.on('data', function(chunk) {
        body += chunk;
      });
      res.on('end', function() {
        var match = body.match(/<friendlyName>(.+?)<\/friendlyName>/);
        if (!match || match.length != 2)
          return;
        self.update({addresses: [rinfo.address], name: match[1]});
      });
    });
  };

  var networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach(function (type) {
    networkInterfaces[type].forEach(function (networkInterface) {
      if (networkInterface.internal) return;
      var ssdpBrowser = new ssdp({
        unicastHost: networkInterface.address
      });
      ssdpBrowser.on('response', responseCallback);
      ssdpBrowser.search('urn:dial-multiscreen-org:service:dial:1');
    });
  });
};
