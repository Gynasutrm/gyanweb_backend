const express = require("express"),
  router = express.Router(),
  SubjectController = require("./SubjectController");

router.get("/", SubjectController.list);

router.post("/", SubjectController.add);

router.get("/:id", SubjectController.view);

router.patch("/:id", SubjectController.update);

router.delete("/:id", SubjectController.delete);

module.exports = router;
