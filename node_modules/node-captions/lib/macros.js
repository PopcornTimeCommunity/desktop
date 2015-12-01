/** @module macros 
 * @memberOf node-captions
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true, todo: true, continue: true */
'use strict';

     /**
     * Adds macros and removes duplicate macros from caption translation. Basically a cleanup function to make the caption text pretty.
     * @function
     * @public
     * @param {string} text - Translated caption JSON text
     */
module.exports = {
    /**
     * fixes italics..
     * @function
     * @public
     * @param {string} text - Translated text
     */
    fixItalics: function (text) {
        var openItalic = false,
            cText = [],
            italicStart = new RegExp(/\{italic\}/),
            commandBreak = new RegExp(/\{break\}/),
            italicEnd = new RegExp(/\{end-italic\}/),
            finalText = "",
            textArray = text.split(''),
            idx = 0;

        for (idx = 0; idx <= textArray.length; idx++) {
            cText.push(textArray[idx]);
            if (italicStart.test(cText.join('')) && openItalic === false) {
                // found an italic start, push to array, reset.
                finalText += cText.join('');
                cText = [];
                openItalic = true;
            } else if (commandBreak.test(cText.join('')) && openItalic === false) {
                finalText += cText.join('');
                cText = [];
                openItalic = false;
            } else if (commandBreak.test(cText.join('')) && openItalic === true) {
                finalText += cText.join('').replace(commandBreak, '{end-italic}{break}');
                cText = [];
                openItalic = false;
            } else if (italicStart.test(cText.join('')) && openItalic) {
                // found an italic start within another italic...prepend an end
                finalText += cText.join('');
                cText = [];
                openItalic = true;
            } else if (italicEnd.test(cText.join('')) && openItalic) {
                finalText += cText.join('');
                cText = [];
                openItalic = false;
            } else if (italicEnd.test(cText.join('')) && openItalic === false) {
                //drop useless end italics that are out of place.
                finalText += cText.join('').replace(italicEnd, '');
                cText = [];
                openItalic = false;
            }
            if (idx === text.length) {
                if (openItalic) {
                    finalText += cText.join('') + '{end-italic}';
                } else {
                    finalText += cText.join('');
                }

                cText = [];
            }
        }

        return finalText;

    },
    cleanMacros: function (text) {
        var italicStarts, italicEnds, tmpText, i = 1;
        tmpText = text.replace(/(\{break\})+/g, '{break}')
                      .replace(/(\{italic\})+/g, '{italic}')
                      .replace(/(([aA0-zZ0])\{italic\})+/g, '$2 {italic}')
                      .replace(/\{italic\}\{end-italic\}/g, '')
                      .replace(/(\{end-italic\})+/g, '{end-italic}')
                      .replace(/(\{end-italic\}([aA0-zZ9]))+/g, '{end-italic} $2')
                      .replace(/^\{break\}/, '')
                      .replace(/\{break\}$/, '')
                      .replace(/\{break\}\s+$/, '')
                      .replace(/^\s+\{break\}/, '')
                      .replace(/\{break\}\s+\{break\}/, '{break}')
                      .replace(/^\{end-italic\}/, '');

        if (/\{italic\}/.test(tmpText) || /\{end-italic\}/.test(tmpText)) {
            if (tmpText.match(/\{italic\}/g)) {
                italicStarts = tmpText.match(/\{italic\}/g).length;
            } else {
                italicStarts = 0;
            }
            if (tmpText.match(/\{end-italic\}/g)) {
                italicEnds = tmpText.match(/\{end-italic\}/g).length;
            } else {
                italicEnds = 0;
            }
            if (italicStarts > italicEnds) {
                // we need to add an end
                for (i = 1; i <= (italicStarts - italicEnds); i++) {
                    tmpText += '{end-italic}';
                }
            }
            if (italicEnds > italicStarts) {
                //this is dangerous.
                for (i = 1; i <= italicStarts; i++) {
                    tmpText = tmpText.replace(/\{end-italic\}/, '');
                }
            }
            if (italicEnds && italicStarts === 0) {
                tmpText = tmpText.replace(/\{end-italic\}/g, '');
            }

        }
        return tmpText;
    }
};
