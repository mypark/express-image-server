var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var gm = require('gm')
    .subClass({imageMagick: true}); // Enable ImageMagick integration.

var imageType = require('image-type');

var s3 = new AWS.S3();

var srcBucket = process.env.S3_UPLOAD_BUCKET;


/* GET users listing. */
router.get('/:key', function (req, res, next) {


    var srcKey = req.params.key;
    var max_size = req.query.size || 100;

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

        original.size(function (err, size) {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }

            resize_photo(size, max_size, original, function (err, photo) {
                res.setHeader('Content-Type', 'image/jpeg');
                res.send(photo);
            });
        });
    });

    //res.send('respond with a resource');
});

//wrap up variables into an options object
var resize_photo = function (size, max_size, original, next) {
    
    // Infer the scaling factor to avoid stretching the image unnaturally.
    var scalingFactor = Math.min(max_size / size.width, max_size / size.height);

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
