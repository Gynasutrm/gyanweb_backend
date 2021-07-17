const express = require("express"),
  router = express.Router(),
  ExamController = require("./ExamController");

router.get("/", ExamController.list);

router.post("/", ExamController.add);

router.get("/:id", ExamController.view);

router.patch("/:id", ExamController.update);

router.delete("/:id", ExamController.delete);

module.exports = router;
