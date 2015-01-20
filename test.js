'use strict';

var config = require('config.json')('./config/default.json'),
io = require('socket.io-client'),
/*
socket = io('localhost', {
      port: config.server.port
});
*/
socket = io(':3002');
socket.on('connect', function () { console.log("socket connected"); });
socket.emit('start', 'go');
console.log("done");
