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

var log = require('./log');

module.exports = {
    // tcp listening port
    tcpPort: 8153,
    // udp listening port
    udpPort: 8154,
    // websocket listening port
    wsPort: 8155,
    // max size of message frame, in chars(not bytes)
    maxFrameSize: 10000,
    // log level
    logLevel: log.LEVEL.ALL,
    // colored output
    coloredOutput: true
};