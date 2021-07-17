const config = require("../../config/connection");

class TestSeriesController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT TS.*, S.stream_name, C.class_name, T.test_type_name 
        FROM test_series TS,streams S,test_types T,classes C 
        WHERE TS.stream_id = S.stream_id AND TS.class_id = C.class_id AND TS.test_type_id = T.test_type_id AND TS.is_deleted = false ORDER BY TS.test_series_name`,
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
  async add(req, res) {
    try {
      const {
        stream_id,
        class_id,
        test_type_id,
        test_series_name,
        courseCatAndCourseID,
      } = req.body;
      const checkObj = await config.sequelize.query(
        `SELECT test_series_id FROM test_series WHERE stream_id = ? AND class_id = ? 
        AND test_type_id = ? AND test_series_name = ? AND is_deleted=false`,
        {
          replacements: [stream_id, class_id, test_type_id, test_series_name],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (checkObj.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "Already exists" });
      }
      const result = await config.sequelize.query(
        `INSERT INTO test_series (stream_id, class_id, test_type_id, test_series_name) VALUES (?,?,?,?) RETURNING test_series_id`,
        {
          replacements: [stream_id, class_id, test_type_id, test_series_name],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );
      // insert into mapping
      const lastInsertedId = result[0][0].test_series_id;
      // insert multiple course category and courses
      if (courseCatAndCourseID.length) {
        let subExQry =
          "INSERT INTO test_series_course (test_series_id, course_id) VALUES ";
        courseCatAndCourseID.forEach((element) => {
          element.course_ids.forEach((ele) => {
            subExQry += `(${lastInsertedId},${ele.course_id}),`;
          });
        });
        subExQry = subExQry.slice(0, -1);
        console.log("-subExQry", subExQry);
        await config.sequelize.query(subExQry, {
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        });
      }
      return res.status(200).json({
        statusCode: 200,
        message: "Added successfully",
        data: {},
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async addTest(req, res) {
    try {
      const {
        test_series_id,
        test_name,
        test_date,
        test_time,
        test_duration,
        test_total_marks,
        test_passing_marks,
        test_negative_marking,
        test_instruction, //ckeditor
      } = req.body;
      const insert = await config.sequelize.query(
        `INSERT INTO tests 
                  (test_series_id, test_name, test_date, test_time, test_duration, test_total_marks, test_passing_marks,
                  test_negative_marking, test_instruction) VALUES (?,?,?,?,?,?,?,?,?)`,
        {
          replacements: [
            test_series_id,
            test_name,
            test_date,
            test_time,
            test_duration,
            test_total_marks,
            test_passing_marks,
            test_negative_marking,
            test_instruction,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async view(req, res) {
    try {
      const { id } = req.params;

      const dataObj = await config.sequelize.query(
        `SELECT TS.*, S.stream_name, C.class_name, T.test_type_name 
        FROM test_series TS,streams S,test_types T,classes C 
        WHERE TS.stream_id = S.stream_id AND TS.class_id = C.class_id AND TS.test_type_id = T.test_type_id AND TS.is_deleted = false AND TS.test_series_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      // get course category and courses
      const courseCat = await config.sequelize.query(
        `SELECT * FROM test_series_course WHERE test_series_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      dataObj[0].mapping = courseCat;
      console.log("courseCat", courseCat);
      return res.status(200).json({
        statusCode: 200,
        message: "Get result successfully",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { stream_id, class_id, test_type_id, test_series_name } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT test_series_id FROM test_series WHERE test_series_id = ? AND is_deleted = false`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      await config.sequelize.query(
        `UPDATE test_series SET stream_id = ? ,class_id = ? ,test_type_id = ? ,test_series_name = ? WHERE test_series_id = ?`,
        {
          replacements: [
            stream_id,
            class_id,
            test_type_id,
            test_series_name,
            id,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      if (courseCatAndCourseID.length) {
        let subUpdateCeQry = "";
        let subinserQry = "";
        let subExQry =
          "INSERT INTO test_series_course (test_series_id, course_id) VALUES ";
        courseCatAndCourseID.forEach((element) => {
          element.subExamTypes.forEach((ele) => {
            if (element.test_series_id) {
              subUpdateCeQry += `UPDATE test_series_course SET course_id = '${ele.course_id}' WHERE test_series_id = '${element.test_series_id}';`;
            } else {
              subinserQry += `(${id},${ele.course_id}),`;
            }
          });
        });
        if (subinserQry != "") {
          subExQry = subExQry + subinserQry;
          subExQry = subExQry.slice(0, -1);
          console.log("-subExQry", subExQry);
          await config.sequelize.query(subExQry, {
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          });
        }
        console.log("-subUpdateCeQry", subUpdateCeQry);
        // update data
        if (subUpdateCeQry != "") {
          await config.sequelize.query(subUpdateCeQry, {
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          });
        }
      }

      return res.status(200).json({
        statusCode: 200,
        message: "Updated successfully",
        data: {},
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT * FROM test_series WHERE test_series_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      await config.sequelize.query(
        `DELETE FROM test_series WHERE test_series_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Deleted successfully",
        data: {},
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }
}

module.exports = new TestSeriesController();
