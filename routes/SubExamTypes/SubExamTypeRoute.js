const express = require("express"),
  router = express.Router(),
  SubExamTypeController = require("./SubExamTypeController");

router.get("/", SubExamTypeController.list);

router.post("/", SubExamTypeController.add);

router.get("/:id", SubExamTypeController.view);

router.patch("/:id", SubExamTypeController.update);

router.delete("/:id", SubExamTypeController.delete);

module.exports = router;
