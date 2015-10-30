'use strict';
//
var fs = require('fs'),
  ffmpegCommand = require('fluent-ffmpeg'),
  storage = require('node-persist'),
  frame = 0,
  config = require('config.json')('./config/default.json'),
  Stopwatch = require('timer-stopwatch'),
  timer = new Stopwatch(config.timer.duration, {
    almostDoneMS: 2000,
  }),
  recording = false,
  io,
  shortId = require('shortid'),
  totalDuration = config.timer.duration,
  threadNumber = config.ffmpeg.threadNumber || 0,
  extension = config.ffmpeg.extension || 'mp4',
  separator = config.ffmpeg.separator || '_',
  fileName = config.ffmpeg.fileName || 'rec',
  savePath = config.ffmpeg.savePath || './',
  destinationPath = config.ffmpeg.destinationPath || './',
  duration = config.ffmpeg.duration || '00:15',
  fps = config.ffmpeg.fps || '25',
  counter = 0,
  platform = require('os').platform(),
  inputFormat = {
    'linux': 'x11grab',
    'win32': 'avfoundation',
    'win64': 'avfoundation',
    'darwin': 'avfoundation'
  },
  inputOption = {
    'linux': ['-s 1920x1080'],
    'win32': [],
    'win64': [],
    'darwin': [
      '-deinterlace',
    ]
  },
  outputOptions = {
    'linux': ['-preset ultrafast',
      '-threads ' + threadNumber,
      '-strict experimental'
    ],
    'win32': [],
    'win64': [],
    'darwin': ['-preset ultrafast',
      '-threads ' + threadNumber,
      '-strict experimental'
    ]
  },
  fileNameInput = {
    'linux': ':0',
    'win32': '',
    'win64': '',
    'darwin': '0'
  },
  os = require('os'),
  pathHelper = require('path'),
  movieRec = {},
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
    io.emit('stop', {
      msg: 'Finished !'
    });
  });

  // Fires when the timer is almost complete - default is 10 seconds remaining. Change with 'almostDoneMS' option
  timer.on('almostdone', function() {
    io.emit('message', {
      msg: 'Almost finished !'
    });
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
        io.emit('message', {
          msg: 'Video cancel...'
        });
        movieRec.kill();
        stop();
      });
  });
}

var initSocketioClient = function (){
  io = require('socket.io-client')('http://' + config.client.address + ':' + config.client.port);
  console.log('connected to socket.io server on:', config.client.address + ':' + config.client.port);
  io
    .on('frame', function(img) {
      if (recording) {
        saveImage(img);
      }
    })
    .on('start', function() {
      recording = true;
      timer.start();
      makeMovie();
    })
    .on('stop', function() {
      stop();
      console.log('stopped recording');
    })
    .on('photoTaken', function(){
      io.emit('photoTaken');
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

//ffmpeg -f x11grab -r 30 -s 1920x1080 -i :0.0+0,0 -vcodec libx264 -preset veryfast -crf 18 -acodec libmp3lame -ar 44100 -q:a 1 -pix_fmt yuv420p test2.mkv

//"/Users/gabrielstuff/Library/Application Support/Adapter/ffmpeg" '-i' '/Volumes/Macintosh HD/Users/gabrielstuff/Sources/node/socketio-record/bob/record_9.mp4' '-vcodec' 'mpeg4' '-b:v' '855k' '-qscale:v' '10' '-acodec' 'aac' '-ac' '2' '-async' '1' '-strict' 'experimental' '/Volumes/Macintosh HD/Users/gabrielstuff/Sources/node/socketio-record/bob/record_9(4).mp4' '-threads' '0'
var makeMovie = function() {


  console.log(inputFormat[platform]);
  var finalname = fileName + separator + counter + '.' + extension;
  var fullSavePath = pathHelper.join(savePath, finalname);
  var newPath = pathHelper.join(destinationPath, finalname);

  console.log(fullSavePath);
  console.log(newPath);
  movieRec = ffmpegCommand(fileNameInput[platform])
    .inputFormat(inputFormat[platform])
    .format(extension)
    .fps(fps)
    .videoCodec('libx264') //should try mpeg4
    .duration(duration);
  if (inputOption[platform].length > 0) {
    movieRec.inputOption(inputOption[platform])
  }
  movieRec.outputOptions(outputOptions[platform])
    //.addInput('./soundtrack.mp3')
    .save(fullSavePath)
    .on('end', function(data) {
      console.log('Finished processing: ', data);
      counter++;
      storage.setItem('counter', counter);
      fs.rename(fullSavePath, newPath, function(err) {
        if (err) {
          console.log('error moving: ' + err);
        }
        io.emit('success', {
          msg: 'Video processing ...'
        });
      });
    })
    .on('error', function(err) {
      console.error(err);
      fs.unlink(pathHelper.join(savePath, finalname), function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('successfully deleted ' + pathHelper.join(savePath, finalname));
        }
      });

      io.emit('error', {
        msg: 'Video has not been saved'
      });
    });
}

// Output
console.log("Listening on: http://localhost:" + config.server.port);
initStatiqueServer();
if(config.isServer){
  initSocketioServer();
} else {
  initSocketioClient();
}
initTimerHandler();
app.listen(config.server.port);
