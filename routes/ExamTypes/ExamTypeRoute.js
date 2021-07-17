const express = require("express"),
  router = express.Router(),
  ExamTypeController = require("./ExamTypeController");

router.get("/", ExamTypeController.list);

router.post("/", ExamTypeController.add);

router.get("/get-sub-exams/:id", ExamTypeController.getSubExams);

router.get("/:id", ExamTypeController.view);

router.patch("/:id", ExamTypeController.update);

router.delete("/:id", ExamTypeController.delete);

module.exports = router;
