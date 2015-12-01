"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var EventEmitter = require("events").EventEmitter;

var Device = (function (_EventEmitter) {
    function Device() {
        _classCallCheck(this, Device);

        if (_EventEmitter != null) {
            _EventEmitter.apply(this, arguments);
        }
    }

    _inherits(Device, _EventEmitter);

    _createClass(Device, {
        play: {
            value: function play(url, timestamp) {
                throw "Not implemented";
            }
        },
        stop: {
            value: function stop() {
                throw "Not implemented";
            }
        },
        onError: {
            value: function onError(cb) {
                this.on("error", cb);
            }
        }
    });

    return Device;
})(EventEmitter);

module.exports = Device;