'use strict';

var fs = require('fs'),
  ffmpegCommand = require('fluent-ffmpeg'),
  storage = require('node-persist'),
  frame = 0,
  config = require('config.json')('./config/default.json'),
  Stopwatch = require('timer-stopwatch'),
  timer = new Stopwatch(config.timer.duration),
  recording = false,
  io,
  totalDuration = config.timer.duration,
  threadNumber = config.ffmpeg.threadNumber || 0,
  extension = config.ffmpeg.extension || 'mp4',
  separator = config.ffmpeg.separator || '_',
  fileName = config.ffmpeg.fileName || 'rec',
  path = config.ffmpeg.savePath || './',
  duration = config.ffmpeg.duration || '00:15',
  fps = config.ffmpeg.fps || '25',
  counter = 0,
  platform = require('os').platform(),
  inputFormat = {
    'linux':'x11grab',
    'win32':'avfoundation',
    'win64':'avfoundation',
    'darwin':'avfoundation'
  },
  inputOption = {
    'linux':['-s 1920x1080'],
    'win32':[],
    'win64':[],
    'darwin':[]
  },
  fileNameInput = {
    'linux':':0',
    'win32':'',
    'win64':'',
    'darwin':'0'
  },
  app = {};

//TODO 
//Add path normalization


storage.initSync();
counter = (storage.getItem('counter')) ? storage.getItem('counter') : 0;

var initTimerHandler = function() {
  timer.on('time', function(time) {
    io.emit('time', {
      time: time.ms,
      duration: totalDuration
    });
  });

  // Fires when the timer is done
  timer.on('done', function() {
    console.log('Timer is complete');
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
      .on('start', function() {
        recording = true;
        timer.start();
        makeMovie();
      })
      .on('stop', function() {
        stop();
      });
  });
}

var stop = function() {
  recording = false;
  frame = 0;
  timer.stop();
  timer.reset();
}

//ffmpeg -y -f x11grab -r 25 -s 1920x1080 -i :0.0 -vcodec libx264 -preset ultrafast -threads 4 tint.mkv
//fmpeg -y -f avfoundation -pix_fmt nv12 -r 25 -video_device_index 0 -i "" -vcodec libx264 -preset ultrafast -threads 4 tint.mkv
var makeMovie = function() {
   
    
    console.log(inputFormat[platform]);

    var movieRec = ffmpegCommand(fileNameInput[platform]) 
    .inputFormat(inputFormat[platform])
    .format(extension)
    .fps(fps)
    .videoCodec('libx264')
    .duration(duration);
    if(inputOption[platform].length > 0){
      movieRec.inputOption(inputOption[platform])
    }
    movieRec.outputOptions([
      '-preset ultrafast',
      '-threads '+threadNumber
    ])
    //.addInput('./soundtrack.mp3')
    .save(path+fileName+separator+counter+'.'+extension)
    .on('end', function(data) {
      console.log('Finished processing: ', data);
      counter++;
      storage.setItem('counter', counter);
      io.emit('success', {
        msg:'Video saved'
      });
    })
    .on('error', function(err) {
      console.error(err);
      io.emit('error', {
        msg:'Video has not been saved'
      });
    });
}

// Output
console.log("Listening on: http://localhost:" + config.server.port);
initStatiqueServer();
initSocketioServer();
initTimerHandler();
app.listen(config.server.port);