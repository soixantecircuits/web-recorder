webgl-recorder
==============

A simple node app which receive data and convert them to mp4

Install
==============

Do not forget to install ffmpeg

On OsX
`brew install ffmpeg`

On Linux
`sudo apt-get install ffmpeg`

On Windows
http://ffmpeg.zeranoe.com/builds/
Copy into the PATH variable

And then :

`npm install`

On linux

Use `dpyinfo` or `xdpyinfo` to get information about screen name and what you want to record.

#Hints and links : 

Learn to compile ffmpeg 
http://wiki.razuna.com/display/ecp/FFmpeg+Installation+for+Ubuntu#FFmpegInstallationforUbuntu-Installx264

Dont use last version, not stable.

http://wiki.oz9aec.net/index.php/High_quality_screen_capture_with_Ffmpeg (watch out lossless_ultrafast does not exist anymore use x264 --help to know more)

