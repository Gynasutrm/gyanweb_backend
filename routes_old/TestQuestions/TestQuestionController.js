const config = require("../../config/connection");
const QuestionModel = require("./../../models/Question");

class TestQuestionController {
  async save(req, res) {  
    try {
      const { test_id } = req.params;
      console.log(test_id);
      const dataObj = await config.sequelize.query(
        `SELECT test_question_id FROM test_questions WHERE test_id = ?`,
        {
          replacements: [test_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }

      await config.sequelize.query(
        `UPDATE test_questions SET status = true WHERE test_id = ?`,
        {
          replacements: [test_id],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Saved successfully",
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async getTestQuestion(req, res) {
    try {
      const { test_id } = req.params;

      const dataObj = await config.sequelize.query(
        `SELECT TQ.*,Q.mongodb_id FROM test_questions TQ, questions Q WHERE TQ.question_id=Q.question_id AND test_id = ?
	     AND Q.mongodb_id IS NOT NULL ORDER BY serial_no`,
        {
          replacements: [test_id],
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

  async deleteQsn(req, res) {
    try {
      const { test_id, id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT test_question_id FROM test_questions WHERE test_id = ? AND question_id = ?`,
        {
          replacements: [test_id, id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      await config.sequelize.query(
        `DELETE FROM test_questions WHERE test_id = ? AND test_question_id = ?`,
        {
          replacements: [test_id, id],
          raw: true,
          type: config.sequelize.QueryTypes.DELETE,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Questin deleted from this test",
        data: {},
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async checkQuestionINTestSeries(req, res) {
    try {
      const { question_id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT TQ.*,TS.test_series_id, T.test_name, TS.test_series_name 
          FROM test_questions TQ, tests T, test_series TS 
          WHERE TQ.test_id = T.test_id 
            AND T.test_series_id = TS.test_series_id 
            AND TQ.question_id = ? ORDER BY TS.test_series_id`,
        {
          replacements: [question_id],
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

  async addQuestions(req, res) {
    try {
      const { test_id, questionArr } = req.body;
      var tmp=[]

      const dataObj = await config.sequelize.query(
        `SELECT * FROM tests WHERE test_id = ?`,
        {
          replacements: [test_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Given Test not exists!" });
      }
      var chk=0;
      if (questionArr.length) {
        let subClQry ="INSERT INTO test_questions (test_id, question_id) VALUES ";
    
        // questionArr.forEach(const (ele) => {
          for (const ele of questionArr) {
            //checking question exixts or not
            const chkQueObj = await config.sequelize.query(
            `SELECT question_id FROM questions WHERE question_id = ?`,
            {
              replacements: [ele],
              raw: true,
              type: config.sequelize.QueryTypes.SELECT,
            }
            );
            if (!chkQueObj.length) {
              tmp.push(ele);
                continue;
            }
            //end checking question exixts or not

            // chk alrady add or not
            const chkAlreadyAddObj = await config.sequelize.query(
            `SELECT * FROM test_questions WHERE test_id = ? AND question_id=?`,
            {
              replacements: [test_id,ele],
              raw: true,
              type: config.sequelize.QueryTypes.SELECT,
            });            
            if (chkAlreadyAddObj.length) {
              continue;  //skip if already present in test
            }
            //end chk alrady add or not
            chk=1;
            subClQry += `(${test_id},${ele}),`;
        };

        if(chk){
                subClQry = subClQry.slice(0, -1);
                console.log("-subClQry", subClQry);
                await config.sequelize.query(subClQry, {
                  raw: true,
                  type: config.sequelize.QueryTypes.INSERT,
                });
              }

        if(tmp.length){
        return res.status(200).json({
          statusCode: 200,
          message: "Added successfully and following question not exists : " + tmp,
        });}
        else{
          return res.status(200).json({
            statusCode: 200,
            message: "Added successfully"});
        }

      }

      return res.status(200).json({
        statusCode: 203,
        message: "Please add atleast one question",
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async updateIndexAndMarks(req, res) {
    try {
      const { test_id, questionArr } = req.body;
       // chk test exixts or not 
       const dataObj = await config.sequelize.query(
        `SELECT * FROM tests WHERE test_id = ?`,
        {
          replacements: [test_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Given Test not exists!" });
      }
      const totalQ=dataObj[0].test_total_question;
      // count the question in given test before insert
      const dataCountObj1 = await config.sequelize.query(
        `SELECT count(*) as total FROM test_questions WHERE test_id = ?`,
        {
          replacements: [test_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(dataCountObj1[0].total>totalQ)
      {
        return res.status(200).
        json({ statusCode: 203, message: "You are selected more questions as defined in test!" });  
      }
      

      if (questionArr.length) {
         // questionArr.forEach(async(ele) => {
        for (const ele of questionArr) {
          // chk test exixts or not 
          const chkQInTestObj = await config.sequelize.query(
            `SELECT * FROM test_questions WHERE test_id = ? AND question_id=?`,
              {
                replacements: [test_id,ele.question_id],
                raw: true,
                type: config.sequelize.QueryTypes.SELECT,
              }
            );
            //if question is not present in test then insert
            if (!chkQInTestObj.length) {
              let subClQry =
              "INSERT INTO test_questions (test_id, question_id,marks,serial_no,negative_mark) VALUES"
              await config.sequelize.query(subClQry, {
                replacements: [test_id,ele.question_id,ele.marks,ele.serial_no,ele.negative_mark],
                raw: true,
                type: config.sequelize.QueryTypes.INSERT,
              });
            }
            //otherwise update
            else{
              let subClQry =
              "UPDATE test_questions SET marks=?, serial_no=?,negative_mark=? WHERE test_id=? AND question_id=?"
              await config.sequelize.query(subClQry, {
                replacements: [ele.marks,ele.serial_no,ele.negative_mark,test_id,ele.question_id],
                raw: true,
                type: config.sequelize.QueryTypes.INSERT,
              });
          }

        }

        // count the question in given test after insert
      const dataCountObj = await config.sequelize.query(
        `SELECT count(*) as total FROM test_questions WHERE test_id = ?`,
        {
          replacements: [test_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(dataCountObj[0].total>totalQ)
      {
        return res.status(200).
        json({ statusCode: 203, message: "You are selected more questions as defined in test!" });  
      }
      const remainQues=totalQ-dataCountObj[0].total;

        return res.status(200).json({
          statusCode: 200,
          message: "Updated successfully! You have to add " + remainQues + " more questions in this test!",
        });

      }

      return res.status(200).json({
        statusCode: 203,
        message: "Please add atleast one question",
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async filterQuestion(req, res) {
    try {
      const {
        test_id,
        stream_id,
        class_id,
        subject_id,
        topic_id,
        sub_topic_id,
        sub_sub_topic_id,
        problem_difficulty_id,
        problem_actual_type_id,
        question_name,
      } = req.body;
      let filterQry = `SELECT Q.* 
      FROM Questions Q
      WHERE  Q.question_id NOT IN(SELECT question_id FROM test_questions where test_id=?) 
      AND Q.mongodb_id IS NOT NULL
      AND Q.is_deleted = false`;
      if (stream_id != undefined && stream_id != "") {
        filterQry += ` AND Q.stream_id = '${stream_id}' `;
      }
      if (class_id != undefined && class_id != "") {
        filterQry += ` AND Q.class_id = '${class_id}'`;
      }
      if (subject_id != undefined && subject_id != "") {
        filterQry += ` AND Q.subject_id = '${subject_id}'`;
      }
      if (topic_id != undefined && topic_id != "") {
        filterQry += ` AND Q.topic_id = '${topic_id}'`;
      }
      if (problem_difficulty_id != undefined && problem_difficulty_id != "") {
        filterQry += ` AND Q.problem_difficulty_id = '${problem_difficulty_id}'`;
      }
      if (problem_actual_type_id != undefined && problem_actual_type_id != "") {
        filterQry += ` AND Q.problem_actual_type_id = '${problem_actual_type_id}'`;
      }
      if (sub_topic_id != undefined && sub_topic_id != "") {
        filterQry += ` AND Q.sub_topic_id = '${sub_topic_id}'`;
      }
      if (sub_sub_topic_id != undefined && sub_sub_topic_id != "") {
        filterQry += ` AND Q.sub_sub_topic_id = '${sub_sub_topic_id}'`;
      }
      if (question_name != undefined && question_name != "") {
        filterQry += ` AND Q.question_name LIKE '%${question_name}%'`;
      }

      console.log("-filterQry", filterQry);
      const dataObj = await config.sequelize.query(filterQry, {
        replacements:[test_id],
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });
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

  // async update(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const { test_id, question_id, marks, serial_no } = req.body;
  //     const dataObj = await config.sequelize.query(
  //       `SELECT test_question_id FROM test_questions WHERE test_id = ? AND test_question_id = ? AND is_deleted = false`,
  //       {
  //         replacements: [test_id, id],
  //         raw: true,
  //         type: config.sequelize.QueryTypes.SELECT,
  //       }
  //     );
  //     if (!dataObj.length) {
  //       return res.status(200).json({ statusCode: 203, message: "Not exists" });
  //     }
  //     await config.sequelize.query(
  //       `UPDATE test_questions SET test_id = ?,question_id = ?,marks = ?,serial_no = ? WHERE test_question_id = ?`,
  //       {
  //         replacements: [test_id, question_id, marks, serial_no, id],
  //         raw: true,
  //         type: config.sequelize.QueryTypes.UPDATE,
  //       }
  //     );

  //     return res.status(200).json({
  //       statusCode: 200,
  //       message: "Updated successfully",
  //       data: {},
  //     });
  //   } catch (error) {
  //     console.log("-error", error);
  //     return res
  //       .status(200)
  //       .json({ statusCode: 203, message: "Something went wrong" });
  //   }
  // }

  // async delete(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const dataObj = await config.sequelize.query(
  //       `SELECT * FROM test_questions WHERE test_question_id = ? AND is_deleted = false`,
  //       {
  //         replacements: [id],
  //         raw: true,
  //         type: config.sequelize.QueryTypes.SELECT,
  //       }
  //     );
  //     if (!dataObj.length) {
  //       return res.status(200).json({ statusCode: 203, message: "Not exists" });
  //     }
  //     await config.sequelize.query(
  //       `UPDATE test_questions SET is_deleted = true WHERE test_question_id = ?`,
  //       {
  //         replacements: [id],
  //         raw: true,
  //         type: config.sequelize.QueryTypes.UPDATE,
  //       }
  //     );

  //     return res.status(200).json({
  //       statusCode: 200,
  //       message: "Deleted successfully",
  //       data: {},
  //     });
  //   } catch (error) {
  //     console.log("-error", error);
  //     return res
  //       .status(200)
  //       .json({ statusCode: 203, message: "Something went wrong" });
  //   }
  // }
  // async list(req, res) {
  //   try {
  //     console.log(
  //       `SELECT * FROM test_questions WHERE is_deleted = false ORDER BY test_question_id DESC`
  //     );
  //     const dataObj = await config.sequelize.query(
  //       `SELECT * FROM test_questions WHERE is_deleted = false ORDER BY test_question_id DESC`,
  //       {
  //         raw: true,
  //         type: config.sequelize.QueryTypes.SELECT,
  //       }
  //     );
  //     return res.status(200).json({
  //       statusCode: 200,
  //       message: "Data list",
  //       data: dataObj,
  //     });
  //   } catch (error) {
  //     console.log("-error", error);
  //     return res
  //       .status(200)
  //       .json({ statusCode: 203, message: "Something went wrong" });
  //   }
  // }
}

module.exports = new TestQuestionController();
