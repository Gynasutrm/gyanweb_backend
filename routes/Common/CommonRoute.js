const express = require("express"),
  router = express.Router(),
  CommonController = require("./CommonController");

router.get("/getProbDifflist", CommonController.getProbDifflist);

router.get("/getProbTypelist", CommonController.getProbTypelist);

router.get("/my-courses", CommonController.myCourse);

router.get("/my-test-series/:course_id", CommonController.myTestSeries);

router.get("/my-tests/:test_series_id", CommonController.myTests);

router.get("/state-list", CommonController.stateList);

router.get("/city-list/:state_id", CommonController.cityList);

router.get("/user-type-list", CommonController.userTypeList);

router.get("/course-by-category/:category_id", CommonController.courseByCategoryList);

router.get("/pathshala-list", CommonController.pathshalaList);

router.post("/user-active-course", CommonController.userActiveCourse);
router.post("/user-active-test-series", CommonController.userActiveTestSeries);
router.post("/user-active-test", CommonController.userTests);
router.post("/user-test-response", CommonController.userTestResponse);

module.exports = router;
