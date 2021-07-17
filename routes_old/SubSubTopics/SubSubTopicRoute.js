const express = require("express"),
  router = express.Router(),
  SubSubTopicController = require("./SubSubTopicController");

router.get("/", SubSubTopicController.list);

router.post("/", SubSubTopicController.add);

router.get("/:id", SubSubTopicController.view);

router.get(
  "/topic-wise-sub-topic/:topic_id",
  SubSubTopicController.topicWiseSubTopic
);

router.get(
  "/subtopic-wise-sub-subtopic/:subtopic_id",
  SubSubTopicController.subtopicWisesubsubTopic
);
router.patch("/:id", SubSubTopicController.update);

router.delete("/:id", SubSubTopicController.delete);

module.exports = router;
