var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var gm = require('gm')
    .subClass({imageMagick: true}); // Enable ImageMagick integration.

var imageType = require('image-type');

var s3 = new AWS.S3();

var srcBucket = process.env.S3_UPLOAD_BUCKET;


/* GET photo from s3 */
router.get('/:key', function (req, res, next) {


    var srcKey = req.params.key;

    var targetSize = {
        dimension:null,
        size:100
    };

    var width = req.query.w;
    var height = req.query.h;
    var max_size = req.query.size || 200;

    if (width) {
        targetSize.dimension = 'w';
        targetSize.size = width;
    } else if (height) {
        targetSize.dimension = 'h';
        targetSize.size = height;
    } else {
        targetSize.dimension = null;
        targetSize.size = max_size;
    }

    // Download the image from S3
    s3.getObject({
        Bucket: srcBucket,
        Key: srcKey
    }, function (err, response) {
        if (err) {
            console.error('unable to download image ' + err);
            return res.status(404).send('unable to download image ' + err);
        }

        if (!response.Body)
            return res.status(404).send('no body response for image');

        var imgType = imageType(response.Body)

        if (!imgType || (imgType.mime != "image/jpeg" && imgType.mime != "image/png")) {
            console.log('skipping non-image ' + srcKey);
            return res.status(400).send('not an image type');
        }

        var original = gm(response.Body);

        if (req.query.pixelate)
        {
            pixelated_thumb(original, max_size, function(err, photo){
                res.setHeader('Content-Type', 'image/png');
                res.send(photo);
            });

        } else {
            original.size(function (err, size) {
                if (err) {
                    console.error(err);
                    return res.status(500).send(err);
                }

                resize_photo(size, targetSize, original, function (err, photo) {
                    res.setHeader('Content-Type', 'image/jpeg');
                    res.send(photo);
                });
            });
        }
    });

    //res.send('respond with a resource');
});

var pixelated_thumb = function(original, size, next){

    original
        .autoOrient()
        .thumbnail(size, size + '^')
        .gravity('Center')
        .extent(size,size)
        .scale('10%').scale('1000%')
        .toBuffer('png', function (err, buffer) {
            if (err) {
                next(err);
            }
            else {
                next(null, buffer);
            }
        });

}

//wrap up variables into an options object
var resize_photo = function (size, max_size, original, next) {
    
    // Infer the scaling factor to avoid stretching the image unnaturally.
    var scalingFactor;

    switch(max_size.dimension) {
        case 'w':
            scalingFactor = max_size.size / size.width;
            break;
        case 'h':
            scalingFactor =  max_size.size / size.height;
            break;
        default:
            scalingFactor = Math.min(max_size.size / size.width, max_size.size / size.height);
    }

    var width = scalingFactor * size.width;
    var height = scalingFactor * size.height;

    // Transform the image buffer in memory.
    original.resize(width, height).autoOrient()
        .toBuffer('jpg', function (err, buffer) {
            if (err) {
                next(err);
            }
            else {
                next(null, buffer);
            }
        });


};



module.exports = router;
