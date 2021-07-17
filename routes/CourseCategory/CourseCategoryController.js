const config = require("../../config/connection");

class CourseCategoryController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM course_categories WHERE is_deleted = false ORDER BY course_category_name`,
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
      const { course_category_name } = req.body;
      const checkObj = await config.sequelize.query(
        `SELECT course_category_id FROM course_categories WHERE course_category_name = ?  AND is_deleted=false`,
        {
          replacements: [course_category_name],
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
        `INSERT INTO course_categories (course_category_name) VALUES (?)`,
        {
          replacements: [course_category_name],
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
        `SELECT * FROM course_categories WHERE course_category_id = ? AND is_deleted = false`,
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
      const { course_category_name } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT course_category_id FROM course_categories WHERE course_category_id = ? AND is_deleted = false`,
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
        `UPDATE course_categories SET course_category_name = ? WHERE course_category_id = ?`,
        {
          replacements: [course_category_name, id],
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
        `SELECT * FROM course_categories WHERE course_category_id = ?`,
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
        `DELETE FROM course_categories WHERE course_category_id = ?`,
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

module.exports = new CourseCategoryController();
