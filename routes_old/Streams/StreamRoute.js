const express = require("express"),
  router = express.Router(),
  StreamController = require("./StreamController");

router.get("/", StreamController.list);

router.post("/", StreamController.add);

router.get("/:id", StreamController.view);

router.patch("/:id", StreamController.update);

router.delete("/:id", StreamController.delete);

module.exports = router;
