#Express Image Server

##Intro
A simple Node.js image server built on express and ImageMagick suitable for hosting on ec2 or Heroku.  Photos are uploaded to an Amazon s3 bucket.  It is recommended that you also use a CDN and set this server as an origin point.

##Configuration

Configure the following environment variables

* **S3_UPLOAD_BUCKET** - your source upload bucket where original images jpg or pngs are stored

* **AWS_ACCESS_KEY_ID** – AWS access key.

* **AWS_SECRET_ACCESS_KEY** – AWS secret key. Access and secret key variables override credentials stored in credential and config files.

* **AWS_SESSION_TOKEN** – session token. A session token is only required if you are using temporary security credentials.

* **AWS_DEFAULT_REGION** – AWS region. This variable overrides the default region of the in-use profile, if set.

Example Usage
http://yourserver/photo/{filename}?size=300

Size is the max pixels to resize the original image to.  It resizes to the longest dimension.  

Filename is the original filename in the upload bucket on s3.

##Todos
1. add the upload service that creates a temporary s3 upload token to upload the photo and provide an upload example.
2. Make this a public npm package.