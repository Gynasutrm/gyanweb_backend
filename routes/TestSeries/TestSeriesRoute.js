const express = require("express"),
  router = express.Router(),
  TestSeriesController = require("./TestSeriesController");

router.get("/", TestSeriesController.list);

router.post("/", TestSeriesController.add);

router.get("/:id", TestSeriesController.view);

router.patch("/:id", TestSeriesController.update);

router.delete("/:id", TestSeriesController.delete);

module.exports = router;
