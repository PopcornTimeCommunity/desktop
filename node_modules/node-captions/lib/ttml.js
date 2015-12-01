/** @module ttml
 * @memberOf node-captions
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true, todo: true */
'use strict';

var fs = require('fs'),
    moment = require('moment'),
    macros = require('./macros.js'),
    TTML = require('../config/ttml.json');

module.exports = {

    /**
     * generates TTML from JSON
     * @function
     * @param {array} data - JSON array of captions
     * @public
     */
    generate: function (data) {
        var TTML_BODY = '',
            index = 0,
            splitText,
            captions = data;

        TTML_BODY += TTML.header.join('\n') + '\n';
        captions.forEach(function (caption) {
            if (caption.text.length > 0) {
                if ((/&/.test(caption.text)) && !(/&amp;/.test(caption.text))) {
                    caption.text = caption.text.replace(/&/g, '&amp;');
                }
                if ((/</.test(caption.text)) && !(/&lt;/.test(caption.text))) {
                    caption.text = caption.text.replace(/</g, '&lt;');
                }
                if ((/>/.test(caption.text)) && !(/&gt;/.test(caption.text))) {
                    caption.text = caption.text.replace(/>/g, '&gt;');
                }
                if (/\{break\}/.test(caption.text)) {
                    splitText = caption.text.split('{break}');
                    //TODO this should count for number of breaks and add the appropriate pops where needed.
                    for (index = 0; index < splitText.length; index++) {
                        TTML_BODY += TTML.lineTemplate.replace('{region}', 'pop' + (index + 1))
                                                      .replace('{startTime}', module.exports.formatTime(caption.startTimeMicro))
                                                      .replace('{endTime}', module.exports.formatTime(caption.endTimeMicro))
                                                      .replace('{text}', module.exports.renderMacros(macros.fixItalics(macros.cleanMacros(splitText[index])))) + '\n';
                    }
                } else {
                    TTML_BODY += TTML.lineTemplate.replace('{region}', 'pop1')
                                                  .replace('{startTime}', module.exports.formatTime(caption.startTimeMicro))
                                                  .replace('{endTime}', module.exports.formatTime(caption.endTimeMicro))
                                                  .replace('{text}', module.exports.renderMacros(macros.fixItalics(macros.cleanMacros(caption.text)))) + '\n';
                }
            }
        });

        return TTML_BODY + TTML.footer.join('\n') + '\n';
    },
    /**
     * renders TTML stylings from macros
     * @function
     * @param {string} data - data to convert
     * @public
     */
    renderMacros: function (data) {
        return data.replace(/\{italic\}/g, '').replace(/\{end-italic\}/g, '');
    },
    /**
     * formats microseocnds to TTML timestamp
     * @function
     * @param {string} microseconds - JSON array of captions
     * @public
     */
    formatTime: function (microseconds) {
        var milliseconds = microseconds / 1000;
        return moment.utc(milliseconds).format("HH:mm:ss:SS");
    }



};


