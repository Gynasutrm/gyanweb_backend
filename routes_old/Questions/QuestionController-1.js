const config = require("../../config/connection");
const QuestionModel = require("./../../models/Question");

class QuestionController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT Q.*, S.stream_name, C.class_name, SB.subject_name, SST.sub_sub_topic_name, P.problem_difficulty_name, PA.problem_actual_type_name 
        FROM questions Q, streams S, classes C, subjects SB, sub_sub_topics SST, problem_defficulties P, problem_actual_types PA  WHERE 
        Q.stream_id = S.stream_id 
        AND Q.class_id = C.class_id
        AND Q.subject_id = SB.subject_id
        AND Q.sub_sub_topic_id = SST.sub_sub_topic_id
        AND Q.problem_difficulty_id = P.problem_difficulty_id
        AND Q.problem_actual_type_id = PA.problem_actual_type_id 
        AND Q.mongodb_id IS NOT NULL
        AND Q.is_deleted = false`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      for (const element of dataObj) {
        if (element.mongodb_id) {
          const qsn = await QuestionModel.findById({
            _id: element.mongodb_id,
          }).lean();
          element.mongoData = qsn;
        }
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

  async add(req, res) {
    try {
      const {
        problem_type_name,
        stream_id,
        class_id,
        subject_id,
        sub_sub_topic_id,
        problem_difficulty_id,
        problem_actual_type_id,
        problem_description,
        multiple_options,
        tags,
        correct_options,
        detailed_solutions,
      } = req.body;

      const result = await config.sequelize.query(
        `INSERT INTO questions (problem_type_name, stream_id,
          class_id,
          subject_id,
          sub_sub_topic_id,
          problem_difficulty_id,
          problem_actual_type_id) VALUES (?,?,?,?,?,?,?) RETURNING question_id`,
        {
          replacements: [
            problem_type_name,
            stream_id,
            class_id,
            subject_id,
            sub_sub_topic_id,
            problem_difficulty_id,
            problem_actual_type_id,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );
      const lastInsertedId = result[0][0].question_id;

      const obj = new QuestionModel();
      obj.problem_description = problem_description;
      obj.multiple_options = multiple_options;
      obj.tags = tags;
      obj.correct_options = correct_options;
      obj.detailed_solutions = detailed_solutions;
      const resultObj = await obj.save();

      await config.sequelize.query(
        `UPDATE questions SET mongodb_id = '${resultObj._id}' WHERE question_id = ?`,
        {
          replacements: [lastInsertedId],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
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
        `SELECT Q.*, S.stream_name, C.class_name, SB.subject_name, SST.sub_sub_topic_name, P.problem_difficulty_name, PA.problem_actual_type_name 
        FROM questions Q, streams S, classes C, subjects SB, sub_sub_topics SST, problem_defficulties P, problem_actual_types PA  
        WHERE 
        Q.stream_id = S.stream_id 
        AND Q.class_id = C.class_id
        AND Q.subject_id = SB.subject_id
        AND Q.sub_sub_topic_id = SST.sub_sub_topic_id
        AND Q.problem_difficulty_id = P.problem_difficulty_id
        AND Q.problem_actual_type_id = PA.problem_actual_type_id 
        AND Q.question_id = ? 
        AND Q.mongodb_id IS NOT NULL
        AND Q.is_deleted = false`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      // get data from mongodb
      if (dataObj[0].mongodb_id) {
        const questionMongoData = await QuestionModel.findOne({
          _id: dataObj[0].mongodb_id,
        }).lean();
        dataObj[0].mongoData = questionMongoData;
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
        problem_type_name,
        stream_id,
        class_id,
        subject_id,
        sub_sub_topic_id,
        problem_difficulty_id,
        problem_actual_type_id,
      } = req.body;
      console.log("-req.body", req.body);

      const dataObj = await config.sequelize.query(
        `SELECT question_id FROM questions WHERE question_id = ? AND is_deleted = false`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      console.log("-dataObj", dataObj);
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      await config.sequelize.query(
        `UPDATE questions SET problem_type_name = ?, stream_id = ?, class_id = ?, subject_id = ?, sub_sub_topic_id = ?, problem_difficulty_id = ?, problem_actual_type_id = ?  WHERE question_id = ?`,
        {
          replacements: [
            problem_type_name,
            stream_id,
            class_id,
            subject_id,
            sub_sub_topic_id,
            problem_difficulty_id,
            problem_actual_type_id,
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
        `SELECT * FROM questions WHERE question_id = ? AND is_deleted = false`,
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
        `UPDATE questions SET is_deleted = true WHERE question_id = ?`,
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

module.exports = new QuestionController();
