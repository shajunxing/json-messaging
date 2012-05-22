# Json Messaging Readme

## Introduction

Json Messaging is a standalone pub/sub messaging server built with node.js, which has following features:

1. Support both TCP and WebSocket protocol.
2. Use Json as frame format.
3. The message destination can be subscribed by regular expression, and the regular expression may contains "capture". Messages matched by the regular expression will be sent to the subscriber, (including capture result if exists).
4. One client can subscribe multiple destinations.
5. The server doesn't persist any message.

## Project

https://sourceforge.net/projects/jsonmessaging/

## Download

https://sourceforge.net/projects/jsonmessaging/files/

## Thanks

Many third party frameworks and technology are used by Json Messaging Server. Thanks for their hard work.

* Json: http://www.json.org
* node.js: http://nodejs.org
* node-uuid: https://github.com/broofa/node-uuid
* WebSocket-Node：https://github.com/Worlize/WebSocket-Node

## Usage

1. Build and install the latest version of node.js.
2. Customize TCP and WebSocket port and other options in "server/config.js".
3. Start the server using command: "node server/server.js".

## Examples

Open the following HTML files by latest version of Firefox or Chrome and send/receive messages.

    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Json Messaging Example</title>
        <style>
            div#output {
                border: 1px solid #000;
                width: 960px;
                height: 450px;
                overflow: auto;
                background-color: #333;
                color: #6cf;
            }

            strong {
                color: #f66;
            }

            input#input {
                border: 1px solid #000;
                width: 640px;
            }

            button {
                border: 1px solid #000;
                width: 100px;
            }
        </style>
        <script>
            // connect to the Json Messaging server and return an 'connection' object
            function connect(host, port, messageListener, errorListener) {
                window.WebSocket = window.WebSocket || window.MozWebSocket;

                if (!window.WebSocket) {
                    alert('Your browser does not support WebSocket.');
                    return null;
                }

                var connection = new WebSocket('ws://' + host + ':' + port);

                connection.onmessage = function(message) {
                    try {
                        var parsed = JSON.parse(message.data);
                        switch (parsed.type) {
                            case 'message':
                                if (messageListener) {
                                    messageListener(parsed.content, parsed.match);
                                }
                                break;
                            case 'error':
                                if (errorListener) {
                                    errorListener(parsed.content);
                                }
                                break;
                            default:
                                throw new Error('Unknown message type ' + parsed.type);
                                break;
                        }
                    } catch (e) {
                        console.warn(e);
                        alert(e);
                    }
                };

                connection.publish = function(content, destination) {
                    connection.send(JSON.stringify({
                        type: 'publish',
                        destination: destination,
                        content: content
                    }));
                };

                connection.subscribe = function(destination) {
                    connection.send(JSON.stringify({
                        type: 'subscribe',
                        destination: destination
                    }));
                };

                connection.unsubscribe = function(destination) {
                    connection.send(JSON.stringify({
                        type: 'unsubscribe',
                        destination: destination
                    }));
                };

                return connection;
            }

            // the 'connection' object
            var connection = null;

            var output = null;

            var input = null;

            // initialize
            window.onload = function() {
                output = document.getElementById('output');
                input = document.getElementById('input');

                // connect to the local server
                connection = connect(
                        'localhost',
                        8155,
                        // message handler
                        function(content, match) {
                            output.innerHTML += ('<strong>Message: </strong>' + content + '<br>\n');
                        },
                        // error handler
                        function(content) {
                            output.innerHTML += ('<strong>Error: </strong>' + content + '<br>\n');
                        }
                );

                // subscribe a topic
                connection.onopen = function() {
                    connection.subscribe('test');
                };
            };

            function _send() {
                connection.publish(input.value, 'test');
            }

            function _clear() {
                output.innerHTML = '';
            }
        </script>
    </head>
    <body>
    <div id="output"></div>
    <input type="text" id="input">
    <button id="send" onclick="_send()">Send</button>
    <button id="clear" onclick="_clear()">Clear</button>
    </body>
    </html>

