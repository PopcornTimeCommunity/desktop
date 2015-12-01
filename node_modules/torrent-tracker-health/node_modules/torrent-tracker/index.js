var _ = require('underscore'),
    bencode = require('bencode'),
    compact2string = require('compact2string'),
    request = require('request'),
    dgram = require('dgram'),
    URI = require('URIjs'),
    hat = require('hat'),
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;

URI.iso8859();

var ACTIONS = { CONNECT: 0, ANNOUNCE: 1, SCRAPE: 2 };
var CONNECTION_ID = new Buffer([0x00, 0x00, 0x04, 0x17, 0x27, 0x10, 0x19, 0x80]);

function Tracker(tracker) {
    EventEmitter.call(this);

    var self = this;

    this._ready = false;
    this.trackerUri = URI(tracker);
    this.peerId = hat(160, 16);

    this.hostname = this.trackerUri.hostname();
    this.port = Number(this.trackerUri.port()) || 80;
    this.udp = this.trackerUri.scheme() === 'udp';

    if(this.udp) {
        this.connectionId = CONNECTION_ID;
        this.transactionCache = {};
        this.socket = dgram.createSocket('udp4');
        // TODO: Implement better transport layer error handling
        this.socket.on('error', function() {});
        this.socket.on('message', function(message, rinfo) {
            message = deserializeResponse(message);

            if (message === null) return;

            // Clear the "retransmit" timer
            try {
                clearTimeout(self.transactionCache[message.transaction_id].timeout);
            } catch (e) {}

            switch(message.type) {
                case 'connect': {
                    self.connectionId = message.connection_id;
                    if(!self._ready) {
                        self._ready = true;
                        self.emit('ready');
                    }
                    break;
                }
                case 'announce': {
                    self.transactionCache[message.transaction_id].callback(undefined, message);
                    break;
                }
                case 'scrape': {
                    var transaction;
                    if(transaction = self.transactionCache[message.transaction_id]) {
                        message.torrent_info = _.object(transaction.request.info_hash, message.torrent_info);
                        transaction.callback(undefined, message.torrent_info);
                    }
                    break;
                }
                case 'error': {
                    var transaction;
                    if(transaction = self.transactionCache[message.transaction_id]) {
                        transaction.callback(Error(message.message), undefined);
                    }
                    break;
                }
            }

            delete self.transactionCache[message.transaction_id];
        })

        var transactId = Number(hat(32, 10));
        var requestData = {
            connection_id: this.connectionId,
            transaction_id: transactId
        }
        this._saveTransaction(transactId, requestData, undefined);
        this.send(serializeConnectRequest(requestData), transactId);

        this._connectionInterval = setInterval(function() {
            var transactId = Number(hat(32, 10));
            // Get new Connection ID from tracker
            var requestData = {
                connection_id: CONNECTION_ID,
                transaction_id: transactId
            }
            self._saveTransaction(transactId, requestData, undefined);
            self.send(serializeConnectRequest(requestData), transactId);
        }, 60000)
    }
}
inherits(Tracker, EventEmitter);

Tracker.prototype._saveTransaction = function(transactionId, requestData, callback) {
    this.transactionCache[transactionId] = {
        request: requestData,
        callback: callback
    }
}

Tracker.prototype.close = function() {
    if(this.udp) {
        clearInterval(this._connectionInterval);
        _.each(this.transactionCache, function(transaction) {
            clearTimeout(transaction.timeout);
        });
        this.socket.close();
    }
}

Tracker.prototype.send = function(packet, transactionId) {
    var self = this;

    if(!this.transactionCache[transactionId].timeoutCount)
        this.transactionCache[transactionId].timeoutCount = 0;

    if(this.transactionCache[transactionId].timeoutCount > 8)
        return;

    this.transactionCache[transactionId].timeout = setTimeout(function() {
        self.send(packet, transactionId);
    }, 15000 * Math.pow(2, this.transactionCache[transactionId].timeoutCount));

    this.socket.send(packet, 0, packet.length, this.port, this.hostname, function(err) {
        if(err) {
            clearTimeout(self.transactionCache[transactionId].timeout);
            if(self.transactionCache[transactionId].callback)
                self.transactionCache[transactionId].callback(err, null);
            delete self.transactionCache[transactionId];
        }
    });

    this.transactionCache[transactionId].timeoutCount++;
}

