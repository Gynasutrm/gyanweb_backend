const express = require("express"),
  router = express.Router(),
  AuthController = require("./AuthController");

router.post("/register", AuthController.register);

router.post("/login", AuthController.login);

router.get("/profile", AuthController.profile);

module.exports = router;
