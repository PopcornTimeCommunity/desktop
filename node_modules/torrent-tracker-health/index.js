var readTorrent = require('read-torrent'),
    Q = require('q'),
    async = require('async'),
    util = require('util'),
    LOG = require('debug')('torrent-tracker-health'),
    Tracker = require('torrent-tracker');

module.exports = getHealth;

var trackerCache = {
    trackers: {},
    get: function (tracker) {
        if (tracker in this.trackers) {
            return this.trackers[tracker];
        } else {
            this.trackers[tracker] = new Tracker(tracker);
            return this.trackers[tracker];
        }
    }
};

function getHealth(uri, options) {
    if (!options) {
        options = {};
    }

    if (typeof uri === 'object') {
        if (!uri.uri) {
            throw 'No torrent URI specified';
        } else {
            options = uri;
            uri = options.uri;
        }
    }

    var defer = Q.defer();

    readTorrent(uri, function (err, info) {
        if (err) {
            LOG('Error in read-torrent: ' + err.message);
            return defer.reject(err);
        } else {
            if (!util.isArray(info.announce)) {
                info.announce = [info.announce];
            }

            if (options.force && util.isArray(options.force)) {
                options.force.forEach(function (trUri) {
                    if (info.announce.indexOf(trUri) === -1) {
                        // Add the "forced" trackers to the list
                        info.announce.push(trUri);
                    }
                });
            }

            async.map(info.announce, function (trUri, done) {
                // Check the tracker URI isn't blacklisted
                if (options.blacklist && options.blacklist.some(function (regex) {
                    if (typeof regex === 'string') {
                        regex = new RegExp(regex);
                    }
                    return regex.test(trUri);
                })) {
                    // Don't try to scrape it.
                    return done(null, null);
                }

                LOG('Obtaining tracker for ' + trUri);
                var tracker = trackerCache.get(trUri);
                tracker.scrape([info.infoHash], {
                    timeout: options.timeout
                }, function (err, data) {
                    if (err) {
                        if (err.message === 'timed out' || err.code === 'ETIMEDOUT') {
                            LOG('Scrape timed out for ' + trUri);
                            return done(null, null);
                        } else {
                            LOG('Error in torrent-tracker: ' + err.message);
                            return done(err, null);
                        }
                    } else {
                        return done(null, {
                            seeds: data[info.infoHash].seeders,
                            peers: data[info.infoHash].leechers
                        });
                    }
                });
            }, function (err, results) {
                if (err) {
                    LOG('Error: ' + err.message);
                    return defer.reject(err);
                } else {
                    var totalSeeds = 0,
                        totalPeers = 0,
                        total = 0;
                    results.forEach(function (result) {
                        if (!result) {
                            return;
                        }
                        totalSeeds += result.seeds | 0;
                        totalPeers += result.peers | 0;
                        total++;
                    });

                    // Avoid divide-by-zero issues
                    if (total === 0) {
                        total = 1;
                    }

                    return defer.resolve({
                        seeds: Math.round(totalSeeds / total) | 0,
                        peers: Math.round(totalPeers / total) | 0
                    });
                }
            });
        }
    });

    return defer.promise;
}