const jwt = require('jsonwebtoken');
const config = require("../config/connection");
const moment = require("moment");
const QuestionModel = require("../models/Question");
const ResponseModel = require("../models/ResponseSave");

// for submiting test with calculation of data 
async function submitTest(userId,attempt_id){
    try{
      // ########################## for calculating data ############################## 
      const dataObj2 = await config.sequelize.query(
        `SELECT UTR.*,Q.* FROM user_test_response UTR, questions Q
        WHERE UTR.ques_id=Q.question_id AND UTR.user_test_attempt_id  = ?`,
        {
          raw: true,
          replacements: [attempt_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      // compaire to array in any order for checking answer right or wrong
      let equalsIgnoreOrder;
      try{
        equalsIgnoreOrder = (a, b) => {
          if (a.length !== b.length) return false;
          const uniqueValues = new Set([...a, ...b]);
          for (const v of uniqueValues) {
            const aCount = a.filter(e => e === v).length;
            const bCount = b.filter(e => e === v).length;
            if (aCount !== bCount) return false;
          }
          return true;
        }
      }
      catch(error){
        return false;
      }
  
      let test_correct_ans=0;
      let test_wrong_ans=0;
      let test_postive_marks=0;
      let test_negative_marks=0;
  
      for (const element of dataObj2) {
        // for getting marks 
        const marksObj = await config.sequelize.query(
          `SELECT marks,negative_mark FROM test_questions
          WHERE test_id=(SELECT test_id from user_test_attempt where user_test_attempt_id=? LIMIT 1) 
          AND question_id  = ?`,
          {
            raw: true,
            replacements: [attempt_id,element.ques_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
  
        // for checking problem type 
        if(element.problem_actual_type_id){
          const problemactualObj = await config.sequelize.query(
            `SELECT problem_type_id from problem_actual_types WHERE problem_actual_type_id=?`,
            {
              raw: true,
              replacements: [element.problem_actual_type_id],
              type: config.sequelize.QueryTypes.SELECT,
            }
          );
          element.problem_type_id=problemactualObj[0].problem_type_id
        }else{
          element.problem_type_id=0;
        }
        //############### end of checking problem type ################
        
        //############# get data from mongo anc chk answer #################
        if (element.mongodb_id) {
          const qsn = await QuestionModel.findById({
            _id: element.mongodb_id,
          }).lean();
          element.mongoData = qsn;
  
          if(element.user_que_response){
            const response = await ResponseModel.findById({
              _id: element.user_que_response,question_id:element.ques_id
            }).lean();
            
            //check answer
            if(element.problem_type_id==7){
              if(qsn.correct_options == response.correct_options)
              {
                test_correct_ans+=1;
                test_postive_marks+=parseInt(marksObj[0].marks);
              }else{
                test_wrong_ans+=1;
                test_negative_marks+=(marksObj[0].negative_mark)?parseInt(marksObj[0].negative_mark):0;
              }
            }
            else{
              if(equalsIgnoreOrder(JSON.parse(qsn.correct_options),JSON.parse(response.correct_options)))
              {
                test_correct_ans+=1;
                test_postive_marks+=parseInt(marksObj[0].marks);
              }else{
                test_wrong_ans+=1;
                test_negative_marks+=(marksObj[0].negative_mark)?parseInt(marksObj[0].negative_mark):0;
              }
            }
            
          }
          else{
            element.is_attempt=false;
          }
  
        }
      }
      //####################
  
      console.log(test_correct_ans,
        test_wrong_ans,
        test_postive_marks,
        test_negative_marks)
  
        // update marks 
  
        const updateMarksObj = await config.sequelize.query(
          `UPDATE user_test_attempt set test_correct_ans=?,test_wrong_ans=?,test_postive_marks=?,
          test_negative_marks=? 
          WHERE user_id=? AND user_test_attempt_id=?`,
          {
            raw: true,
            replacements:[test_correct_ans,
              test_wrong_ans,
              test_postive_marks,
              test_negative_marks,userId,attempt_id],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
  
        //finally submit the set set test_status =3
        const test_end_time=moment().format();
        const dataObj = await config.sequelize.query(
          `UPDATE user_test_attempt set test_status=3,test_end_time=? WHERE user_id=? 
          AND user_test_attempt_id=?`,
          {
            raw: true,
            replacements:[test_end_time,userId,attempt_id],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
        return 1;
    }
    catch(error){
      console.log("-error", error);
      return 0; 
    }
      //########################end of data calculation###############################
  
  }
module.exports = {submitTest};