/************************************************************************
 *  Copyright (c) 2011-2012 SHA Junxing.
 *  shajunxing@163.com, shajunxing@gmail.com
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

(function () {

    var log = require('./log');
    var config = require('./config');
    var tcp = require('./tcp');
    var udp = require('./udp');
    var ws = require('./ws');

    log.setLevel(config.logLevel);
    log.setColoredOutput(config.coloredOutput);

    console.info();
    console.info('    ----   ------------');
    console.info('     ||   | --      -- |');
    console.info('     ||   |     --     |');
    console.info('    --     ------------');
    console.info();
    console.info('    Json Messaging version 1.0');
    console.info();
    console.info('    Copyright (C) 2011-2012 SHA Junxing.');
    console.info();
    console.info('    shajunxing@163.com');
    console.info('    shajunxing@gmail.com');
    console.info();

    tcp.createServer(config.tcpPort, config.maxFrameSize);
    udp.createServer(config.udpPort, config.maxFrameSize);
    ws.createServer(config.wsPort, config.maxFrameSize);

}());
