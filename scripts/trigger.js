var socket = require('socket.io-client')('http://localhost:3002');
socket.on('connect', function(){
  console.log('connection');
  socket.emit('start');
  setTimeout(function(){
    process.exit();
  }, 500);
});
