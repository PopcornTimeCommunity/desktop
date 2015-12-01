var xmlrpc = require('xmlrpc'),
    Q = require('q'),
    _ = require('lodash');

var client = xmlrpc.createClient({ host: 'api.opensubtitles.org', port: 80, path: '/xml-rpc'});

function OpenSubtitles() {
    return;
}

var login = function (userAgent) {
    return Q.Promise(function (resolve, reject) {

        client.methodCall('LogIn', ['', '', 'en', userAgent], function (err, res) {
            if (err || !res) {
                var errorMessage = err ? err.message : new Error('no token returned');
                return reject(errorMessage);
            }
            return resolve(res.token);
        });

    });
};

var search = function (data) {
    var opts = {};
    opts.sublanguageid = 'all';

    // Do a hash or imdb check first (either), then fallback to filename
	// Without imdbid, only check filename
    if (data.hash) {
        opts.moviehash = data.hash;
    } else if (data.imdbid) {
        opts.imdbid = data.imdbid.replace('tt', '');
        opts.season = data.season;
        opts.episode = data.episode;
    } else {
        opts.tag = data.filename;
    }

    return Q.Promise(function (resolve, reject) {

        client.methodCall('SearchSubtitles', [
            data.token,
            [
                opts
            ]
        ], function (err, res) {

            if (err || res.data === false) {
                if (data.recheck !== true && data.imdbid) {
                    return reject(err || 'noResult');
                } else {
                    return reject(err || 'Unable to extract subtitle');
                }
            }

            // build our output
            var subs = {};

            _.each(res.data, function (sub) {

                if (sub.SubFormat !== 'srt') {
                    return;
                }

                // episode check
                if (res.data.season && res.data.episode) {
                    if (parseInt(sub.SeriesIMDBParent, 10) !== parseInt(res.data.imdbid.replace('tt', ''), 10)) {
                        return;
                    }
                    if (sub.SeriesSeason !== res.data.season) {
                        return;
                    }
                    if (sub.SeriesEpisode !== res.data.episode) {
                        return;
                    }
                }

                var tmp = {};
                tmp.url = sub.SubDownloadLink.replace('.gz', '.srt');
                tmp.lang = sub.ISO639;
                tmp.downloads = sub.SubDownloadsCnt;
                tmp.score = 0;

                if (sub.MatchedBy === 'moviehash') {
                    tmp.score += 100;
                }
                if (sub.MatchedBy === 'tag') {
                    tmp.score += 50;
                }
                if (sub.UserRank === 'trusted') {
                    tmp.score += 100;
                }
                if (!subs[tmp.lang]) {
                    subs[tmp.lang] = tmp;
                } else {
                    // If score is 0 or equal, sort by downloads
                    if (tmp.score > subs[tmp.lang].score || (tmp.score === subs[tmp.lang].score && tmp.downloads > subs[tmp.lang].score.downloads)) {
                        subs[tmp.lang] = tmp;
                    }
                }
            });

            return resolve(subs);

        });

    });
};

OpenSubtitles.prototype.searchEpisode = function (data, userAgent) {
    return login(userAgent)
        .then(function(token) {
            data.token = token;
            return search(data);
        }).fail(function (error) {
            if (error === 'noResult') {
                // try another search method
                return search({
                    filename: data.filename,
                    recheck: true,
                    token: data.token
                });
            } else {
                return error;
            }
        });
};

module.exports = new OpenSubtitles();