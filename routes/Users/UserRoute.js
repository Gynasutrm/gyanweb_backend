const express = require("express"),
router = express.Router(),
UserController = require("./UserController"),
multer = require("multer"),
fileExtension = require("file-extension");
aws = require('aws-sdk');
multerS3 = require('multer-s3');
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

//
router.post(
  "/registers",
  upload.single("profile_image"),
  async (req, res, next) => {
    console.log("-sss", req.file);
    try {
      if (!req.file) {
        return res.status(500).json({
          error: {
            message: "The image upload failed because something went wrong.",
          },
        });
      } else {
        //const filePath = `${process.env.URL}uploads/questions/${req.file.filename}`;
        //return res.status(200).json({ uploaded: true, url: filePath });
        UserController.register;
      }
    } catch (error) {
      console.log("-error", error);
      return res.status(200).json({
        statusCode: 203,
        error: {
          message: "The image upload failed because something went wrong.",
        },
      });
    }
  }
);

router.post("/register", UserController.register);

router.get("/profile/:id", UserController.profile);

router.post(
  "/update-profile/:id",
  upload.single("profile_image"),
  UserController.profileUpdate
);

router.post("/list", UserController.list);
router.post("/student-in-school", UserController.studentInSchool);
router.get("/school-list", UserController.schoolList);
router.post("/delete-user", UserController.deleteUsr);
router.post("/approve-user", UserController.approveUsr);

module.exports = router;
