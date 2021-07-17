const express = require("express"),
  router = express.Router(),
  SubTopicController = require("./SubTopicController");

router.get("/", SubTopicController.list);

router.post("/", SubTopicController.add);

router.get("/:id", SubTopicController.view);

router.get(
  "/subject-wise-topic/:subject_id",
  SubTopicController.subjectWiseTopic
);

router.patch("/:id", SubTopicController.update);

router.delete("/:id", SubTopicController.delete);

module.exports = router;
