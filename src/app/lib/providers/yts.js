(function (App) {
    'use strict';
 
    var Q = require('q');
    var request = require('request');
    var inherits = require('util').inherits;
 
    function YTS() {
        if (!(this instanceof YTS)) {
            return new YTS();
        }
 
        App.Providers.Generic.call(this);
    }
    inherits(YTS, App.Providers.Generic);
 
    YTS.prototype.extractIds = function (items) {
        return _.pluck(items.results, 'imdb_id');
    };
 
    var format = function (data, page, limit) {
        console.log("data", data);
        var results = _.chain(data)/*.filter(function (movie) {
                // Filter any 3D only movies
                return _.any(movie.torrents, function (torrent) {
                    return torrent.quality !== '3D';
                });
            })*/.map(function (movie) {
                return {
                    type: 'movie',
                    imdb_id: movie.imdb,
                    title: movie.title,
                    year: movie.year,
                    genre: movie.genres,
                    rating: movie.rating,
                    runtime: movie.runtime,
                    image: movie.poster_med,
                    cover: movie.poster_med,
                    backdrop: movie.poster_big,
                    synopsis: movie.description,
                    trailer: 'https://www.youtube.com/watch?v=' + movie.trailer || false,
                    certification: movie.mpa_rating,
                    torrents: _.reduce(movie.items, function (torrents, torrent) {
                        console.log(torrent);
                        if (torrent.quality !== '3D') {
                                                        if ( !(torrent.quality in torrents) ){
                            torrents[torrent.quality] = {
                                url: torrent.torrent_url,
                                magnet: torrent.torrent_magnet, //'magnet:?xt=urn:btih:' + torrent.hash + '&tr=udp://open.demonii.com:1337&tr=udp://tracker.coppersurfer.tk:6969',
                                size: torrent.size_bytes,
                                filesize: torrent.size_bytes,
                                seed: torrent.torrent_seeds,
                                peer: torrent.torrent_peers
                            };
                                                }
                        }
                        return torrents;
                    }, {})
                };
            }).value();
        console.log("results", results);
        return {
            results: Common.sanitize(results),
            hasMore: true // data.length > page * limit
        };
    };
 
    YTS.prototype.fetch = function (filters) {
        var params = {
            sort_by: 'seeds',
            limit: 50,
            with_rt_ratings: true
        };
 
        if (filters.page) {
            params.page = filters.page;
        }
 
        if (filters.keywords) {
            params.keywords = filters.keywords;
        }
 
        if (filters.genre && filters.genre != 'All') {
            params.genre = filters.genre;
        }
 
        if (filters.order === 1) {
            params.order_by = 'asc';
        }
 
        if (filters.sorter && filters.sorter !== 'popularity') {
            switch (filters.sorter) {
            case 'last added':
                params.sort_by = 'date_added';
                break;
            case 'trending':
                params.sort_by = 'trending_score';
                break;
            default:
                params.sort_by = filters.sorter;
            }
        }
 
        if (Settings.movies_quality !== 'all') {
            params.quality = Settings.movies_quality;
        }
 
        if (Settings.translateSynopsis) {
            params.lang = Settings.language;
        }
 
        var defer = Q.defer();
        function get(index) {
            var options = {
                //uri: Settings.ytsAPI[index].uri + 'list',
                uri:"http://api.torrentsapi.com/list?",
                qs: params,
                json: true,
                timeout: 10000
            };
            console.log('test', params);
 
            /*var url = 'http://api.torrentsapi.com/list?';//sort=seeds&quality=720p&page=' + params.page + "&count=" + params.limit;
            if(filters.keywords){ url+="&keywords="+filters.keywords; }
            jQuery.getJSON(url, function(data) {
                return defer.resolve(format(data.MovieList), params.page, params.limit);
 
            }).fail(function( jqxhr, textStatus, error ) {
                console.log('Error loading data...');
                return defer.reject(textStatus);
 
            });*/
            var req = jQuery.extend(true, {}, Settings.ytsAPI[index], options);
            request(req, function (err, res, data) {
                if (err || res.statusCode >= 400 || (data && !data.MovieList)) {
                    win.warn('YTS API endpoint \'%s\' failed.', Settings.ytsAPI[index].uri);
                    if (index + 1 >= Settings.ytsAPI.length) {
                        return defer.reject(err || 'Status Code is above 400');
                    } else {
                        get(index + 1);
                    }
                    return;
                } else if (!data || data.status === 'error') {
                    err = data ? data.status_message : 'No data returned';
                    return defer.reject(err);
                } else {
                    console.log("data",data);
                    return defer.resolve(format(data.MovieList));
                }
            });
 
 
        }
        get(0);
        return defer.promise;
    };
 
    YTS.prototype.random = function () {
        var defer = Q.defer();
 
        function get(index) {
            var options = {
                uri: Settings.ytsAPI[index].uri + 'api/v2/get_random_movie.json?' + Math.round((new Date()).valueOf() / 1000),
                json: true,
                timeout: 10000
            };
            console.log('getting movies');
            var req = jQuery.extend(true, {}, Settings.ytsAPI[index], options);
            request(req, function (err, res, data) {
                if (err || res.statusCode >= 400 || (data && !data.data)) {
                    win.warn('YTS API endpoint \'%s\' failed.', Settings.ytsAPI[index].uri);
                    if (index + 1 >= Settings.ytsAPI.length) {
                        return defer.reject(err || 'Status Code is above 400');
                    } else {
                        get(index + 1);
                    }
                    return;
                } else if (!data || data.status === 'error') {
                    err = data ? data.status_message : 'No data returned';
                    return defer.reject(err);
                } else {
                    return defer.resolve(Common.sanitize(data.data));
                }
            });
        }
        get(0);
 
        return defer.promise;
    };
 
    YTS.prototype.detail = function (torrent_id, old_data) {
        return Q(old_data);
    };
 
    App.Providers.Yts = YTS;
 
})(window.App);