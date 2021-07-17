const config = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const QuestionModel = require("../../../models/Question");
const ResponseModel = require("../../../models/ResponseSave");

class ResponseController {
  
  async testResponse(req, res) {
    try {
      const {test_id}=req.body;
      const userId=req.user.sub; //return by middleware(authenticationToken)  
      
      const dataObj = await config.sequelize.query(
        `SELECT UTA.*,T.* from user_test_attempt UTA, tests T WHERE UTA.test_id=T.test_id AND UTA.user_id = ? AND UTA.test_id=?`,
        {
          raw: true,
          replacements: [userId,test_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      // console.log(userId,test_id,dataObj);  
      if(!dataObj.length){
        return res.status(200).json({
          statusCode: 203,
          message: "No test found!"
        });
      }
      if(dataObj[0].test_status!=3){
        return res.status(200).json({
          statusCode: 203,
          message: "Test not completed!"
        });
      }
      const test_end_date=dataObj[0].test_end_date;
      const today_date=moment().format("YYYY-MM-DD");
      // console.log(today_date,test_end_date);//26 25

      if( test_end_date >= today_date){
        return res.status(200).json({
          statusCode: 203,
          message: "Test is still live! You cann't see the response util test is complete"
        });
      }
      
      const attempt_id=dataObj[0].user_test_attempt_id;
      const dataObj2 = await config.sequelize.query(
        `SELECT UTR.*,Q.* FROM user_test_response UTR, questions Q 
        WHERE UTR.ques_id=Q.question_id AND UTR.user_test_attempt_id  = ? order by response_id`,
        {
          raw: true,
          replacements: [attempt_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      var attempt_ques=0;
      var non_attempt_ques=0;

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

      var serial_no=0;
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
        serial_no+=1;
        element.serial_no=serial_no;

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
        
        if (element.mongodb_id) {
          const qsn = await QuestionModel.findById({
            _id: element.mongodb_id,
          }).lean();
          element.mongoData = qsn;

          if(element.user_que_response){
            element.is_attempt=true;
            attempt_ques+=1;
            const response = await ResponseModel.findById({
              _id: element.user_que_response,question_id:element.ques_id
            }).lean();
            // console.log(qsn.correct_options,response.correct_options)
            element.user_response=response.correct_options;

            // ############### option check ################33
            if(element.problem_type_id==7){
              if(qsn.correct_options == response.correct_options)
              {
                element.test_postive_marks=parseInt(marksObj[0].marks);
              }else{
                element.test_negative_marks=(marksObj[0].negative_mark)?parseInt(marksObj[0].negative_mark):0;
              }
            }
            else{
              element.is_correct=equalsIgnoreOrder(JSON.parse(qsn.correct_options),JSON.parse(response.correct_options));
              if(element.is_correct){
                element.test_postive_marks=parseInt(marksObj[0].marks);
              }
              else{
                element.test_negative_marks=(marksObj[0].negative_mark)?parseInt(marksObj[0].negative_mark):0;
              }
            }
            //######### end of option check #################

          }
          else{
            element.is_attempt=false;
            non_attempt_ques+=1;
          }

        }
      }
      const test_correct_ans=dataObj[0].test_correct_ans;
      const test_wrong_ans=dataObj[0].test_wrong_ans;
      const test_postive_marks=dataObj[0].test_postive_marks;
      const test_negative_marks=dataObj[0].test_negative_marks;
      const total_marks=dataObj[0].test_total_marks;
      const test_passing_marks=dataObj[0].test_passing_marks;
      const test_total_questions=dataObj[0].test_total_question;

      const otherdata={"attempt_ques":attempt_ques,"non_attempt_ques":non_attempt_ques,
                      "test_correct_ans":test_correct_ans,"test_wrong_ans":test_wrong_ans, 
                      "total_marks":total_marks,"test_positive_marks":test_postive_marks,
                    "test_negative_marks":test_negative_marks,"test_passing_marks":test_passing_marks,
                  "test_total_questions":test_total_questions}

      return res.status(200).json({
        statusCode: 200,
        message: "User test response!",
        data: dataObj2,
        otherdata:otherdata
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

}//end of class
 
module.exports = new ResponseController();
