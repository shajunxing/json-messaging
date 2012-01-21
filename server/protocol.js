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

function messageFrame(content, match) {
    return JSON.stringify({
        type: 'message',
        match: match,
        content: content
    });
}

function errorFrame(content) {
    return JSON.stringify({
        type: 'error',
        content: content
    });
}

function publishFrame(content, destination) {
    return JSON.stringify({
        type: 'publish',
        destination: destination,
        content: content
    });
}

function subscribeFrame(destination) {
    return JSON.stringify({
        type: 'subscribe',
        destination: destination
    });
}

function unsubscribeFrame(destination) {
    return JSON.stringify({
        type: 'unsubscribe',
        destination: destination
    });
}

module.exports = {
    messageFrame: messageFrame,
    errorFrame: errorFrame,
    publishFrame: publishFrame,
    subscribeFrame: subscribeFrame,
    unsubscribeFrame: unsubscribeFrame
};