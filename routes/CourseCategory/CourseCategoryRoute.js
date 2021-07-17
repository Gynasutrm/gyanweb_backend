const express = require("express"),
  router = express.Router(),
  CourseCategoryController = require("./CourseCategoryController");

router.get("/", CourseCategoryController.list);

router.post("/", CourseCategoryController.add);

router.get("/:id", CourseCategoryController.view);

router.patch("/:id", CourseCategoryController.update);

router.delete("/:id", CourseCategoryController.delete);

module.exports = router;
