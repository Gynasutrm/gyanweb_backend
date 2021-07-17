const express = require("express"),
router = express.Router(),
UserController = require("./UserController"),
multer = require("multer"),
fileExtension = require("file-extension");
aws = require('aws-sdk');
multerS3 = require('multer-s3');

const authenticateToken = require('../../../middlewares/authenticateToken');

aws.config.update({
  secretAccessKey: process.env.aws_secretAccessKey,
  accessKeyId: process.env.aws_accessKeyId,
  region: process.env.aws_region,
});
const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    acl: 'public-read',
    s3,
    bucket: 'gyansutrmbucket/avatar',
    key: function (req, file, cb) {
      cb(
        null, 
        file.fieldname + "-" + Date.now() + "." + fileExtension(file.originalname)
        )
    },

  }),
  limits: {
    // Setting Image Size Limit to 2MBs
    fileSize: 2000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg)$/)) {
      //Error
      cb(new Error("Please upload png and jpg only!"));
    }
    //Success
    cb(undefined, true);
  },
});

router.get("/profile", authenticateToken,UserController.profile);

router.post(
  "/update-profile",authenticateToken,
  upload.single("profile_image"),
  UserController.profileUpdate
);

module.exports = router;
