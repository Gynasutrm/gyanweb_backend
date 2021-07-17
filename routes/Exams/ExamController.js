const config = require("../../config/connection");

class ExamController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        // `SELECT * FROM exams WHERE is_deleted = false ORDER BY exam_type_name`,
        //stream_id,        class_id,        subject_id,        topic_id,        sub_topic_id,        problem_diff_id,        prob_type_actual_id,
        `SELECT E.*, S.strea_name, CL.class_name, SB.subject_name , TP.topic_name, ST.sub_topic_name, PD.problem_diff_name , PD.problem_diff_name 
          FROM exams AS E,course_categories AS CC,classes AS CL,exam_types AS ET 
            WHERE E.is_deleted = false 
              AND E.course_category_id = CC.id 
              AND E.class_id = CL.id 
              AND E.exam_type_id =ET.id  
              ORDER BY E.exam_type_name`,
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
        subject_id,
        topic_id,
        sub_topic_id,
        problem_diff_id,
        prob_type_actual_id,
        dates,
        start_time,
        allowed_time,
      } = req.body;

      await config.sequelize.query(
        `INSERT INTO exams (stream_id,
          class_id,
          subject_id,
          topic_id,
          sub_topic_id,
          problem_diff_id,
          prob_type_actual_id,
          dates,
          start_time,
          allowed_time) VALUES (?)`,
        {
          replacements: [
            stream_id,
            class_id,
            subject_id,
            topic_id,
            sub_topic_id,
            problem_diff_id,
            prob_type_actual_id,
            dates,
            start_time,
            allowed_time,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );

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
        `SELECT * FROM exams WHERE id = ? AND is_deleted = false`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }

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
      const { exam_type_name } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT id FROM exams WHERE id = ? AND is_deleted = false`,
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
        `UPDATE exams SET stream_id = ?,class_id = ?,subject_id = ?,topic_id = ?,sub_topic_id = ?,problem_diff_id = ?,prob_type_actual_id = ?,dates = ?,start_time = ?,allowed_time = ? WHERE id = ?`,
        {
          replacements: [
            stream_id,
            class_id,
            subject_id,
            topic_id,
            sub_topic_id,
            problem_diff_id,
            prob_type_actual_id,
            dates,
            start_time,
            allowed_time,
            id,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );

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
        `SELECT * FROM exams WHERE id = ?`,
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
        `DELETE from exams WHERE id = ?`,
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

module.exports = new ExamController();
