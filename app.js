var io = require('socket.io')(8000),
  fs = require('fs'),
  sys = require('sys'),
  FfmpegCommand = require('fluent-ffmpeg'),
  command = new FfmpegCommand(),
  nodemailer = require('nodemailer'),
  smtpTransport = require('nodemailer-smtp-transport'),
  frame = 0,
  config = require('config.json')('./config/default.json'),
  transporter = nodemailer.createTransport(smtpTransport(config.Mailer)),
  shortId = require('shortid'),
  qr = require('qr-image');

io.on('connection', function(socket) {
  
  console.log('some client connect...');

  socket.on('frame', function(img) {
    //console.log(img);
    var buf = new Buffer(img, 'base64');
    fs.writeFile('./img/image_' + frame + '.png', buf);
    frame++;
    if (frame > 1000) {
      FfmpegCommand()
        .addInput('./img/image_%d.png')
        .inputFPS(60)
        .fps(60)
        .videoCodec('libx264')
        .output('outputfile.mp4').on('end', function() {
          var shortner = shortId.generate()
          , shortURI = 'https://headoo.com/qr/'+shortner
          , qr_png = qr.image(shortURI, { type: 'png' });
        qr_png.pipe(require('fs').createWriteStream('./qrCode/' + shortner + '.png'));
          console.log('The short url is : '+shortURI);
          console.log('Finished processing');
          transporter.sendMail({
            from: 'soixantecircuits@headoo.net',
            to: 'gabriel@soixantecircuits.fr',
            subject: shortner,
            text: 'hello world!\nuid: '+ shortner,
            attachments: [{ // stream as an attachment
              filename: 'video.mp4',
              content: fs.createReadStream('outputfile.mp4')
            }]
          }, function(error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Message sent: ' + info.response);
            }
          });
        })
        .run();
      frame = 0;
    }
  });
});