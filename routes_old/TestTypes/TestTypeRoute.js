const express = require("express"),
  router = express.Router(),
  TestTypeController = require("./TestTypeController");

router.get("/", TestTypeController.list);

router.post("/", TestTypeController.add);

router.get("/:id", TestTypeController.view);

router.patch("/:id", TestTypeController.update);

router.delete("/:id", TestTypeController.delete);

module.exports = router;
