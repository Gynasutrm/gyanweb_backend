const express = require("express"),
  router = express.Router(),
  ClassesController = require("./ClassesController");

router.get("/", ClassesController.list);

router.post("/", ClassesController.add);

router.get("/:id", ClassesController.view);

router.patch("/:id", ClassesController.update);

router.delete("/:id", ClassesController.delete);

module.exports = router;
