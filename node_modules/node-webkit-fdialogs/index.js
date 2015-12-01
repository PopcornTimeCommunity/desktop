/** 
 * A module for manage file dialogs in node-webkit.
 * @module FDialogs
 */

'use strict';

var FDialog = require('./lib/fdialog');

module.exports = {

    FDialog: FDialog,

    /** Display dialog and get Path */
    getFilePath: function (cb) {
        var fd = new FDialog();
        
        fd.getFilePath(cb);

    },

    /** Display dialog and return content and path of a file */
    readFile: function (defaultPath, cb) {
    
        if (typeof defaultPath == 'function') {
            cb = defaultPath;
            defaultPath = null;
        }

        var fd = new FDialog({
            path: defaultPath,
            type: 'open'
        });

        fd.readFile(cb);

    },

    /** Display dialog and save content in a file */
    saveFile: function (data,defaultPath, cb) {

        if (!Buffer.isBuffer(data))
            throw new Error("Data should be a Buffer");


        if (typeof defaultPath == 'function') {
            cb = defaultPath;
            defaultPath = null;
        }

        var fd = new FDialog({
            type: 'save',
            defaultSavePath: defaultPath
        });

        fd.saveFile(data, cb);

    }  

};
