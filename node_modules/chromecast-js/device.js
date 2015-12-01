var Client = require('castv2-client').Client;
var DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;

var events = require('events');
var util = require('util');
var debug = require('debug')('chromecast-js');

/* Chromecast
 * Supported Media: https://developers.google.com/cast/docs/media
 * Receiver Apps: https://developers.google.com/cast/docs/receiver_apps
 */

var Device = function(options) {
	events.EventEmitter.call(this);
	this.config = options;
	this.init();
};

exports.Device = Device;
util.inherits(Device, events.EventEmitter);

Device.prototype.init = function() {
	this.host = this.config.addresses[0];
	this.playing = false;
};

Device.prototype.play = function(resource, n, callback) {
	var self = this;

	// Always use a fresh client when connecting
	if (self.client) self.client.close();
	debug('chromecast-js: Connect to host: '+ self.host);
	//debug('chromecast-js: Config', self.config);
	self.client = new Client();
	self.client.connect(self.host, function(err, status) {
		if (err) {
			console.error('chromecast-js: Error connecting', err);
			return callback(err);
		}
		debug('chromecast-js: Connected, launching player...');
		self.client.launch(DefaultMediaReceiver, function(err, player) {
			if (err) {
				console.error('chromecast-js: Error launching MediaReceiver', err);
				return callback(err);
			}
			self.player = player;
			self._privatePlayMedia(resource, n, callback);
			player.on('status', function(status) {
				if (status) {
					debug('chromecast-js: PlayerState=%s',status.playerState);
					// Propagate status event
					self.emit('status', status);
				}
			});
		});
	});

	self.client.on('error', function(err) {
		debug('chromecast-js Error: %s', err.message);
		self.client.close();
		//TODO: Trigger IDLE state or better yet switch to trigger('device:closed') for these events.
	});
};

Device.prototype._privatePlayMedia = function(resource, n, callback) {
	var self = this;

	options = { autoplay: true,
		currentTime: n || 0 };

	if (typeof(resource) === 'string') {
		var media = {
			contentId: resource,
			contentType: 'video/mp4'
		};
	} else {
		var media = {
			contentId: resource.url,
			contentType: 'video/mp4'
		};
		if (resource.subtitles) {
			var tracks = [];
			var i = 0;
			for (var each in resource.subtitles ) {
				var track = {
					trackId: i,
					type: 'TEXT',
					trackContentId: resource.subtitles[i].url,
					trackContentType: 'text/vtt',
					name: resource.subtitles[i].name,
					language: resource.subtitles[i].language,
					subtype: 'SUBTITLES'
				};
				tracks.push(track);
				i++;
			}

			media.tracks = tracks;
			options['activeTrackIds'] = [0];
		}
		if (resource.subtitles_style) {
			media.textTrackStyle = resource.subtitles_style;
			self.subtitles_style = resource.subtitles_style;
		}
		if (resource.cover) {
			media.metadata = {
				type: 0,
				metadataType: 0,
				title: resource.cover.title,
				images: [
					{ url: resource.cover.url }
				]
			};
		}
	}

	debug('chromecast-js: Loading media: %s (%s)', media.contentId, media.contentType);
	self.player.load(media, options, function(err, status) {
		if (err) {
			console.error('chromecast-js: Error loading media', err);
			return callback(err);
		}
		self.playing = true;
		callback(null, status);
	});
};

Device.prototype.getStatus = function(callback) {
	this.player.getStatus(function(err, status) {
		if (err) {
			debug("chromecast-js.getStatus error: %s", err.message);
			return callback(err);
		}
		callback(null, status);
	});
};

// Seeks to specific offset in seconds into the media
Device.prototype.seekTo = function(newCurrentTime, callback) {
	this.player.seek(newCurrentTime, callback);
};

// Seeks in seconds relative to currentTime
Device.prototype.seek = function(seconds, callback) {
	var self = this;

	// Retrieve updated status just before seek
	self.getStatus(function(err, newStatus) {
		if (err) return callback(err);
		newCurrentTime = newStatus.currentTime + seconds;
		self.seekTo(newCurrentTime, callback);
	});
};

Device.prototype.pause = function(callback) {
	this.playing = false;
	this.player.pause(callback);
};

Device.prototype.unpause = function(callback) {
	this.playing = true;
	this.player.play(callback);
};

Device.prototype.setVolume = function(volume, callback) {
	this.client.setVolume({ level: volume }, callback);
};

Device.prototype.setVolumeMuted = function(muted, callback){
	this.client.setVolume({ muted: muted }, callback);
};

Device.prototype.subtitlesOff = function(callback) {
	this.player.media.sessionRequest({
		type: 'EDIT_TRACKS_INFO',
		activeTrackIds: [] // turn off subtitles.
	}, callback);
};

Device.prototype.changeSubtitles = function(subIdx, callback) {
	this.player.media.sessionRequest({
		type: 'EDIT_TRACKS_INFO',
		activeTrackIds: [subIdx]
	}, callback);
};

Device.prototype.changeSubtitlesSize = function(fontScale, callback) {
	var newStyle = this.subtitles_style;
	newStyle.fontScale = fontScale;
	this.player.media.sessionRequest({
		type: 'EDIT_TRACKS_INFO',
		textTrackStyle: newStyle
	}, callback);
};

// Stop player, wait 5 sec at stand-by screen, then close client.
Device.prototype.stop = function(callback) {
	var self = this;
	self.player.stop(function() {
		debug('chromecast-js: Player Stopped');
		setTimeout(function() {
			self.client.stop(self.player, function() {
				self.client.close();
				self.client = null;
				debug('chromecast-js: Disconnected');
				if (callback) callback();
			});
		}, 5000);
	});
};
