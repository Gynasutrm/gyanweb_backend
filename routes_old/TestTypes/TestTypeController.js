const config = require("../../config/connection");

class TestTypeController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM test_types WHERE is_deleted = false ORDER BY test_type_name`,
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
      const { test_type_name } = req.body;
      const checkObj = await config.sequelize.query(
        `SELECT test_type_id FROM test_types WHERE test_type_name = ?`,
        {
          replacements: [test_type_name],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (checkObj.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "Already exists" });
      }
      await config.sequelize.query(
        `INSERT INTO test_types (test_type_name) VALUES (?)`,
        {
          replacements: [test_type_name],
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
        `SELECT * FROM test_types WHERE test_type_id = ? AND is_deleted = false`,
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
      const { test_type_name } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT test_type_id FROM test_types WHERE test_type_id = ? AND is_deleted = false`,
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
        `UPDATE test_types SET test_type_name = ? WHERE test_type_id = ?`,
        {
          replacements: [test_type_name, id],
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
        `SELECT test_type_id FROM test_types WHERE test_type_id = ? AND is_deleted = false`,
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
        `UPDATE test_types SET is_deleted = true WHERE test_type_id = ?`,
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

module.exports = new TestTypeController();
