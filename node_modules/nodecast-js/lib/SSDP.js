"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var EventEmitter = require("events").EventEmitter;
var dgram = require("dgram");

var BROADCAST_ADDR = "239.255.255.250";
var BROADCAST_PORT = 1900;
var M_SEARCH = "M-SEARCH * HTTP/1.1\r\nHost: " + BROADCAST_ADDR + ":" + BROADCAST_PORT + "\r\nMan: \"ssdp:discover\"\r\nST: %st\r\nMX: 3\r\n\r\n";
var SEND_INTERVAL = 5000;

var ssdpHeader = /^([^:]+):\s*(.*)$/;

function noop() {
    return undefined;
}

function getHeaders(res) {
    var lines = res.split("\r\n");

    var headers = {};

    lines.forEach(function (line) {
        if (line.length) {
            var pairs = line.match(ssdpHeader);
            if (pairs) headers[pairs[1].toUpperCase()] = pairs[2];
        }
    });

    return headers;
}

function getStatusCode(res) {
    var lines = res.split("\r\n");
    var type = lines.shift().split(" ");

    return parseInt(type[1], 10);
}

function parseResponse(message, rinfo) {
    if (this._processed.indexOf(rinfo.address) !== -1) {
        return;
    }var response = message.toString();
    if (getStatusCode(response) !== 200) {
        return;
    }var headers = getHeaders(response);

    this._processed.push(rinfo.address);
    this.emit("response", headers, rinfo);
}

function send(st) {
    var message = new Buffer(M_SEARCH.replace("%st", st), "ascii");
    this._socket.send(message, 0, message.length, BROADCAST_PORT, BROADCAST_ADDR, noop);
}

var SSDP = (function (_EventEmitter) {
    function SSDP(port) {
        var _this = this;

        _classCallCheck(this, SSDP);

        this._processed = [];
        this._socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
        this._socket.on("message", parseResponse.bind(this));
        this._socket.bind(port, function () {
            _this._socket.setMulticastTTL(4);
            _this._socket.addMembership(BROADCAST_ADDR);
        });
    }

    _inherits(SSDP, _EventEmitter);

    _createClass(SSDP, {
        search: {
            value: function search(st) {
                send.call(this, st);
                this._interval = setInterval(send.bind(this, st), SEND_INTERVAL);
            }
        },
        onResponse: {
            value: function onResponse(cb) {
                this.on("response", cb);
            }
        },
        destroy: {
            value: function destroy() {
                this._socket = null;
                if (!this._interval) {
                    return;
                }clearInterval(this._interval);
            }
        }
    });

    return SSDP;
})(EventEmitter);

module.exports = SSDP;
