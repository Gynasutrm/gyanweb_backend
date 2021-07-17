const express = require("express"),
  router = express.Router(),
  CommonController = require("./CommonController");

const authenticateToken = require('../../../middlewares/authenticateToken');
const chktimeOver = require('../../../middlewares/chktimeOverToken'); // for checking alredy submit and time over

// router.get("/getProbDifflist", CommonController.getProbDifflist);

// router.get("/getProbTypelist", CommonController.getProbTypelist);

router.get("/my-courses",authenticateToken, CommonController.myCourse);
router.get("/my-test-series",authenticateToken, CommonController.myTestSeries);
router.post("/my-tests", authenticateToken,CommonController.myTests);
router.get("/pre-start-test/:test_id",authenticateToken, CommonController.preStartTest);
router.get("/start-test",[authenticateToken,chktimeOver], CommonController.startTest);
router.get("/question-index/:index_id",[authenticateToken,chktimeOver], CommonController.questionIndex);
router.post("/question-save",[authenticateToken,chktimeOver], CommonController.questionSave);
router.post("/question-save-next",[authenticateToken,chktimeOver], CommonController.questionSaveNext);
router.post("/mark-for-review",[authenticateToken,chktimeOver], CommonController.markForReview);
router.get("/submit-test",authenticateToken, CommonController.submitTest);
router.get("/pause-test",[authenticateToken,chktimeOver],CommonController.pauseTest);
router.get("/resume-test/:test_id",authenticateToken,CommonController.resumeTest);
router.post("/response-clear",[authenticateToken,chktimeOver],CommonController.responseClear);

router.get("/state-list", CommonController.stateList);
router.get("/city-list/:state_id", CommonController.cityList);
router.get("/user-type-list", CommonController.userTypeList);
router.get("/course-by-category/:category_id", CommonController.courseByCategoryList);
router.get("/pathshala-list", CommonController.pathshalaList);
router.get("/class-list", CommonController.classList);
router.get("/stream-list", CommonController.streamList);

module.exports = router;
