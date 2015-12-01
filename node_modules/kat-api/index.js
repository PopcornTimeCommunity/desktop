'use strict';

var request = require('request'),
    URI = require('URIjs'),
    Q = require('q');

var url = URI('https://kat.cr'),
    mirror = URI('http://kickassunblock.net');

var queryTorrents = function (query, retry) {
    var defer = Q.defer(),
        queryParams = {},
        endpoint = 'json.php';

    if (!query || (query && typeof query !== 'string'&& !query.query && !query.category && !query.min_seeds && !query.uploader && !query.age && !query.safety_filter && !query.verified && !query.language)) {
        defer.reject(new Error('Missing a mandatory parameter'));
        return defer.promise;
    }

    if (typeof query === 'string') {
        queryParams = { q: query };
    } else {
        queryParams.q = query.query || '';
        if (query.category) queryParams.q += ' category:' + query.category;
        if (query.min_seeds) queryParams.q += ' seeds:' + query.min_seeds;
        if (query.uploader) queryParams.q += ' user:' + query.uploader;
        if (query.age) queryParams.q += ' age:' + query.age;
        if (query.safety_filter) queryParams.q += ' is_safe:' + query.safety_filter;
        if (query.verified) queryParams.q += ' verified:' + query.verified;
        if (query.language) queryParams.q += ' lang_id:' + filteredLangCode(query.language);
        if (query.imdb) queryParams.q += ' imdb:' + query.imdb.replace(/\D/g,'');
        if (query.tvrage) queryParams.q += ' tv:' + query.tvrage;
        if (query.sort_by) queryParams.field = query.sort_by;
        if (query.order) queryParams.order = query.order;
        if (query.page) queryParams.page = query.page;
    }

    var requestUri;
    if (!retry) {
        requestUri = url.clone()
            .segment(endpoint)
            .addQuery(queryParams);
    } else {
         requestUri= mirror.clone()
            .segment(endpoint)
            .addQuery(queryParams);
    }

    var t = Date.now();
    request(requestUri.toString(), {
        json: true
    }, function (error, response, body) {
        if (error) {
            defer.reject(error, retry);
        } else if (!body || response.statusCode >= 400) {
            defer.reject(new Error('No data'), retry);
        } else if (!body.list || Object.keys(body.list).length === 0) {
            defer.reject(new Error('No results'), retry);
        } else {
            defer.resolve(format(body, query.page || 1, Date.now() - t));
        }
    });
    return defer.promise;
};

var format = function (response, page, responseTime) {
    var formatted = {};
    formatted.results = response.list;

    // Format
    formatted.response_time = parseInt(responseTime);
    formatted.page = parseInt(page);
    formatted.total_results = parseInt(response.total_results);
    formatted.total_pages = Math.ceil(formatted.total_results / 25);

    // Add magnet
    for (var i = 0; i < formatted.results.length; i++) {
        formatted.results[i].magnet = 'magnet:?xt=urn:btih:' + formatted.results[i].hash + '&dn=' + formatted.results[i].title.replace(/[^a-z|^0-9]/gi, '+').replace(/\++/g, '+').toLowerCase() + '&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337';
    }
    return formatted;
}

var search = function (query) {
    return queryTorrents(query)
        .then(function (response, retry) {
            return response;
        })
        .catch(function (error, retry) {
            if (!retry) {
                return queryTorrents(query, true);
            } else {
                return error;
            }
        });
};

/* Transform langcodes to the right KAT id. */
var filteredLangCode = function (langcode) {
    if (langcode.replace(/\D/g,'') !== '') return langcode;

    var lang_id = '';
    switch (langcode) {
        case 'en': 
            lang_id = 2;
            break;
        case 'sq': 
            lang_id = 42;
            break;
        case 'ar': 
            lang_id = 7;
            break;
        case 'eu': 
            lang_id = 44;
            break;
        case 'bn': 
            lang_id = 46;
            break;
        case 'pt-br': 
            lang_id = 39;
            break;
        case 'bg': 
            lang_id = 37;
            break;
        case 'yue': 
            lang_id = 45;
            break;
        case 'ca': 
            lang_id = 47;
            break;
        case 'zh': 
            lang_id = 10;
            break;
        case 'hr': 
            lang_id = 34;
            break;
        case 'cs': 
            lang_id = 32;
            break;
        case 'da': 
            lang_id = 26;
            break;
        case 'nl': 
            lang_id = 8;
            break;
        case 'tl': 
            lang_id = 11;
            break;
        case 'fi': 
            lang_id = 31;
            break;
        case 'fr': 
            lang_id = 5;
            break;
        case 'de': 
            lang_id = 4;
            break;
        case 'el': 
            lang_id = 30;
            break;
        case 'he': 
            lang_id = 25;
            break;
        case 'hi': 
            lang_id = 6;
            break;
        case 'hu': 
            lang_id = 27;
            break;
        case 'it': 
            lang_id = 3;
            break;
        case 'ja': 
            lang_id = 15;
            break;
        case 'kn': 
            lang_id = 49;
            break;
        case 'ko': 
            lang_id = 16;
            break;
        case 'lt': 
            lang_id = 43;
            break;
        case 'ml': 
            lang_id = 21;
            break;
        case 'cmn': 
            lang_id = 23;
            break;
        case 'ne': 
            lang_id = 48;
            break;
        case 'no': 
            lang_id = 19;
            break;
        case 'fa': 
            lang_id = 33;
            break;
        case 'pl': 
            lang_id = 9;
            break;
        case 'pt': 
            lang_id = 17;
            break;
        case 'pa': 
            lang_id = 35;
            break;
        case 'ro': 
            lang_id = 18;
            break;
        case 'ru': 
            lang_id = 12;
            break;
        case 'sr': 
            lang_id = 28;
            break;
        case 'sl': 
            lang_id = 36;
            break;
        case 'es': 
            lang_id = 14;
            break;
        case 'sv': 
            lang_id = 20;
            break;
        case 'ta': 
            lang_id = 13;
            break;
        case 'te': 
            lang_id = 22;
            break;
        case 'th': 
            lang_id = 24;
            break;
        case 'tr': 
            lang_id = 29;
            break;
        case 'uk': 
            lang_id = 40;
            break;
        case 'vi': 
            lang_id = 38;
            break;
        default:
            lang_id = '';
    }

    return lang_id;
};

module.exports = {
    search: search
};