/** @module srt
 * @memberOf node-captions
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true, todo: true, continue: true */
'use strict';

var fs = require('fs'),
    moment = require('moment'),
    macros = require('./macros.js');
var SRT_REGEX_STRING = "/^([0-9])+\n([0-9:,]*) --> ([0-9:,]*)((\n.*)+)/m",
    SRT_REGEX = new RegExp(SRT_REGEX_STRING);

module.exports = {
    /**
     * Generates SRT captions from JSON
     * @function
     * @param {array} captions - JSON array of captions
     * @public
     */

    generate: function (captions) {
        var SRT_BODY = [],
            counter = 1;
        captions.forEach(function (caption) {
            if (caption.text.length > 0) {
                SRT_BODY.push(counter);
                SRT_BODY.push(module.exports.formatTime(caption.startTimeMicro) + ' --> ' + module.exports.formatTime(caption.endTimeMicro));
                SRT_BODY.push(module.exports.renderMacros(macros.fixItalics(macros.cleanMacros(caption.text))) + '\n');
                counter++;
            }
        });
        return SRT_BODY.join('\n');
    },
    /**
     * Renders SRT stylings from macros
     * @function
     * @param {string} data - text to render macros
     * @public
     */
    renderMacros: function (data) {
        return data.replace(/\{break\}/g, '\n').replace(/\{italic\}/g, '<i>').replace(/\{end-italic\}/g, '</i>');
    },
    /**
     * formats microseconds into SRT timestamps
     * @function
     * @param {string} microseconds - microseconds
     * @public
     */
    formatTime: function (microseconds) {
        var milliseconds = microseconds / 1000;
        return moment.utc(milliseconds).format("HH:mm:ss,SSS");
    },

    /**
     * Reads a SRT file and verifies it sees the proper header
     * @function
     * @param {string} file - path to file
     * @param {callback} callback - callback to call when complete
     * @public
     */
    read: function (file, options, callback) {
        fs.readFile(file, options, function (err, data) {
            if (err) {
                return callback(err);
            }
            module.exports.parse(data.toString(), function (parseErr, lines) {
                if (parseErr) { return callback(parseErr); }
                callback(undefined, lines);
            });
        });
    },
    /**
     * Parses srt captions, errors if format is invalid
     * @function
     * @param {string} filedata - String of caption data
     * @param {callback} callback - function to call when complete
     * @public
     */
    parse: function (filedata, callback) {
        var lines;
        lines = filedata.toString().split(/(?:\r\n|\r|\n)/gm);
        if (module.exports.verify(lines)) {
            return callback(undefined, lines);
        }
        return callback('INVALID_SRT_FORMAT');
    },
    /**
     * verifies srt data
     * @function
     * @param {array} data - JSON array of captions
     * @public
     */
    verify: function (data) {
        //has to be an array of lines.
        return (/1/.test(data[0]) && data[1].match(/-->/));
    },

    /**
     * converts SRT to JSON format
     * @function
     * @param {array} data - output from read usually
     * @public
     */
    toJSON: function (data) {
        var json = {},
            index = 0,
            id,
            text,
            startTimeMicro,
            durationMicro,
            invalidText = /^\s+$/,
            endTimeMicro,
            time,
            lastNonEmptyLine;
        function getLastNonEmptyLine(linesArray) {
            var idx = linesArray.length - 1;
            while (idx >= 0 && !linesArray[idx]) {
                idx--;
            }
            return idx;
        }

        json.captions = [];
        lastNonEmptyLine = getLastNonEmptyLine(data) + 1;

        while (index < lastNonEmptyLine) {
            if (data[index]) {
                text = [];
                //Find the ID line..
                if (/^[0-9]+$/.test(data[index])) {
                    //found id line
                    id = parseInt(data[index], 10);
                    index++;
                }
                if (!data[index].split) {
                    // for some reason this is not a string
                    index++;
                    continue;
                }
                //next line has to be timestamp right? right?
                time = data[index].split(/[\t ]*-->[\t ]*/);
                startTimeMicro = module.exports.translateTime(time[0]);
                endTimeMicro = module.exports.translateTime(time[1]);
                durationMicro = parseInt(parseInt(endTimeMicro, 10) - parseInt(startTimeMicro, 10), 10);
                if (!startTimeMicro || !endTimeMicro) {
                    // no valid timestamp
                    index++;
                    continue;
                }
                index++;
                while (data[index]) {
                    text.push(data[index]);
                    index++;
                    if (!data[index] && !invalidText.test(text.join('\n'))) {
                        json.captions.push({
                            id: id,
                            text: module.exports.addMacros(text.join('\n')),
                            startTimeMicro: startTimeMicro,
                            durationSeconds: parseInt(durationMicro / 1000, 10) / 1000,
                            endTimeMicro: endTimeMicro
                        });
                        break;
                    }
                }
            }
            index++;
        }
        return json.captions;

    },
    /**
     * translates timestamp to microseconds
     * @function
     * @param {string} timestamp - string timestamp from srt file
     * @public
     */
    translateTime: function (timestamp) {
        if (!timestamp) {
            return;
        }
        //TODO check this
        //var secondsPerStamp = 1.001,
        var timesplit = timestamp.replace(',', ':').split(':');
        return (parseInt(timesplit[0], 10) * 3600 +
                parseInt(timesplit[1], 10) * 60 +
                parseInt(timesplit[2], 10) +
                parseInt(timesplit[3], 10) / 1000) * 1000 * 1000;

    },
    /**
     * converts SRT stylings to macros
     * @function
     * @param {string} text - text to render macros for
     * @public
     */
    addMacros: function (text) {
        return macros.cleanMacros(text.replace(/\n/g, '{break}').replace(/<i>/g, '{italic}').replace(/<\/i>/g, '{end-italic}'));
    }




};
