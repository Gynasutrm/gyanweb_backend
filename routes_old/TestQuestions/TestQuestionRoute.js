const express = require("express"),
  router = express.Router(),
  TestQuestionController = require("./TestQuestionController");

// router.get("/", TestQuestionController.list);

router.get("/save/:test_id", TestQuestionController.save);

router.get("/:test_id", TestQuestionController.getTestQuestion);

// router.patch("/:id", TestQuestionController.update);

// router.delete("/:id", TestQuestionController.delete);

router.delete("/delete-qsn/:test_id/:id", TestQuestionController.deleteQsn);

router.get(
  "/check-question-in-test-series/:question_id",
  TestQuestionController.checkQuestionINTestSeries
);

router.post("/update-index-marks", TestQuestionController.updateIndexAndMarks);

router.post("/add-questions", TestQuestionController.addQuestions);

router.post("/filter-question", TestQuestionController.filterQuestion);

module.exports = router;
