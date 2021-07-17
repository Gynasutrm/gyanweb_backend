const express = require("express"),
  router = express.Router(),
  ProblemActualTypeController = require("./ProblemActualTypeController");

router.get("/", ProblemActualTypeController.list);

router.post("/", ProblemActualTypeController.add);

router.get("/:id", ProblemActualTypeController.view);

router.patch("/:id", ProblemActualTypeController.update);

router.delete("/:id", ProblemActualTypeController.delete);

module.exports = router;
