/************************************************************************
 *  Copyright (c) 2011-2012 SHA Junxing.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ***********************************************************************/

"use strict";

var uuid = require('node-uuid');
var log = require('./log');

var receivers = {};

// push a message with destination and call matched receivers
function push(message, destination) {
    for (var key in receivers) {
        var receiver = receivers[key];
        var destinationRegex = receiver['destination'];
        var callback = receiver['callback'];
        var matchResult = destinationRegex.exec(destination);
        if (matchResult != null) {
            try {
                callback(message, matchResult);
            } catch(e) {
                log.warn(e);
            }
        }
    }
}

// add a message receiver with specify destination regular expression
// destRegex must be a valid regular expression
// due to the RegExp.match() rule, destRegex should start with '^' and end with '$' in most cases
// callback is a function which must meet 'callback(message, matchResult)' format
// the 'matchResult' is the return value of RegExp.match(), without 'g' option
// return a unique identifier as key
function add(destinationRegex, callback) {
    try {
        var receiver = {};
        // may throw 'Invalid regular expression' exception
        // for example, '[' is not a valid regular expression
        receiver['destination'] = new RegExp(destinationRegex);
        if (!(callback instanceof Function)) {
            throw new Error('Callback is not a function');
        }
        receiver['callback'] = callback;
        var key = uuid();
        receivers[key] = receiver;
        return key
    } catch (e) {
        log.warn(e);
        throw e;
    }
}

// remove a message receiver by it's key
function remove(key) {
    //delete receivers[key]['destination'];
    //delete receivers[key]['callback'];
    delete receivers[key];
}

module.exports = {
    push: push,
    add: add,
    remove: remove
};

