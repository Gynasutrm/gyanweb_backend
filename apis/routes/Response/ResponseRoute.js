const express = require("express"),
  router = express.Router(),
  ResponseController = require("./ResponseController");

const authenticateToken = require('../../../middlewares/authenticateToken');

router.post("/test-response",authenticateToken, ResponseController.testResponse);

module.exports = router;
