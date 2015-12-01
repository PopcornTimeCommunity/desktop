/** @module scc
 * @memberOf node-captions
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true, todo: true, regexp: true */
'use strict';

var fs = require('fs'),
    macros = require('./macros.js'),
    mapping = require('../config/scc.json');

var SCC_HEADER = 'Scenarist_SCC V1.0',
    SCC_HEADER_REGEX = new RegExp(SCC_HEADER),
    SCC_REGEX_STRING = "([0-9:;]*)([\t]*)((.)*)",
    SCC_REGEX = new RegExp(SCC_REGEX_STRING),
    timeStamp,
    popBuffer = '',
    popOn,
    paintOn,
    paintBuffer = '',
    commandBuffer = [],
    paintTime = '',
    popTime = '',
    paintOnCommands = ['9429', '9425', '9426', '94a7'],
    rollUpRows = 0,
    rollRows = [],
    lastCommand,
    frameCount,
    jsonCaptions = [];

function makeCaptionBlock(buffer, startTimeMicro, frames) {
    var cap = {
        startTimeMicro: startTimeMicro,
        endTimeMicro: undefined,
        frames: frames,
        popOn: popOn,
        paintOn: paintOn,
        rollUpRows: rollUpRows,
        commands: commandBuffer.join(' '),
        text: buffer
    };
    commandBuffer = [];
    jsonCaptions.push(cap);
}

function rollUp() {
    if (rollRows.length >= rollUpRows) {
        rollRows.shift(); //if rows already filled, drop the top one
    } else {
        rollRows.push(paintBuffer);
    }
    if (rollRows.length === rollUpRows) {
        if (jsonCaptions[jsonCaptions.length - 1] !== undefined && jsonCaptions[jsonCaptions.length - 1].endTimeMicro === undefined) {
            jsonCaptions[jsonCaptions.length - 1].endTimeMicro = paintTime;
        }
        paintBuffer = rollRows.join(' ');
        makeCaptionBlock(paintBuffer, paintTime, frameCount);
        paintBuffer = '';
        rollRows = [];
    }

}

function doubleCommand(command) {
    if (command === lastCommand) {
        lastCommand = '';
        return true;
    }
    lastCommand = command;
    return false;
}

