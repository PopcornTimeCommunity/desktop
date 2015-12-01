"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Device = require("./Device");
var Client = require("castv2-client").Client;
var MediaReceiver = require("castv2-client").DefaultMediaReceiver;

var Chromecast = (function (_Device) {
    function Chromecast(opts) {
        _classCallCheck(this, Chromecast);

        this.host = opts.address;
        this.name = opts.name;
        this.xml = opts.xml;
        this.type = opts.type;
    }

    _inherits(Chromecast, _Device);

    _createClass(Chromecast, {
        play: {
            value: function play(url, timestamp) {
                var _this = this;

                if (this._client) this._client.close();

                this._client = new Client();
                this._client.connect(this.host, function (err) {
                    if (err) return _this.emit("error", err);

                    _this._client.launch(MediaReceiver, function (err, player) {
                        if (err) return _this.emit("error", err);

                        _this._player = player;

                        var opts = {
                            autoplay: true,
                            currentTime: timestamp
                        };

                        var content = {
                            contentId: url,
                            contentType: "video/mp4"
                        };

                        _this._player.load(content, opts, function (err) {
                            if (err) return _this.emit("error", err);
                        });
                    });
                });
            }
        },
        stop: {
            value: function stop() {
                var _this = this;

                if (!this._player) {
                    return;
                }this._player.stop(function () {
                    _this._player = null;
                });
            }
        }
    });

    return Chromecast;
})(Device);

module.exports = Chromecast;