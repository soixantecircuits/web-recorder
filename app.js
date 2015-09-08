'use strict';

var fs = require('fs'),
  FfmpegCommand = require('fluent-ffmpeg'),
  command = new FfmpegCommand(),
  config = require('./config/default.json'),
  Stopwatch = require('timer-stopwatch'),
  shortId = require('shortid'),
  express = require('express'),
  mdns = require('mdns'),
  timer = new Stopwatch(config.timer.duration),
  recording = false,
  frame = 0,
  io,
  totalDuration = config.timer.duration,
  app = {},
  options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['htm', 'html', 'css', 'js', 'png', 'jpg'],
    index: './html/index.html',
    maxAge: '1d',
    redirect: false,
    setHeaders: function(res, path, stat) {
      res.set('x-timestamp', Date.now())
    }
  };


shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()');

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
  app = express();
  app.use(express.static('public', options));
  app.get('/config.js', function(req, res, next) {
    next();
  }, function(req, res, next) {
      res.set('Content-Type', 'text/javascript');
      res.send('var config='+JSON.stringify(config));
    });

}

var initSocketioServer = function() {
  var server = require('http').Server(app);
  io = require('socket.io')(server);
  io.on('connection', function(socket) {
    console.log('some client connect...');
    socket
      .on('frame', function(img) {
        if (recording) {
          saveImage(img);
        }
      })
      .on('start', function() {
        var short_id = shortId.generate();
        console.log('shoot ' + short_id);
        if (!config.remote) {
          recording = true;
          timer.start();
        } else {
          io.emit('shoot', short_id);
        }
      })
      .on('stop', function() {
        stop();
      })
      .on('photoTaken', function(){
        io.emit('photoTaken');
      });
  });
  server.listen(config.server.port);
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
        msg: 'Video saved'
      });
    })
    .on('error', function(err) {
      console.error(err);
      io.emit('error', {
        msg: 'Video has not been saved'
      });
    })
    .run();
}

// Output
console.log("Listening on: http://localhost:" + config.server.port);
initStatiqueServer();
initSocketioServer();
initTimerHandler();
