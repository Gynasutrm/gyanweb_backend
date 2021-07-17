const express = require("express"),
  router = express.Router(),
  TestController = require("./TestController");

router.get("/", TestController.list);

router.post("/", TestController.add);

router.get("/:id", TestController.view);

router.patch("/:id", TestController.update);

router.delete("/:id", TestController.delete);

module.exports = router;