module.exports = {
    /**
     * Reads a SCC file and verifies it sees the proper header
     * @function
     * @param {string} file - File to read
     * @param {callback} callback - WHen the read is successful callback.
     * @public
     */
    read: function (file, options, callback) {
        var lines;
        fs.readFile(file, options, function (err, data) {
            if (err) {
                //err
                return callback(err);
            }
            if (/\r\n/.test(data.toString())) {
                lines = data.toString().split('\r\n');
            } else {
                lines = data.toString().split('\n');
            }
            if (module.exports.verify(lines[0])) {
                callback(undefined, lines);
            } else {
                callback("INVALID_SCC_FORMAT");
            }
        });
    },
    /**
     * Verifies a SCC file header, returns true/false
     * @function
     * @param {string} header - Header line to verify.
     * @public
     */
    verify: function (header) {
        return SCC_HEADER_REGEX.test(header.trim());
    },

    /**
     * Converts the SCC file to a proprietary JSON format
     * @function
     * @param {string} data - Entire SCC file content
     * @public
     */
    toJSON: function (lines) {
        var idx = 0;
        jsonCaptions = [];
        for (idx = 0; idx < lines.length; idx++) {
            if (!module.exports.verify(lines[idx])) {
                module.exports.translateLine(lines[idx].toLowerCase());
            }
        }
        if (paintBuffer.length > 0) {
            rollUp();
        }
        if (jsonCaptions[jsonCaptions.length - 1].endTimeMicro === undefined) {
            jsonCaptions[jsonCaptions.length - 1].endTimeMicro = jsonCaptions[jsonCaptions.length - 1].startTimeMicro;
        }
        return jsonCaptions;
    },
    /**
     * translates SCC HEX bits to readable characters based on mappings in config/
     * @function
     * @public
     * @param {string} SCCLine - Entire SCC line
     */
    translateLine: function (SCCLine) {
        if (SCCLine.length === 0) {
            return;
        }
        var wordIdx,
            splitLine = SCCLine.match(SCC_REGEX),
            words = splitLine[3].split(' ');
        timeStamp = splitLine[1];
        frameCount = 0;
        for (wordIdx = 0; wordIdx < words.length; wordIdx++) {
            commandBuffer.push(words[wordIdx]);
            module.exports.translateWord(words[wordIdx]);
        }

    },
    translateWord: function (word) {
        //add frame count
        frameCount++;
        //first
        if (mapping.COMMANDS.hasOwnProperty(word)) {
            module.exports.translateCommand(word);
            //second
        } else if (mapping.SPECIAL_CHARS.hasOwnProperty(word)) {
            module.exports.translateSpecialChars(word);
            //third
        } else if (mapping.EXTENDED_CHARS.hasOwnProperty(word)) {
            module.exports.translateExtendedChars(word);
            //fourth
        }
        module.exports.translateCharacters(word);
    },
    translateCommand: function translateCommand(word) {
        var command = word;
        if (doubleCommand(command)) {
            return;
        }
        if (command === '9420') {
            popOn = true;
            paintOn = false;
        } else if (paintOnCommands.indexOf(command) > -1) {
            paintOn = true;
            popOn = false;
            if (command === '9429') {
                rollUpRows = 1;
            } else if (command === '9425') {
                rollUpRows = 2;
            } else if (command === '9426') {
                rollUpRows = 3;
            } else if (command === '94a7') {
                rollUpRows = 4;
            }

            if (paintBuffer.length > 0) {
                //makeCaption
                rollUp();
                paintBuffer = '';
            }
            paintTime = module.exports.processTimeStamp(timeStamp, frameCount);
            //something with paint time..
        } else if (command === '94ae') {
            popBuffer = '';
            //clear pop buffer
        } else if (command === '942f' && popBuffer.length > 0) {
            //time
            //make caption
            popTime = module.exports.processTimeStamp(timeStamp, frameCount);
            if (jsonCaptions[jsonCaptions.length - 1] !== undefined && jsonCaptions[jsonCaptions.length - 1].endTimeMicro === undefined) {
                jsonCaptions[jsonCaptions.length - 1].endTimeMicro = popTime;
            }
            makeCaptionBlock(popBuffer, popTime, frameCount);
            popBuffer = '';
        } else if (command === '94ad') {
            //display paint buffer
            if (paintBuffer.length > 0) {
                rollUp();
            }
        } else if (command === '942c') {
            rollRows = [];
            if (paintBuffer.length > 0) {
                rollUp();
            }
            if (jsonCaptions[jsonCaptions.length - 1] !== undefined && jsonCaptions[jsonCaptions.length - 1].endTimeMicro === undefined) {
                jsonCaptions[jsonCaptions.length - 1].endTimeMicro = module.exports.processTimeStamp(timeStamp, frameCount);
            }
        } else {
            if (paintOn) {
                paintBuffer += mapping.COMMANDS[command];
            } else {
                popBuffer += mapping.COMMANDS[command];
            }
        }
    },
    translateSpecialChars: function translateSpecialChars(word) {
        if (doubleCommand(word)) {
            return;
        }
        if (paintOn) {
            paintBuffer += mapping.SPECIAL_CHARS[word];
        } else {
            popBuffer += mapping.SPECIAL_CHARS[word];
        }
    },
    translateExtendedChars: function translateExtendedChars(word) {
        if (doubleCommand(word)) {
            return;
        }
        if (paintOn) {
            if (paintBuffer.length > 0) {
                paintBuffer = paintBuffer.substring(0, paintBuffer.length - 1);
            }
            paintBuffer += mapping.EXTENDED_CHARS[word];
        } else {
            if (popBuffer.length > 0) {
                popBuffer = popBuffer.substring(0, popBuffer.length - 1);
            }
            popBuffer += mapping.EXTENDED_CHARS[word];
        }
    },
    translateCharacters: function translateCharacters(word) {
        if (word.length > 0) {
            var chars = word.match(/.{1,2}/gi);
            if (mapping.CHARACTERS[chars[0]] === undefined) {
                return;
            }
            if (mapping.CHARACTERS[chars[1]] === undefined) {
                return;
            }
            if (paintOn) {
                paintBuffer += mapping.CHARACTERS[chars[0]];
                paintBuffer += mapping.CHARACTERS[chars[1]];
            } else {
                popBuffer += mapping.CHARACTERS[chars[0]];
                popBuffer += mapping.CHARACTERS[chars[1]];
            }
        }
    },
    processTimeStamp: function (timeStamp, frames) {
        var newFrames,
            stamp = timeStamp.replace(/;/g, ':').split(':'),
            stampFrames = parseInt(stamp[stamp.length - 1], 10);
        if ((stampFrames +  frames) <= 9) {
            newFrames = "0" + (stampFrames +  frames);
        } else {
            newFrames = (stampFrames +  frames);
        }
        stamp[stamp.length - 1] = newFrames;
        return module.exports.translateTime(stamp.join(':'));
    },

    /**
     * Converts SCC timestamps to microseconds
     * @function
     * @public
     * @param {string} timeStamp - Timestamp of SCC line
     */
    translateTime: function (timeStamp) {
        var secondsPerStamp = 1.001,
            timesplit = timeStamp.split(':'),
            timestampSeconds = (parseInt(timesplit[0], 10) * 3600 +
                                parseInt(timesplit[1], 10) * 60 +
                                parseInt(timesplit[2], 10) +
                                parseInt(timesplit[3], 10) / 30),
            seconds = timestampSeconds * secondsPerStamp,
            microSeconds = seconds * 1000 * 1000;
        return (microSeconds > 0) ?  microSeconds : 0;
    }
};

