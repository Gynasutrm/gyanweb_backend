const config = require("../../config/connection");

class CommonController {
  async getProbDifflist(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM problem_defficulties ORDER BY problem_difficulty_name`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      return res.status(200).json({
        statusCode: 200,
        message: "Data list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async getProbTypelist(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM problem_type_mapping ORDER BY problem_type_name`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      return res.status(200).json({
        statusCode: 200,
        message: "Data list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async myCourse(req, res) {
    try {
      const { userId } = req.body;

      const dataObj = await config.sequelize.query(
        `SELECT * FROM student_courses WHERE student_id = ? ORDER BY student_course_id DESC`,
        {
          raw: true,
          replacements: [userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      for (const course of dataObj) {
        const courseObj = await config.sequelize.query(
          `SELECT * FROM course_tests WHERE course_id = ? ORDER BY student_course_id DESC`,
          {
            raw: true,
            replacements: [course.course_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
      }
      return res.status(200).json({
        statusCode: 200,
        message: "Data list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }
  async myCourse(req, res) {
    try {
      const { userId } = req.body;

      const dataObj = await config.sequelize.query(
        `SELECT * FROM student_courses WHERE student_id = ? ORDER BY student_course_id DESC`,
        {
          raw: true,
          replacements: [userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      return res.status(200).json({
        statusCode: 200,
        message: "Data list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async myTestSeries(req, res) {
    try {
      const { course_id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT UTS.*, TS.* FROM student_test_series UTS, test_series TS WHERE UTS.test_series_id = TS.test_series_id AND UTS.course_id = ? ORDER BY UTS.student_test_series_id DESC`,
        {
          raw: true,
          replacements: [course_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "student_test_series list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async myTests(req, res) {
    try {
      const { test_series_id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT ST.*, T.* FROM student_tests ST,tests T WHERE ST.test_id = T.test_id AND ST.test_series_id = ? ORDER BY ST.student_test_id DESC`,
        {
          raw: true,
          replacements: [test_series_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "student_test list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async stateList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT state_id, state_name FROM states ORDER BY state_name`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "state list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async cityList(req, res) {
    try {
      const { state_id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT city_id, city_name FROM cities WHERE state_id = ? ORDER BY city_name`,
        {
          raw: true,
          replacements: [state_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "city list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async userTypeList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT user_type_id, user_type_name FROM user_types ORDER BY user_type_name`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "user type list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

// by lalit
 async pathshalaList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT UA.user_id,SR.school_name FROM user_accounts UA, school_registration SR WHERE SR.user_id=UA.user_id`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
	if (!dataObj.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "No Pathshala Found!" });
      }
	  
      return res.status(200).json({
        statusCode: 200,
        message: "Pathshala list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }
  
async courseByCategoryList(req, res) {
    try {
	const { category_id } = req.params;
      const dataObj = await config.sequelize.query(
	`SELECT C.*, CC.course_category_name, S.stream_name FROM courses AS C,course_categories AS CC,streams AS S WHERE C.course_category_id = ? AND C.course_category_id = CC.course_category_id AND C.stream_id = S.stream_id AND C.is_deleted = false`,
        {
          raw: true,
	  replacements: [category_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
	if (!dataObj.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "No Category Found" });
      }
      return res.status(200).json({
        statusCode: 200,
        message: "courses by category",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

}

module.exports = new CommonController();
