var fs = require('fs'),
  FfmpegCommand = require('fluent-ffmpeg'),
  command = new FfmpegCommand(),
  frame = 0,
  config = require('config.json')('./config/default.json'),
  io = require('socket.io')(config.socketio.port),
  

io.on('connection', function(socket) {
  console.log('some client connect...');
  socket
    .on('frame', function(img) {
      if (recording) {
        var buf = new Buffer(img, 'base64');
        fs.writeFile('./img/image_' + frame + '.png', buf);
        this.emit('timer', {
          time: timer
        });
        frame++;
      }
      if (timer > config.maxTime) {
        makeMovie();
        this.emit('stop');
      }
    })
    .on('start', function() {
      recording = true;
    })
    .on('stop', function() {
      stop();
    });
});

var stop = function() {
  recording = false;
  frame = 0;
}

var makeMovie = function() {
  FfmpegCommand()
    .addInput('./img/image_%d.png')
    .inputFPS(60)
    .fps(60)
    .videoCodec('libx264')
    .output('outputfile.mp4').on('end', function() {
      console.log('Finished processing');
    })
    .run();
}