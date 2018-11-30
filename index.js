#!/usr/bin/env node

var fs = require('fs')
var AWS = require('aws-sdk')
var path = require('path')

var prefix = 'Environment variable not found:'
var accessKeyId = process.env.AWS_KEY ? process.env.AWS_KEY : console.log(`${prefix} AWS_KEY`)
var secretAccessKey = process.env.AWS_SECRET ? process.env.AWS_SECRET : console.log(`${prefix} AWS_SECRET`)
var bucketName = process.env.AWS_BUCKET ? process.env.AWS_BUCKET : console.log(`${prefix} AWS_BUCKET`)

if (!(accessKeyId && secretAccessKey && bucketName)) process.exit(1)

var file = process.argv[2] || process.cwd()
var filepath = file[0] === '/' ? file : path.join(process.cwd(), file)
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  }
})

var uploadCallback = (err, data) => {
        if (!err) {
          console.log(data)
        }
        else {
          console.log(err, data)
        }
      }

var uploadFile = (keyName, readStream, contentType) => {
  s3.upload({
    Bucket: bucketName,
    Key: keyName,
    ACL: "public-read",
    Body: readStream,
    ContentType: contentType
  }, uploadCallback)
}

fs.lstat(filepath, (err, stat) => {
  if (!err && stat.isFile()) {
      var keyName = filepath.split('/').slice(-1)[0]
      var readStream = fs.createReadStream(filepath)
      var contentType = `image/${keyName.split('.').slice(-1)[0]}`
      uploadFile(keyName, readStream, contentType)
    }
    else if (stat.isDirectory()) {
      fs.readdir(filepath, (err, files) => {
        files.forEach(file => {
          var fileToUpload = path.join(filepath, file)
          fs.stat(fileToUpload, (err, stat) => {
            if (!err && stat.isFile()) {
              var readStream = fs.createReadStream(fileToUpload)
              var fileExtension = file.split('.').slice(-1)[0]
              var contentType = `image/${fileExtension}`

              if (fileExtension === 'png'
                || fileExtension === 'jpg'
                || fileExtension === 'gif'
                || fileExtension === 'jpeg') {
                uploadFile(file, readStream, contentType)
              }
            }
          })
        })
      })
    }
  else {
    console.log(filepath + ' does not exits')
  }
})
