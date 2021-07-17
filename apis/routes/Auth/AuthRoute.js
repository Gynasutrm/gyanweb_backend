const express = require("express"),
router = express.Router(),
AuthController = require("./AuthController");

const blacklistToken = require('../../../middlewares/blacklistToken');
const authenticateToken = require('../../../middlewares/authenticateToken');

router.post("/register", AuthController.register);

router.post("/login", AuthController.login);

router.post("/otp-verify",AuthController.otpVerfy);

router.post("/otp-resend",AuthController.otpResend);

router.post("/change-password", authenticateToken,AuthController.changePassword);

router.post("/forgot-password-otp", AuthController.forgotPasswordOtp);
router.post("/otp-verify-forgot-password", AuthController.otpVerfyForgotPassword);
router.post("/change-forgot-password", AuthController.changeForgotPassword);

router.get("/logout",blacklistToken, AuthController.logout);

router.get("/dashboard",authenticateToken, AuthController.dashboard);

module.exports = router;