Tracker.prototype.scrape = function(info_hashes, options, cb) {
    if(typeof options === 'function') {
        cb = options;
        options = {};
    }

    if(!info_hashes || !cb)
        return;
    if(typeof info_hashes === 'string')
        info_hashes = [ info_hashes ];

    if(this.udp) {
        if(!this._ready) {
            var self = this;
            var connectionTimeout;
            var boundCallback = function() {
                clearTimeout(connectionTimeout);
                self.scrape(info_hashes, cb);
            }

            if(options.timeout) {
                connectionTimeout = setTimeout(function() {
                    cb(new Error('timed out'), null);
                    self.removeListener('ready', boundCallback);
                }, options.timeout);
            }

            this.once('ready', boundCallback);
            return;
        }

        var transactionId = Number(hat(32, 10));

        var requestData = {
            connection_id: this.connectionId,
            transaction_id: transactionId,
            info_hash: info_hashes
        };

        if(options.timeout) {
            var self = this;
            setTimeout(function() {
                if(self.transactionCache[transactionId]) {
                    clearTimeout(self.transactionCache[transactionId].timeout);
                    delete self.transactionCache[transactionId];
                    cb(new Error('timed out'), null);
                }
            }, options.timeout);
        }

        this._saveTransaction(transactionId, requestData, cb);
        this.send(serializeScrapeRequest(requestData), transactionId);

    } else {

        var requestUri = this.trackerUri.clone();
        var qs = URI.buildQuery({ 
            info_hash: _.map(info_hashes, function(hash) { return new Buffer(hash, 'hex').toString('binary') }) 
        }, true, false);
        requestUri.filename('scrape' + (requestUri.suffix() ? ('.' + requestUri.suffix()) : ''));
        requestUri.query(qs);
        // options.timeout is either set or undefined, in the latter case request just works as normal
        request(requestUri.toString(), {encoding: null, timeout: options.timeout }, function(err, res, body) {
            if(err) return cb(err, null);

            var data = bencode.decode(body, 'binary');
            data.files = _.object(
                _.map(data.files, function(val, key) { 
                    return [
                        new Buffer(key, 'binary').toString('hex'), 
                        { 
                            seeders: val.complete,
                            completed: val.downloaded,
                            leechers: val.incomplete
                        }
                    ]
                })
            );

            cb(undefined, data.files);
        })

    }
}

function serializeConnectRequest(opts) {
    var buffer = new Buffer(16);
    opts.connection_id.copy(buffer); // Connection ID
    buffer.writeUInt32BE(ACTIONS.CONNECT, 8); // Action
    buffer.writeUInt32BE(opts.transaction_id, 12); // Transaction ID
    return buffer;
}

function serializeAnnounceRequest(opts) {
    var buffer = new Buffer(98);
    opts.connection_id.copy(buffer); // Connection ID
    buffer.writeUInt32BE(ACTIONS.ANNOUNCE, 8); // Action
    buffer.writeUInt32BE(opts.transaction_id, 12); // Transaction ID
    buffer.write(opts.info_hash, 16, 20, 'hex'); // Info Hash
    buffer.write(opts.peer_id, 36, 20, 'hex'); // Peer ID
    buffer.writeUInt32BE(0x00000000, 56); // No 64bit numbers in JS
    buffer.writeUInt32BE(opts.downloaded, 60); // Downloaded Bytes
    buffer.writeUInt32BE(0x00000000, 64);
    buffer.writeUInt32BE(opts.left, 68); // Remaining Bytes
    buffer.writeUInt32BE(0x00000000, 72);
    buffer.writeUInt32BE(opts.uploaded, 76); // Uploaded Bytes
    buffer.writeUInt32BE(EVENTS[opts.event], 80); // Event
    if(opts.ip_address) {
        var ip = opts.ip_address.split('.');
        buffer[84] = Number(ip[0]);
        buffer[85] = Number(ip[1]);
        buffer[86] = Number(ip[2]);
        buffer[87] = Number(ip[3]);
    } else {
        buffer.writeUInt32BE(0, 84);
    }
    buffer.writeUInt32BE(opts.key || 0, 88);
    buffer.writeUInt32BE(opts.num_want, 92);
    buffer.writeUInt16BE(Number(opts.port) || 0, 96);
    return buffer;
}

function serializeScrapeRequest(opts) {
    if(typeof opts.info_hash === 'string')
        opts.info_hash = [ opts.info_hash ];

    var length = 16 + 20 * opts.info_hash.length;
    var buffer = new Buffer(length);

    opts.connection_id.copy(buffer); // Connection ID
    buffer.writeUInt32BE(ACTIONS.SCRAPE, 8); // Action
    buffer.writeUInt32BE(opts.transaction_id, 12); // Transaction ID

    opts.info_hash.forEach(function(info_hash, i) {
        buffer.write(info_hash, 16 + 20 * i, 20, 'hex'); // Info Hashes
    });
    return buffer;
}

function deserializeResponse(packet) {
    var action = packet.readUInt32BE(0);
    switch(action) {
        case 0:
            return deserializeConnectResponse(packet);
        case 1:
            return deserializeAnnounceResponse(packet);
        case 2:
            return deserializeScrapeResponse(packet);
        case 3:
            return deserializeErrorResponse(packet);
        default:
            return null;
    }
}

function deserializeConnectResponse(packet) {
    return {
        type: 'connect',
        transaction_id: packet.readUInt32BE(4),
        connection_id: packet.slice(8, 16)
    }
}

function deserializeAnnounceResponse(packet) {
    return {
        type: 'announce',
        transaction_id: packet.readUInt32BE(4),
        interval: packet.readUInt32BE(8),
        leechers: packet.readUInt32BE(12),
        seeders: packet.readUInt32BE(16),
        peers: compact2string.multi(packet.slice(20))
    }
}

function deserializeScrapeResponse(packet) {
    var transaction_id = packet.readUInt32BE(4);
    var torrents = [];
    for(var i = 8; i < packet.length; i += 12) {
        torrents.push({
            seeders: packet.readUInt32BE(i),
            completed: packet.readUInt32BE(i + 4),
            leechers: packet.readUInt32BE(i + 8)
        });
    }
    return {
        type: 'scrape',
        transaction_id: transaction_id,
        torrent_info: torrents
    }
}

function deserializeErrorResponse(packet) {
    return {
        type: 'error',
        transaction_id: packet.readUInt32BE(4),
        message: packet.toString('utf8', 8)
    }
}

module.exports = Tracker;