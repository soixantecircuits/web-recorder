webgl-recorder
==============

A simple node app which receive data and convert them to mp4

Install
==============

Do not forget to install ffmpeg

On OsX
`brew install ffmpeg`

On Linux
`sudo add-apt-repository ppa:jon-severinsson/ffmpeg && sudo apt-get update -qq`
`sudo apt-get install ffmpeg`

if you're running Ubuntu 14.10, use:
```
$ sudo add-apt-repository ppa:kirillshkrogalev/ffmpeg-next
$ sudo apt-get update
$ sudo apt-get install ffmpeg x264
```

On Windows
http://ffmpeg.zeranoe.com/builds/
Copy into the PATH variable

And then :

`npm install`

### CLI trigger

`node scripts/trigger.js`

Run
==============

`npm start`