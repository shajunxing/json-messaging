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
    var dgram = require('dgram');
    var util = require('util');
    var log = require('./log');
    var protocol = require('./protocol');
    var exchange = require('./exchange');

    // create UDP server, returns server instance
    // UDP can only be used to publish messages, message subscription is not supported.
    // "maxFrameSize" is not used because UDP packets always have limited size.
    exports.createServer = function (port, maxFrameSize) {
        var udpServer = dgram.createSocket('udp4');

        udpServer.on('listening', function () {
            log.info(
                'UDP server listening at %s:%d',
                udpServer.address().address,
                udpServer.address().port
            );
        });

        udpServer.on('message', function (msg, rinfo) {
            try {
                var parsed = JSON.parse(msg);
                switch (parsed.type) {
                    case 'publish':
                        handlePublish(parsed);
                        break;
                    case 'subscribe':
                    case 'unsubscribe':
                        throw new Error(util.format('Unsupported message type \'%s\'', parsed.type));
                        break;
                    default:
                        throw new Error(util.format('Unknown message type \'%s\'', parsed.type));
                        break;
                }
            } catch (e) {
                log.warn(e);
            }
        });

        // handle 'publish' frame
        var handlePublish = function (parsed) {
            exchange.push(parsed.content, parsed.destination);
        };

        udpServer.on('error', function (exception) {
            log.error('UDP Server encountered error: %j', exception);
            udpServer.close();
        });

        udpServer.on('close', function () {
            log.info('UDP Server closed');
        });

        udpServer.bind(port);

        return udpServer;
    };
}());

