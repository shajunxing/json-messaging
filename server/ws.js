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

var websocket = require('websocket');
var http = require('http');
var util = require('util');
var log = require('./log');
var protocol = require('./protocol');
var exchange = require('./exchange');

// create WebSocket server, returns server instance
exports.createServer = function(port, maxFrameSize) {
    var httpServer = http.createServer();

    httpServer.on('listening', function() {
        log.info(
            'WS Server listening at %s:%d',
            httpServer.address().address,
            httpServer.address().port
        );
    });

    var wsServer = new websocket.server({
        httpServer: httpServer,
        maxReceivedMessageSize: maxFrameSize
    });

    wsServer.on('request', function(request) {
        var connection = request.accept(null, request.origin);

        var address = util.format(
            '%s:%d',
            connection.socket.remoteAddress,
            connection.socket.remotePort
        );

        log.info('WS connection established from %s, origin is %s', address, request.origin);

        var subscriptions = {};

        var handlePublish = function(parsed) {
            exchange.push(parsed.content, parsed.destination);
        };

        var handleSubscribe = function(parsed) {
            var destination = parsed.destination;
            if (destination in subscriptions) {
                throw new Error(util.format('Destination \'%s\' already exists', destination));
            } else {
                log.info('WS subscribe \'%s\' from %s', destination, address);
                var id = exchange.add(destination, deliver);
                subscriptions[destination] = id;
            }
        };

        var handleUnsubscribe = function(parsed) {
            var destination = parsed.destination;
            if (destination in subscriptions) {
                log.info('WS unsubscribe \'%s\' of %s', destination, address);
                var id = subscriptions[destination];
                exchange.remove(id);
                delete subscriptions[destination];
            } else {
                throw new Error(util.format('Destination \'%s\' does not exist', destination));
            }
        };

        var deliver = function(content, match) {
            connection.sendUTF(protocol.messageFrame(content, match));
        };

        connection.on('message', function(message) {
            try {
                if (message.type != 'utf8') {
                    throw new Error('Must be utf-8 format');
                }
                var parsed = JSON.parse(message.utf8Data);
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
                connection.sendUTF(protocol.errorFrame(e.toString()));
            }
        });

        connection.on('close', function(reasonCode, description) {
            log.info('WS connecion closed from %s', address);
            // cleanup
            log.info('WS cleanup all subscriptions of %s', address);
            for (var destination in subscriptions) {
                var id = subscriptions[destination];
                exchange.remove(id);
            }
            subscriptions = {};
        });
    });

    httpServer.listen(port);
    return httpServer;
};