"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var SSDP = require("./SSDP");
var EventEmitter = require("events").EventEmitter;
var http = require("http");
var Chromecast = require("./devices/Chromecast");
var UPnP = require("./devices/UPnP");
var Device = require("./devices/Device");

function getXML(address, cb) {
    http.get(address, function (res) {
        var body = "";
        res.on("data", function (chunk) {
            body += chunk;
        });
        res.on("end", function () {
            return cb(body);
        });
    });
}

function search(ssdp, cb) {
    ssdp.setMaxListeners(0);
    ssdp.onResponse(function (headers, rinfo) {
        if (!headers.LOCATION || headers.LOCATION.indexOf("https://") !== -1) return;
        getXML(headers.LOCATION, function (xml) {
            cb(headers, rinfo, xml);
        });
    });
}

function getFriendlyName(xml) {
    return xml.match(/<friendlyName>(.+?)<\/friendlyName>/)[1];
}

var Browser = (function (_EventEmitter) {
    function Browser() {
        _classCallCheck(this, Browser);

        this._chromecastSSDP = new SSDP(3333);
        this._upnpSSDP = new SSDP(3334);
        this._devices = [];
    }

    _inherits(Browser, _EventEmitter);

    _createClass(Browser, {
        searchChromecast: {
            value: function searchChromecast() {
                var _this = this;

                search(this._chromecastSSDP, function (headers, rinfo, xml) {

                    if (xml.search("<manufacturer>Google Inc.</manufacturer>") == -1) return;
                    var name = getFriendlyName(xml);
                    if (!name) return;

                    var device = new Chromecast({
                        name: name,
                        address: rinfo.address,
                        xml: xml,
                        type: "chc"
                    });

                    // _this._devices.push(device);

                    // _this.emit("deviceOn", device);
                });
                this._chromecastSSDP.search("urn:dial-multiscreen-org:service:dial:1");
            }
        },
        searchUPnP: {
            value: function searchUPnP() {
                var _this = this;

                search(this._upnpSSDP, function (headers, rinfo, xml) {

                    var name = getFriendlyName(xml);
                    if (!name) return;

                    var device = new UPnP({
                        name: name,
                        address: rinfo.address,
                        xml: headers.LOCATION,
                        type: "upnp"
                    });

                    _this._devices.push(device);

                    _this.emit("deviceOn", device);
                });
                this._upnpSSDP.search("urn:schemas-upnp-org:device:MediaRenderer:1");
            }
        },
        start: {
            value: function start() {
                this.searchChromecast();
                this.searchUPnP();
            }
        },
        destroy: {
            value: function destroy() {
                this._chromecastSSDP.destroy();
                this._upnpSSDP.destroy();
            }
        },
        onDevice: {
            value: function onDevice(cb) {
                this.on("deviceOn", cb);
            }
        },
        getList: {
            value: function getList() {
                return this._devices;
            }
        }
    });

    return Browser;
})(EventEmitter);

module.exports = Browser;