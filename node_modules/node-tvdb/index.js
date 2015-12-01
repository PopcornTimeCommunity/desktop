/*!
 * node-tvdb
 *
 * Node.js library for accessing TheTVDB API at <http://www.thetvdb.com/wiki/index.php?title=Programmers_API>
 *
 * Copyright (c) 2014-2015 Edward Wellbrook <edwellbrook@gmail.com>
 * MIT Licensed
 */

"use strict";

const request = require("request");
const parser  = require("xml2js").parseString;
const Zip     = require("jszip");

// available providers for remote ids
const REMOTE_PROVIDERS = {
    imdbid: /^tt/i,
    zap2it: /^ep/i
};

// options for xml2js parser
const PARSER_OPTS = {
    trim: true,
    normalize: true,
    ignoreAttrs: true,
    explicitArray: false,
    emptyTag: null
};

const RESPONSE_TYPE = {
    XML: 0,
    ZIP: 1
};

//
// API Client
//

class Client {

    /**
     * Set up tvdb client with API key and optional language (defaults to "en")
     *
     * @param {String} token
     * @param {String} [language]
     * @api public
     */

    constructor(token, language) {
        if (!token) throw new Error("Access token must be set.");

        this.token = token;
        this.language = language || "en";
        this.baseURL = "http://www.thetvdb.com/api";
    }

    /**
     * Get available languages useable by TheTVDB API
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:languages.xml
     *
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getLanguages(callback) {
        const url = `${this.baseURL}/${this.token}/languages.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Languages) ? response.Languages.Language : null);
        }, callback);
    }

    /**
     * Get the current server time
     *
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getTime(callback) {
        const url = `${this.baseURL}/Updates.php?type=none`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Items) ? response.Items.Time : null);
        }, callback);
    }

    /**
     * Get basic series information by name
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:GetSeries
     *
     * @param {String} name
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getSeriesByName(name, callback) {
        const url = `${this.baseURL}/GetSeries.php?seriesname=${name}&language=${this.language}`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            response = (response && response.Data) ? response.Data.Series : null;
            done(!response || Array.isArray(response) ? response : [response]);
        }, callback);
    }

    /**
     * Get basic series information by id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Base_Series_Record
     *
     * @param {Number|String} id
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getSeriesById(id, callback) {
        const url = `${this.baseURL}/${this.token}/series/${id}/${this.language}.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Data) ? response.Data.Series : null);
        }, callback);
    }

    /**
     * Get basic series information by remote id (zap2it or imdb)
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:GetSeriesByRemoteID
     *
     * @param {String} remoteId
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getSeriesByRemoteId(remoteId, callback) {
        const keys = Object.keys(REMOTE_PROVIDERS);

        let provider = "";
        let len      = keys.length;

        while (len-- && provider === "") {
            if (REMOTE_PROVIDERS[keys[len]].exec(remoteId)) {
                provider = keys[len];
            }
        }

        const url = `${this.baseURL}/GetSeriesByRemoteID.php?${provider}=${remoteId}&language=${this.language}`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Data) ? response.Data.Series : null);
        }, callback);
    }

    /**
     * Get full/all series information by id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Full_Series_Record
     *
     * @param {Number|String} id
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getSeriesAllById(id, callback) {
        const url = `${this.baseURL}/${this.token}/series/${id}/all/${this.language}.zip`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.ZIP, function(response, done) {
            if (response && response.Data && response.Data.Series) {
                response.Data.Series.Episodes = response.Data.Episode;
            }

            done(response ? response.Data.Series : null);
        }, callback);
    }

    /**
     * Get series actors by series id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:actors.xml
     *
     * @param {Number|String} id
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getActors(id, callback) {
        const url = `${this.baseURL}/${this.token}/series/${id}/actors.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Actors) ? response.Actors.Actor : null);
        }, callback);
    }

    /**
     * Get series banners by series id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:banners.xml
     *
     * @param {Number|String} id
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getBanners(id, callback) {
        const url = `${this.baseURL}/${this.token}/series/${id}/banners.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Banners) ? response.Banners.Banner : null);
        }, callback);
    }

    /**
     * Get episode by episode id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Base_Episode_Record
     *
     * @param {Number|String} id
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getEpisodeById(id, callback) {
        const url = `${this.baseURL}/${this.token}/episodes/${id}/${this.language}.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Data) ? response.Data.Episode : null);
        }, callback);
    }

    /**
     * Get series and episode updates since a given unix timestamp
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Updates
     *
     * @param {Number} time
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getUpdates(time, callback) {
        const url = `${this.baseURL}/Updates.php?type=all&time=${time}`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done(response ? response.Items : null);
        }, callback);
    }

    /**
     * All updates within the given interval
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Update_Records
     *
     * @param {String} interval - day|week|month|all
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getUpdateRecords(interval, callback) {
        const url = `${this.baseURL}/${this.token}/updates/updates_${interval}.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done(response ? response.Data : null);
        }, callback);
    }
}

//
// Utilities
//

/**
 * Check if http response is okay to use
 *
 * @param {Error} error
 * @param {Object} resp - request library response object
 * @param {String|Buffer} data - body/data of response
 * @return {Boolean} responseOk
 * @api private
 */

function responseOk(error, resp, data) {
    if (error) return false;
    if (!resp) return false;
    if (resp.statusCode !== 200) return false;
    if (!data) return false;

    // if dealing with zip data buffer is okay
    if (data instanceof Buffer) return true;

    if (data === "") return false;
    if (data.indexOf("404 Not Found") !== -1) return false;

    return true;
}

/**
 * Send and handle http request
 *
 * @param {String} url
 * @param {Function} normalise - a function to tidy the response object
 * @param {Function} [callback]
 * @return {Promise} promise
 * @api private
 */

function sendRequest(urlOpts, response_type, normalise, callback) {
    return new Promise(function(resolve, reject) {
        let reqOpts = {url: urlOpts.url};
        if (response_type === RESPONSE_TYPE.ZIP) {
            reqOpts.encoding = null;
        }

        request(reqOpts, function(error, resp, data) {
            if (!responseOk(error, resp, data)) {
                if (!error) {
                    error = new Error("Could not complete the request");
                }
                error.statusCode = resp ? resp.statusCode : undefined;

                return (callback ? callback : reject)(error);
            } else if (error) {
                return (callback ? callback : reject)(error);
            }

            if (response_type === RESPONSE_TYPE.ZIP) {
                try {
                    const zip = new Zip(data);
                    data = zip.file(`${urlOpts.lang}.xml`).asText();
                } catch (err) {
                    return (callback ? callback : reject)(error);
                }
            }

            parseXML(data, normalise, function(error, results) {
                if (callback) {
                    callback(error, results);
                } else {
                    error ? reject(error) : resolve(results);
                }
            });
        });
    });
}

/**
 * Parse XML response
 *
 * @param {String} xml data
 * @param {Function} normalise - a function to tidy the response object
 * @param {Function} callback
 * @api private
 */

function parseXML(data, normalise, callback) {
    parser(data, PARSER_OPTS, function(error, results) {
        if (results && results.Error) {
            return callback(new Error(results.Error));
        }

        normalise(results, function(results) {
            callback(error, results);
        });
    });
}

/**
 * Parse pipe list string to javascript array
 *
 * @param {String} list
 * @return {Array} parsed list
 * @api public
 */

function parsePipeList(list) {
    return list.replace(/(^\|)|(\|$)/g, "").split("|");
}

//
// Exports
//

Client.utils = {
    parsePipeList: parsePipeList
};

module.exports = Client;
