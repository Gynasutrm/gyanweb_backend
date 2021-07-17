const express = require("express"),
  router = express.Router(),
  CourseController = require("./CourseController");

router.get("/", CourseController.list);

router.post("/", CourseController.add);

router.get("/:id", CourseController.view);

router.patch("/:id", CourseController.update);

router.delete("/:id", CourseController.delete);

module.exports = router;
