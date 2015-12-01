/**
 * node-airplay
 *
 * @file bojour server
 * @author zfkun(zfkun@msn.com)
 * @thanks https://github.com/benvanik/node-airplay/blob/master/lib/airplay/browser.js
 */

var util = require( 'util' );
var events = require( 'events' );
//var mdns = require( 'mdns' );

var mdns = require( 'mdns-js' );
var TIMEOUT = 10000;
var Device = require( './device' ).Device;

var Browser = function( options ) {
    events.EventEmitter.call( this );
    this.init( options );
};

util.inherits( Browser, events.EventEmitter );

exports.Browser = Browser;




Browser.prototype.init = function ( options ) {
    var self = this;
    var nextDeviceId = 0;

    this.devices = {};
    this.getDeviceTxtValue = function(device, key, fallback) {
      var value = fallback !== undefined ? fallback : '';
      for (var i = 0; i < device.txt.length; i++) {
        var keyValue = device.txt[i].split('=');
        if (keyValue[0] === key) {
          value = keyValue[1];
        }
      }
      return value;
    }
    //var mdnsBrowser = new mdns.Mdns(mdns.tcp('airport'));
    var browser = new mdns.createBrowser(mdns.tcp('airplay'));
    //var legacyMdnsBrowser = new mdns.Mdns(mdns.tcp('airplay'));

    var mdnsOnUpdate = function(data) {
        if(data.port && data.port == 7000){
            var info = data.addresses
            var name = data.fullname.split('.')[0]

                device = new Device( nextDeviceId++, info , name );
                device.on( 'ready', function( d ) {
                    self.emit( 'deviceOn', d );
                });
                device.on( 'close', function( d ) {
                    delete self.devices[ d.id ];
                    self.emit( 'deviceOff', d );
                });

                self.devices[ device.id ] = device;

        }
    };
    browser.on('ready', function () {
            browser.discover();
    });
    browser.on('update', mdnsOnUpdate);

    setTimeout(function onTimeout() {
      browser.stop();
    }, TIMEOUT);

};

Browser.prototype.start = function () {
    //this.browser.start();
    this.emit( 'start' );
    return this;
};

Browser.prototype.stop = function() {
    this.emit( 'stop' );
    return this;
};

Browser.prototype.isValid = function ( info ) {
    if ( !info || !/^en\d+$/.test( info.networkInterface ) ) {
        return !1;
    }
    return !0;
};

Browser.prototype.getDevice = function ( info ) {
    for ( var DeviceId in this.devices ) {
        var device = this.devices[ DeviceId ];
        if ( device.match( info ) ) {
            return device;
        }
    }
};

Browser.prototype.getDeviceById = function ( DeviceId, skipCheck ) {
    var device = this.devices[ DeviceId ];
    if ( device && ( skipCheck || device.isReady() ) ) {
        return device;
    }
};



Browser.prototype.getDevices = function ( skipCheck ) {
    var devices = [];
    for ( var DeviceId in this.devices ) {
        var device = this.devices[ DeviceId ];
        if ( skipCheck || device.isReady() ) {
            devices.push( device );
        }
    }
    return devices;
};
