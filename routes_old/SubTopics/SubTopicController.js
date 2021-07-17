const config = require("../../config/connection");

class SubTopicController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT ST.*,T.topic_name, T.subject_id, S.subject_name 
          FROM sub_topics ST, topics T ,subjects S  
            WHERE ST.is_deleted = false 
              AND ST.topic_id = T.topic_id 
              AND T.subject_id = S.subject_id
                ORDER BY ST.sub_topic_name`,
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
      const { topic_id, sub_topic_name } = req.body;
      const checkObj = await config.sequelize.query(
        `SELECT sub_topic_id FROM sub_topics WHERE sub_topic_name = ? AND topic_id = ?`,
        {
          replacements: [sub_topic_name, topic_id],
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
        `INSERT INTO sub_topics (topic_id, sub_topic_name) VALUES (?,?)`,
        {
          replacements: [topic_id, sub_topic_name],
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
        `SELECT ST.*,T.topic_name,T.subject_id, S.subject_name 
          FROM sub_topics ST, topics T ,subjects S 
            WHERE ST.is_deleted = false 
              AND ST.topic_id = T.topic_id 
              AND T.subject_id = S.subject_id
              AND ST.sub_topic_id = ? 
              AND ST.is_deleted = false`,
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

  async subjectWiseTopic(req, res) {
    try {
      const { subject_id } = req.params;

      const dataObj = await config.sequelize.query(
        `SELECT * FROM topics WHERE subject_id = ? AND status = true AND is_deleted = false`,
        {
          replacements: [subject_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

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
      const { topic_id, sub_topic_name } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT sub_topic_id FROM sub_topics WHERE sub_topic_id = ? AND is_deleted = false`,
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
        `UPDATE sub_topics SET topic_id = ?, sub_topic_name = ? WHERE sub_topic_id = ?`,
        {
          replacements: [topic_id, sub_topic_name, id],
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
        `SELECT * FROM sub_topics WHERE sub_topic_id = ? AND is_deleted = false`,
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
        `UPDATE sub_topics SET is_deleted = true WHERE sub_topic_id = ?`,
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

module.exports = new SubTopicController();
