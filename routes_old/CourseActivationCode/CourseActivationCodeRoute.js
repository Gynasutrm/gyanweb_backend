const express = require("express"),
  router = express.Router(),
  CourseActivationCodeController = require("./CourseActivationCodeController");

router.post("/activate-code", CourseActivationCodeController.activateCode);

router.get(
  "/activate-code-list",
  CourseActivationCodeController.activateCodeList
);

router.get("/", CourseActivationCodeController.list);

router.post("/", CourseActivationCodeController.add);

router.get("/:id", CourseActivationCodeController.view);

router.patch("/:id", CourseActivationCodeController.update);

router.delete("/:id", CourseActivationCodeController.delete);

module.exports = router;
