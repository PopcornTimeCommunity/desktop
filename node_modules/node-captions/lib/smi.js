/** @module sami
 * @memberOf node-captions
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true, todo: true */
'use strict';

var fs = require('fs'),
    SAMI = require('../config/sami.json');

module.exports = {
    /**
     * generates SAMI from JSON
     * @function
     * @public
     * @param {string} data - proprietary JSON data to translate to SAMI
     */

    generate: function (data) {
        var SAMI_BODY = '',
            captions = data;

        SAMI_BODY += SAMI.header.join('\n') + '\n';
        captions.forEach(function (caption) {
            if (caption.text === '') {
                caption.text = '&nbsp;';
            }
            SAMI_BODY += SAMI.lineTemplate.replace('{startTime}', Math.floor(caption.startTimeMicro / 1000))
                                          .replace('{text}', module.exports.renderMacros(caption.text)) + '\n';
        });

        return SAMI_BODY + SAMI.footer.join('\n') + '\n';
    },

    /**
     * renders macros into sami-type stylings
     * @function
     * @public
     * @param {string} data - renders sami-type stylings from macros
     */

    renderMacros: function (data) {
        return data.replace(/\{break\}/g, '<br>')
                   .replace(/\{italic\}/g, '<i>')
                   .replace(/\{end-italic\}/g, '</i>');
    }

};
