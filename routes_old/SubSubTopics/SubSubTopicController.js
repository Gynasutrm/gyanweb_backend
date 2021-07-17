const config = require("../../config/connection");

class SubSubTopicController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT ST.*,T.sub_topic_name, S.subject_id, S.subject_name, TP.topic_id, TP.topic_name 
          FROM sub_sub_topics ST,  sub_topics T, topics TP, subjects S 
            WHERE 
              ST.sub_topic_id = T.sub_topic_id 
              AND T.topic_id = TP.topic_id 
              AND S.subject_id = TP.subject_id
                ORDER BY ST.sub_sub_topic_name`,
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
      const { sub_topic_id, sub_sub_topic_name } = req.body;
      const checkObj = await config.sequelize.query(
        `SELECT sub_sub_topic_id FROM sub_sub_topics WHERE sub_topic_id = ? AND sub_sub_topic_name = ? `,
        {
          replacements: [sub_topic_id, sub_sub_topic_name],
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
        `INSERT INTO sub_sub_topics (sub_topic_id, sub_sub_topic_name) VALUES (?,?)`,
        {
          replacements: [sub_topic_id, sub_sub_topic_name],
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
        `SELECT ST.*,T.sub_topic_name, S.subject_id, S.subject_name, TP.topic_id, TP.topic_name 
          FROM sub_sub_topics ST,  sub_topics T, topics TP, subjects S 
            WHERE 
              ST.sub_topic_id = T.sub_topic_id 
              AND T.topic_id = TP.topic_id 
              AND S.subject_id = TP.subject_id 
              AND ST.sub_sub_topic_id = ? 
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

  async topicWiseSubTopic(req, res) {
    try {
      const { topic_id } = req.params;

      const dataObj = await config.sequelize.query(
        `SELECT * FROM sub_topics WHERE topic_id = ? AND status = true AND is_deleted = false`,
        {
          replacements: [topic_id],
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
 async subtopicWisesubsubTopic(req, res) {
    try {
      const { subtopic_id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT * FROM sub_sub_topics WHERE sub_topic_id = ? AND status = true AND is_deleted = false`,
        {
          replacements: [subtopic_id],
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
      const { sub_topic_id, sub_sub_topic_name } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT sub_sub_topic_id FROM sub_sub_topics WHERE sub_sub_topic_id = ? AND is_deleted = false`,
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
        `UPDATE sub_sub_topics SET sub_topic_id = ?, sub_sub_topic_name = ? WHERE sub_sub_topic_id = ?`,
        {
          replacements: [sub_topic_id, sub_sub_topic_name, id],
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
        `SELECT * FROM sub_sub_topics WHERE sub_sub_topic_id = ? AND is_deleted = false`,
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
        `UPDATE sub_sub_topics SET is_deleted = true WHERE sub_sub_topic_id = ?`,
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

module.exports = new SubSubTopicController();
