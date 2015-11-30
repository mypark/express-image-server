#Express Image Server

##Intro
A simple Node.js image server that resizes images fetch from a remote url, built on express and ImageMagick suitable for hosting on ec2 or Heroku.
It is recommended that you also use a CDN and set this server as an origin point.

##Options
These parameters to be passed in the querystring

size: Size is the max pixels to resize the original image to, and the dimension varies by mode.
mode: "crop" and "pad" create square thumbnails, while "width" and "height" will set that dimension as the longest.  Defaults to no mode which will resize to longest dimension and maintain aspect ratio.
pixelate: defaults to false, pixelates the image.

Example Usage
http://yourserver/photos/resize/?url={photoUrl}&size=300&mode=crop&pixelate=true



##Todos
1. Make this a public npm package.
2. Make startup code simpler and remove auto-generated express/www code