/** @module time
 * @memberOf node-captions
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true, todo: true */
'use strict';

var fs = require('fs'),
    moment = require('moment');

module.exports = {
    /**
     * adjust timestamp by X, precision
     * @function
     * @param {integer} adjustment - negative or positive integer amount to adjust the captions by
     * @param {string} precision - precision to adjust captions by
     * @param {array} captions - json array of captions to perform adjustment on created by toJSON
     * @public
     */

    adjust: function (adjustment, precision, captions, callback) {
        //precision should be one of: seconds, milliseconds, microseconds
        var precisionMultipliers = {
            "seconds": 1000000,  //seconds to microseconds
            "milliseconds": 1000, //milliseconds to microseconds
            "microseconds": 1 //microseconds to microseconds
        },
            newStartTime,
            newEndTime,
            adjuster = adjustment * precisionMultipliers[precision];
        if (precisionMultipliers[precision] && captions[0].startTimeMicro !== undefined) {
            //quick check to see if it will zero out the 2nd or 3rd caption
            // there are cases where the first caption can be 00:00:00:000 and have no text.
            if ((captions[1].startTimeMicro + adjuster) <= 0 || (captions[2].startTimeMicro + adjuster) <= 0) {
                return callback("ERROR_ADJUSTMENT_ZEROS_CAPTIONS");
            }
            captions.forEach(function (caption) {
                //calculate new start times...
                newStartTime = caption.startTimeMicro + adjuster;
                newEndTime = caption.endTimeMicro + adjuster;
                if (adjuster > 0) {
                    caption.startTimeMicro = newStartTime;
                    caption.endTimeMicro = newEndTime;
                } else if (newStartTime >= 0 && newEndTime >= 0) {
                    caption.startTimeMicro = newStartTime;
                    caption.endTimeMicro = newEndTime;
                }
            });
            callback(undefined, captions);
        } else {
            callback('NO_CAPTIONS_OR_PRECISION_PASSED_TO_FUNCTION');
        }
    }
};
