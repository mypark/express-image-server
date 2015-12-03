var express = require('express');
var router = express.Router();
var request = require('request');
var gm = require('gm')
    .subClass({imageMagick: true}); // Enable ImageMagick integration.
var imageType = require('image-type');
var uuid = require('node-uuid');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

router.get('/resize', function (req, res, next) {


    //var srcKey = req.params.key;
    var imageUrl = req.query.src;
    var mode = req.query.mode;
    var max_size = req.query.size ? parseInt(req.query.size) : 200;
    var pixelate = req.query.pixelate || false;

    var options = {
        mode: mode,
        size: max_size,
        pixelate: pixelate
    };

    request({method:'GET', url:imageUrl, encoding:null}, function(error, response, body) {

        if (error) {
            console.error('unable to download image ' + err);
            return res.status(404).send('unable to download image ' + err);
        }

        if (!body)
            return res.status(404).send('no body response for image');

        var imgType = imageType(body);

        if (!imgType || (imgType.mime != "image/jpeg" && imgType.mime != "image/png")) {
            console.log('skipping non-image ' + imageUrl);
            return res.status(400).send('not an image type');
        }
        var original = gm(body);
        original.size(function (err, size) {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }
            resize_photo(size, options, original, function (err, photo) {
                res.setHeader('Content-Type', 'image/jpeg');
                res.send(photo);
            });
        });

    });

});

var resize_photo = function (size, options, original, next) {

    // Infer the scaling factor to avoid stretching the image unnaturally.
    var scalingFactor;

    switch(options.mode) {
        case 'width':
            scalingFactor = options.size / size.width;
            break;
        case 'height':
            scalingFactor =  options.size / size.height;
            break;
        case 'crop':
            scalingFactor = Math.max(options.size / size.width, options.size / size.height); //for cropping to square
            break;
        default:
            scalingFactor = Math.min(options.size / size.width, options.size / size.height); //for either size
    }

    var width = scalingFactor * size.width;
    var height = scalingFactor * size.height;

    var original = original
        .resize(width, height)
        .autoOrient();

    if (options.mode === 'pad' || options.mode === 'crop') {
        original.gravity('Center').extent(options.size, options.size);
    }

    if (options.pixelate) {
        original.scale('10%').scale('1000%')
    }

    original.toBuffer('jpg', function (err, buffer) {
        if (err) {
            next(err);
        }
        else {
            next(null, buffer);
        }
    });


};

// can fetch from s3 instead of http get
//function getFromS3(filename, callback) {
//    // Download the image from S3
//    s3.getObject({
//        Bucket: srcBucket,
//        Key: filename
//    }, function (err, response) {
//        callback(err, response.Body);
//    });
//}

const containerName = process.env.uploadBucket || 'uploads';

function getUploadUrl(callback) {
    var fileName =  uuid.v4();
    //assuming amazon s3
    var params = {Bucket: containerName, Key: fileName };

    s3.getSignedUrl('putObject', params, function(err, link){
        callback(err, link, fileName);
    });
}

// if we want to pupload to azure instead
//var azure = require('azure-storage');
//var blobService = azure.createBlobService();
//
//function getAzureLink(fileName, callback) {
//    var startDate = new Date();
//    var expiryDate = new Date(startDate);
//    expiryDate.setMinutes(startDate.getMinutes() + 10);
//
//    var sharedAccessPolicy = {
//        AccessPolicy: {
//            Permissions: azure.BlobUtilities.SharedAccessPermissions.WRITE,
//            Start: startDate,
//            Expiry: expiryDate
//        },
//    };
//
//    var token = blobSvc.generateSharedAccessSignature(containerName, fileName, sharedAccessPolicy);
//    var url = blobService.getUrl(containerName, fileName, token);
//       callback(null, url);
//}

router.post('/upload', function (req, res, next) {
    getUploadUrl(function (err, uploadLink, fileName) {
        if (!err) {
            res.send(201,{url: uploadLink, fileName: fileName});
        }
        else {
            res.send(500, err);
        }

    });
});

module.exports = router;
