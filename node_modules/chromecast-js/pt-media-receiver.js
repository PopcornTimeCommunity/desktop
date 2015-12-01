var util = require('util');
var DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;

//! FIXME: Do not use until Popcorn Time gets its AppID back
// See https://git.popcorntime.io/popcorntime/desktop/issues/515
var PopcornStyledMediaReceiver = function()  {
	DefaultMediaReceiver.apply(this, arguments);
};
PopcornStyledMediaReceiver.APP_ID = '887D0748';

util.inherits(PopcornStyledMediaReceiver, DefaultMediaReceiver);

module.exports = PopcornStyledMediaReceiver;
