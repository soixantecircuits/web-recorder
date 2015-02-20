'use strict';

var fs = require('fs'),
  FfmpegCommand = require('fluent-ffmpeg'),
  command = new FfmpegCommand(),
  frame = 0,
  config = require('config.json')('./config/default.json'),
  Stopwatch = require('timer-stopwatch'),
  timer = new Stopwatch(config.timer.duration),
  recording = false,
  io,
  totalDuration = config.timer.duration,
  app = {},
  mdns = require('mdns');

var ad = mdns.createAdvertisement(mdns.tcp(config.serviceName), config.server.port);
ad.start();

var initTimerHandler = function() {
  timer.on('time', function(time) {
    console.log(time.ms); // number of milliseconds past (or remaining);
    io.emit('time', {
      time: time.ms,
      duration: totalDuration
    });
  });

  // Fires when the timer is done
  timer.on('done', function() {
    console.log('Timer is complete');
    makeMovie();
    stop();
    io.emit('stop', 'timer done');
  });

  // Fires when the timer is almost complete - default is 10 seconds remaining. Change with 'almostDoneMS' option
  timer.on('almostdone', function() {
    console.log('Timer is almost complete');
  });
}

var initStatiqueServer = function() {
  var Statique = require("statique");

  // Create *Le Statique* server
  var server = new Statique({
    root: __dirname + "/public",
    cache: 36000
  }).setRoutes({
    "/": "/html/index.html"
  });

  // Create server
  app = require('http').createServer(server.serve);
}

var initSocketioServer = function() {
  io = require('socket.io')(app);
  io.on('connection', function(socket) {
    console.log('some client connect...');
    socket
      .on('frame', function(img) {
        if (recording) {
          saveImage(img);
        }
      })
      .on('start', function() {
        if(!config.remote){
          recording = true;
          timer.start();
        } else {
          io.emit('shoot');
        }
      })
      .on('stop', function() {
        stop();
      });
  });
}

var saveImage = function(img) {
  console.log("Saving...")
  var buf = new Buffer(img, 'base64');
  fs.writeFile('./img/image_' + frame + '.png', buf);
  frame++;
}

var stop = function() {
  recording = false;
  frame = 0;
  timer.stop();
  timer.reset();
}

var makeMovie = function() {
  FfmpegCommand()
    .addInput('./img/image_%d.png')
    .inputFPS(60)
    .fps(60)
    .videoCodec('libx264')
    .output('outputfile.mp4')
    .on('end', function(data) {
      console.log('Finished processing: ', data);
      io.emit('success', {
        msg:'Video saved'
      });
    })
    .on('error', function(err) {
      console.error(err);
      io.emit('error', {
        msg:'Video has not been saved'
      });
    })
    .run();
}

// Output
console.log("Listening on: http://localhost:" + config.server.port);
initStatiqueServer();
initSocketioServer();
initTimerHandler();
app.listen(config.server.port);