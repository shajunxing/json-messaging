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

var net = require('net');
var util = require('util');
var log = require('./log');
var protocol = require('./protocol');
var exchange = require('./exchange');

// create TCP server, returns server instance
exports.createServer = function(port, maxFrameSize) {
    var tcpServer = net.createServer();

    tcpServer.on('listening', function() {
        log.info(
            'TCP server listening at %s:%d',
            tcpServer.address().address,
            tcpServer.address().port
        );
    });

    tcpServer.on('connection', function(socket) {
        socket.setEncoding('utf8');

        // get client address and port
        var address = util.format('%s:%d', socket.remoteAddress, socket.remotePort);
        log.info('TCP connection established from %s', address);

        // the message frame
        var frame = '';

        // subscriptions' destination/id pair
        var subscriptions = {};

        // answer the client
        var answer = function(frame) {
            socket.write(frame + '\0', 'utf8');
        };

        // send back message frame to client
        var deliver = function(content, match) {
            answer(protocol.messageFrame(content, match));
        };

        // handle the message frame
        var handle = function(frame) {
            // log.info('Received from %s: %s', address, frame);

            // parse frame
            try {
                var parsed = JSON.parse(frame);
                switch (parsed.type) {
                    case 'publish':
                        handlePublish(parsed);
                        break;
                    case 'subscribe':
                        handleSubscribe(parsed);
                        break;
                    case 'unsubscribe':
                        handleUnsubscribe(parsed);
                        break;
                    default:
                        throw new Error(util.format('Unknown message type \'%s\'', parsed.type));
                        break;
                }
            } catch (e) {
                log.warn(e);
                answer(protocol.errorFrame(e.toString()));
            }
        };

        // handle 'publish' frame
        var handlePublish = function(parsed) {
            exchange.push(parsed.content, parsed.destination);
        };

        // handle 'subscribe' frame
        var handleSubscribe = function(parsed) {
            var destination = parsed.destination;
            if (destination in subscriptions) {
                throw new Error(util.format('Destination \'%s\' already exists', destination));
            } else {
                log.info('TCP subscribe \'%s\' from %s', destination, address);
                var id = exchange.add(destination, deliver);
                subscriptions[destination] = id;
            }
        };

        // handle 'unsubscribe' frame
        var handleUnsubscribe = function(parsed) {
            var destination = parsed.destination;
            if (destination in subscriptions) {
                log.info('TCP unsubscribe \'%s\' of %s', destination, address);
                var id = subscriptions[destination];
                exchange.remove(id);
                delete subscriptions[destination];
            } else {
                throw new Error(util.format('Destination \'%s\' does not exist', destination));
            }
        };

        socket.on('data', function(data) {
            /*
             split the data by '\0'
             for example, '\0\0hello\0\0world\0\0' will be splited into:
             ['', '', 'hello', '', 'world', '', '']
             to handle this array, the rule is:
             1. the first to the (last - 1) item:
             -- append to the frame
             -- handle the frame
             -- clear the frame
             2. the last item:
             -- append to the frame
             */
            var fragments = data.split(/\0/);
            for (var i = 0; i < fragments.length; i++) {
                frame += fragments[i];
                if (frame.length > maxFrameSize) {
                    // test whether the frame exceeded the max size
                    answer(protocol.error(
                        null, 'Maximum frame size exceeded',
                        util.format('The frame is restricted to %d characters due to server config', config.maxFrameSize)));
                    socket.end();
                    break;
                }
                if (i < (fragments.length - 1)) {
                    // handle the frame
                    handle(frame);
                    frame = '';
                }
            }
        });

        // 'close' event will always happened at last while 'end' probably not
        socket.on('close', function() {
            log.info('TCP Connection closed from %s', address);
            // cleanup
            log.info('TCP cleaning up all subscriptions of %s', address);
            for (var destination in subscriptions) {
                var id = subscriptions[destination];
                exchange.remove(id);
            }
            subscriptions = {};
        });
    });

    tcpServer.on('error', function(exception) {
        log.error('TCP Server encountered error: %j', exception);
        tcpServer.close();
    });

    tcpServer.on('close', function() {
        log.info('TCP Server closed');
    });

    tcpServer.listen(port);

    return tcpServer;
};
