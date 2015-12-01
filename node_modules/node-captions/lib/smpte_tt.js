/** @module smpte_tt
 * @memberOf node-captions
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true, todo: true */
'use strict';

var fs = require('fs'),
    moment = require('moment'),
    macros = require('./macros.js'),
    SMPTE_TT = require('../config/smpte_tt.json');

module.exports = {
    /**
     * Generate SAMI captions from JSON
     * @function
     * @param {array} captions - File to read
     * @public
     */
    generate: function (captions) {
        var SMPTE_TT_BODY = '';
        //
        SMPTE_TT_BODY += SMPTE_TT.header.join('\n') + '\n';
        captions.forEach(function (caption) {
            if (caption.text.length > 0) {
                if ((/&/.test(caption.text)) && (!(/&amp;/.test(caption.text)) || !(/&gt;/.test(caption.text)) || !(/&lt;/.test(caption.text)))) {
                    caption.text = caption.text.replace(/&/g, '&amp;');
                }
                if ((/</.test(caption.text)) && !(/&lt;/.test(caption.text))) {
                    caption.text = caption.text.replace(/</g, '&lt;');
                }
                if ((/>/.test(caption.text)) && !(/&gt;/.test(caption.text))) {
                    caption.text = caption.text.replace(/>/g, '&gt;');
                }
                SMPTE_TT_BODY += SMPTE_TT.lineTemplate.replace('{startTime}', module.exports.formatTime(caption.startTimeMicro))
                                                      .replace('{endTime}', module.exports.formatTime(caption.endTimeMicro))
                                                      .replace('{text}', module.exports.renderMacros(macros.fixItalics(macros.cleanMacros(caption.text)))) + '\n';
            }
        });

        return SMPTE_TT_BODY + SMPTE_TT.footer.join('\n') + '\n';
    },
    /**
     * Renders macros to SAMI specific stylings
     * @function
     * @param {string} data - caption string to render macros for
     * @public
     */
    renderMacros: function (data) {
        return data.replace(/\{break\}/g, '<br/>')
                   .replace(/\{italic\}/g, '<span tts:fontStyle="italic">')
                   .replace(/\{end-italic\}/g, '</span>');
    },
    /**
     * Formats microseconds to SAMI timestamp
     * @function
     * @param {string} microseconds - microseconds
     * @public
     */
    formatTime: function (microseconds) {
        var milliseconds = microseconds / 1000;
        return moment.utc(milliseconds).format("HH:mm:ss:SS");
    }



};