The following C program sends three "Hello World" messages, the first is english, the second is simplified chinese and the third is unicode escaped simplified chinese. Notice these code must be saved using UTF-8 encoding.

    #include <stdio.h>
    #include <stdlib.h>
    #include <string.h>

    #include <unistd.h>
    #include <fcntl.h>
    #include <sys/types.h>
    #include <sys/socket.h>
    #include <arpa/inet.h>

    int main(int argc, char ** argv)
    {
        int fd;
        struct sockaddr_in addr;
        int ret;
        const char publish_frame_1[] =
        "{\"type\":\"publish\",\"destination\":\"test\",\"content\":\"Hello World\"}";
        const char publish_frame_2[] =
        "{\"type\":\"publish\",\"destination\":\"test\",\"content\":\"你好世界\"}";
        const char publish_frame_3[] =
        "{\"type\":\"publish\",\"destination\":\"test\",\"content\":\"\\u4f60\\u597d\\u4e16\\u754c\"}";

        fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);

        memset(&addr, 0, sizeof(addr));
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = inet_addr("127.0.0.1");
        addr.sin_port = htons(8153);

        ret = connect(fd, (struct sockaddr *)&addr, sizeof(addr));
        printf("%d\n", ret);

        ret = write(fd, publish_frame_1, sizeof(publish_frame_1));
        printf("%d\n", ret);

        ret = write(fd, publish_frame_2, sizeof(publish_frame_2));
        printf("%d\n", ret);

        ret = write(fd, publish_frame_3, sizeof(publish_frame_3));
        printf("%d\n", ret);
    }


## Frame Format

Message frames are packed by Json format, and encoded by UTF-8. In TCP protocol, frames are splited by '\0'.

There are 5 types of frame, 3 for client side and 2 for server side.

### Client Side

#### Publish Frame

The client publish a message to the server's destination. All clients connected to the server and subscribed the destination(may be regular expression) will receive the message.

The format is:

    {
        "type": "publish",
        "destination": <message destination>,
        "content": <message content>
    }

The message destination is a string, and the message content must also be packed by Json format.

#### Subscribe Frame

The client subscribe a destination, and all the messages matched this destination will be sent to the subscriber.

The format is:

    {
        "type": "subscribe",
        "destination": <message destination>
    }

The message destination may be a regular expression, and may include "capture". If matched, the message, the regular expression and the capture(if exists) will be sent to the subscriber. See examples in "Message Frame".

One client can subscribe multiple destinations.

#### Unsubscribe Frame

The client unsubscribe a message destination.

The format is:

    {
        "type": "unsubscribe",
        "destination": <message destination>
    }

The message destination is equal to subscribe frame.

The server will automatically unsubscribe all the destinations of the client if it is disconnected.

### Server Side

#### Message Frame

Once the message destination is matched, the server will send the message and the match result to the subscriber.

The format is:

    {
        "type": "message",
        "match": <match result>,
        "content": <message content>
    }

The match result is an array, which includes at least one element - the subscribe destination. If the subscribe destination is a regular expression and contains "capture", elements from the second to the last will be capture results. See specification of JavaScript regular expression.

For example:

Assume some devices' network interface status needs to be broadcast. The status message destination is formatted as "/devices/<device name>/<interface name>" and the message content is "down" or "up".
The following two publish frames indicete the first network interface of device "a" is down and the zero interface of  device "b" is up.

    {"type":"publish","destination":"/devices/a/if1","content":"down"}
    {"type":"publish","destination":"/devices/b/if0","content":"up"}

If some clients subscribe the destination "/devices/.*", they will receive status of all interfaces, all devices. The received message frames are:

    {"type":"message","match":["/devices/a/if1"],"content":"down"}
    {"type":"message","match":["/devices/b/if0"],"content":"up"}

If client wants to get detailed information of which device and which interface, it can changed the  subscribe destination to "/devices/(.*)/(.*)", and the received message frames will be:

    {"type":"message","match":["/devices/a/if1","a","if1"],"content":"down"}
    {"type":"message","match":["/devices/b/if0","b","if0"],"content":"up"}

And you can see the "match" field now contains capture result.

#### Error Frame

If the server encountered errors, for example: client side frames too long, or invalid Json format, an error frame will be sent to the client.

The format is:

    {
        "type": "error",
        "content": <error content>
    }

The client may handle the error.

## Source Code Structure

### server.js

The server entrance.

### config.js

The global configuration. Because UDP protocol is stateless and hard to get client status(connected/disconnected), UDP is not supported and "udpPort" is currently not used.

### log.js

The console log utility. Compare to other third party log modules, it is simple and it can display the source code position where log generates.

### protocol.js

The wrapper of the protocol frames.

### exchange.js

The core part of the server which handles the pub/sub.

### tcp.js

TCP implementation.

### ws.js

WebSocket implementation.
