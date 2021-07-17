const config = require("../../config/connection");

class CourseController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT C.*, CC.course_category_name, S.stream_name 
        FROM courses AS C,course_categories AS CC,streams AS S 
        WHERE C.course_category_id = CC.course_category_id 
        AND C.stream_id = S.stream_id 
        AND C.is_deleted = false 
        ORDER BY C.course_name`,
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
        course_category_id,
        stream_id,
        course_name,
        course_code,
        medium,
        courseClasses,
        courseExamTypes,
      } = req.body;
      const checkObj = await config.sequelize.query(
        `SELECT course_id FROM courses WHERE course_category_id = ? AND stream_id = ? AND course_name = ?`,
        {
          replacements: [course_category_id, stream_id, course_name],
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
        `INSERT INTO courses (course_category_id, stream_id,course_name,course_code,medium) VALUES (?,?,?,?,?) RETURNING course_id`,
        {
          replacements: [
            course_category_id,
            stream_id,
            course_name,
            course_code,
            medium,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );
      // insert into mapping
      const lastInsertedId = result[0][0].course_id;
      // insert multiple classes
      // courseClasses = [{class_id: 1},{class_id: 2}]
      if (courseClasses.length) {
        let subClQry =
          "INSERT INTO course_classes (course_id, class_id) VALUES ";
        courseClasses.forEach((ele) => {
          subClQry += `(${lastInsertedId},${ele.class_id}),`;
        });
        subClQry = subClQry.slice(0, -1);
        await config.sequelize.query(subClQry, {
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        });
      }
      // insert multiple course exam types
      // courseExamTypes = [{exam_type_id: 1,subExamTypes: [{sub_exam_type_id: 1},{sub_exam_type_id: 2}]}]
      if (courseExamTypes.length) {
        let subExQry =
          "INSERT INTO course_exam_types (course_id, exam_type_id, sub_exam_type_id) VALUES ";
        courseExamTypes.forEach((element) => {
          element.subExamTypes.forEach((ele) => {
            subExQry += `(${lastInsertedId},${element.exam_type_id},${ele.sub_exam_type_id}),`;
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

  async view(req, res) {
    try {
      const { id } = req.params;

      const dataObj = await config.sequelize.query(
        `SELECT C.*, CC.course_category_name, S.stream_name FROM courses AS C,course_categories AS CC,streams AS S WHERE C.course_id = ? AND C.course_category_id = CC.course_category_id AND C.stream_id = S.stream_id AND C.is_deleted = false`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }

      // for (const course of dataObj) {
      //   // get course classses

      //   // get course exam types
      //   await config.sequelize.query(`SELECT * from `, {
      //     replacements: [id],
      //     raw: true,
      //     type: config.sequelize.QueryTypes.SELECT,
      //   });
      // }

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
      const {
        course_category_id,
        stream_id,
        course_name,
        course_code,
        medium,
        courseClasses,
        courseExamTypes,
      } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT course_id FROM courses WHERE course_id = ? AND is_deleted = false`,
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
        `UPDATE courses SET course_category_id = ?, stream_id = ?, course_name = ?, course_code = ?, medium = ? WHERE course_id = ?`,
        {
          replacements: [
            course_category_id,
            stream_id,
            course_name,
            course_code,
            medium,
            id,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      let subUpdateQry = "";

      // courseClasses = [{id:1,course_id: 1, class_id: 1},{course_id: 2,class_id: 2}]
      if (courseClasses.length) {
        let subInsertClQry = "";
        let subClQry =
          "INSERT INTO course_classes (course_id, class_id) VALUES ";
        courseClasses.forEach((ele) => {
          if (ele.course_class_id) {
            subUpdateQry += `UPDATE course_classes SET class_id = '${ele.class_id}' WHERE course_class_id = '${ele.course_class_id}';`;
          } else {
            subInsertClQry += `(${id},${ele.class_id}),`;
          }
        });

        // update data
        if (subUpdateQry != "") {
          await config.sequelize.query(subUpdateQry, {
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          });
        }
        if (subInsertClQry != "") {
          subClQry = subClQry + subInsertClQry;
          subClQry = subClQry.slice(0, -1);
          await config.sequelize.query(subClQry, {
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          });
        }
        console.log("-subClQry", subClQry);
        console.log("-subUpdateQry", subUpdateQry);
      }

      // insert multiple course exam types
      // courseExamTypes = [{exam_type_id: 1,subExamTypes: [{sub_exam_type_id: 1},{sub_exam_type_id: 2}]}]
      if (courseExamTypes.length) {
        let subUpdateCeQry = "";
        let subinserQry = "";
        let subExQry =
          "INSERT INTO course_exam_types (course_id, exam_type_id, sub_exam_type_id) VALUES ";
        courseExamTypes.forEach((element) => {
          element.subExamTypes.forEach((ele) => {
            if (element.course_exam_type_id) {
              subUpdateCeQry += `UPDATE course_exam_types SET exam_type_id = '${element.exam_type_id}',sub_exam_type_id = '${ele.sub_exam_type_id}' WHERE course_exam_type_id = '${element.course_exam_type_id}';`;
            } else {
              subinserQry += `(${id},${element.exam_type_id},${ele.sub_exam_type_id}),`;
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
        `SELECT * FROM courses WHERE course_id = ? AND is_deleted = false`,
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
        `UPDATE courses SET is_deleted = true WHERE course_id = ?`,
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

module.exports = new CourseController();
