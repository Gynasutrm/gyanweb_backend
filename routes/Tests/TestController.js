const config = require("../../config/connection");

class TestController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT T.*, TS.test_series_name FROM tests T, test_series TS WHERE TS.test_series_id = T.test_series_id AND T.is_deleted = false ORDER BY T.test_name`,
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
        test_series_id,
        test_name,
        test_start_date,
        test_end_date,
        test_time,
        test_duration,
        test_total_marks,
        test_passing_marks,
        test_negative_marking,
        test_total_question,
        test_instruction, //ckeditor
      } = req.body;
      const insert = await config.sequelize.query(
        `INSERT INTO tests 
                  (test_series_id,
                    test_name,
                    test_start_date,
                    test_end_date,
                    test_time,
                    test_duration,
                    test_total_marks,
                    test_passing_marks,
                    test_negative_marking,
                    test_total_question,
                    test_instruction) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        {
          replacements: [
            test_series_id,
            test_name,
            test_start_date,
            test_end_date,
            test_time,
            test_duration,
            test_total_marks,
            test_passing_marks,
            test_negative_marking,
            test_total_question,
            test_instruction,
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
        `SELECT T.*, TS.test_series_name FROM tests T, test_series TS WHERE TS.test_series_id = T.test_series_id AND T.is_deleted = false AND T.test_id = ? `,
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
      const {
        test_series_id,
        test_name,
        test_start_date,
        test_end_date,
        test_time,
        test_duration,
        test_total_marks,
        test_passing_marks,
        test_negative_marking,
        test_total_question,
        test_instruction,
      } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT test_id FROM tests WHERE test_id = ? AND is_deleted = false`,
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
        `UPDATE tests SET test_series_id = ?,test_name = ?,test_start_date = ?,test_end_date = ?,test_time = ?,test_duration = ?,test_total_marks = ?,test_passing_marks = ?,test_negative_marking = ?,test_total_question = ?,test_instruction = ? WHERE test_id = ?`,
        {
          replacements: [
            test_series_id,
            test_name,
            test_start_date,
            test_end_date,
            test_time,
            test_duration,
            test_total_marks,
            test_passing_marks,
            test_negative_marking,
            test_total_question,
            test_instruction,
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
        `SELECT * FROM tests WHERE test_id = ?`,
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
        `DELETE FROM tests WHERE test_id = ?`,
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

module.exports = new TestController();
