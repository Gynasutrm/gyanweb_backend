const express = require("express"),
  router = express.Router(),
  TopicController = require("./TopicController");

const paggination=require('../../middlewares/paggination');

router.get("/",paggination.paggination('topics'), TopicController.list);

router.post("/", TopicController.add);

router.get("/:id", TopicController.view);

router.get("/topic-by-subject/:id", TopicController.topicBySubject);

router.patch("/:id", TopicController.update);

router.delete("/:id", TopicController.delete);

module.exports = router;
