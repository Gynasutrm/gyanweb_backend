const express = require("express"),
router = express.Router(),
QuestionController = require("./QuestionController"),
multer = require("multer"),
fileExtension = require("file-extension"),
aws = require('aws-sdk'),
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
    bucket: 'gyansutrmbucket/questions',
    key: function (req, file, cb) {
      cb(
        null, 
        file.fieldname + "-" + Date.now() + "." + fileExtension(file.originalname)
        )
    }

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

router.post("/upload", upload.single("upload"), async (req, res, next) => {
  console.log("-sss", req.file);
  try {
    if (!req.file) {
      return res.status(500).json({
        error: {
          message: "The image upload failed because something went wrong.",
        },
      });
    } else {
      const filePath = req.file.location;
      return res.status(200).json({ uploaded: true, url: filePath });
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
});

router.get("/", QuestionController.list);
router.post("/", QuestionController.add);
router.get("/:id", QuestionController.view);
router.patch("/:id", QuestionController.update);
router.delete("/:id", QuestionController.delete);
router.post("/filter-question", QuestionController.filterQuestion);
module.exports = router;
