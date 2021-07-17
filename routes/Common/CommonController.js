const config = require("../../config/connection");
const moment = require("moment");
const QuestionModel = require("../../models/Question");
const ResponseModel = require("../../models/ResponseSave");

class CommonController {
  async getProbDifflist(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM problem_defficulties ORDER BY problem_difficulty_name`,
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

  async getProbTypelist(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM problem_type_mapping ORDER BY problem_type_name`,
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

  async myCourse(req, res) {
    try {
      const { userId } = req.body;

      const dataObj = await config.sequelize.query(
        `SELECT * FROM student_courses WHERE student_id = ? ORDER BY student_course_id DESC`,
        {
          raw: true,
          replacements: [userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      for (const course of dataObj) {
        const courseObj = await config.sequelize.query(
          `SELECT * FROM course_tests WHERE course_id = ? ORDER BY student_course_id DESC`,
          {
            raw: true,
            replacements: [course.course_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
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

  async myCourse(req, res) {
    try {
      const { userId } = req.body;

      const dataObj = await config.sequelize.query(
        `SELECT * FROM student_courses WHERE student_id = ? ORDER BY student_course_id DESC`,
        {
          raw: true,
          replacements: [userId],
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

  async myTestSeries(req, res) {
    try {
      const { course_id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT UTS.*, TS.* FROM student_test_series UTS, test_series TS WHERE UTS.test_series_id = TS.test_series_id AND UTS.course_id = ? ORDER BY UTS.student_test_series_id DESC`,
        {
          raw: true,
          replacements: [course_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "student_test_series list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async myTests(req, res) {
    try {
      const { test_series_id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT ST.*, T.* FROM student_tests ST,tests T WHERE ST.test_id = T.test_id AND ST.test_series_id = ? ORDER BY ST.student_test_id DESC`,
        {
          raw: true,
          replacements: [test_series_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "student_test list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async stateList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT state_id, state_name FROM states ORDER BY state_name`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "state list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async cityList(req, res) {
    try {
      const { state_id } = req.params;

      if(state_id==null || state_id=="null"){
        return res.status(200).json({
          statusCode: 203,
          message: "city list",
          data: [],
        });
      }
      const dataObj = await config.sequelize.query(
        `SELECT city_id, city_name FROM cities WHERE state_id = ? ORDER BY city_name`,
        {
          raw: true,
          replacements: [state_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "city list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async userTypeList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT user_type_id, user_type_name FROM user_types ORDER BY user_type_name`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "user type list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

 async pathshalaList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT UA.user_id,SR.school_name FROM user_accounts UA, school_registration SR WHERE SR.user_id=UA.user_id`,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
	if (!dataObj.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "No Pathshala Found!" });
      }
	  
      return res.status(200).json({
        statusCode: 200,
        message: "Pathshala list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }
  
async courseByCategoryList(req, res) {
    try {
	const { category_id } = req.params;
      const dataObj = await config.sequelize.query(
	`SELECT C.*, CC.course_category_name, S.stream_name FROM courses AS C,course_categories AS CC,streams AS S WHERE C.course_category_id = ? AND C.course_category_id = CC.course_category_id AND C.stream_id = S.stream_id AND C.is_deleted = false`,
        {
          raw: true,
	  replacements: [category_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
	if (!dataObj.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "No Category Found" });
      }
      return res.status(200).json({
        statusCode: 200,
        message: "courses by category",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async userActiveCourse(req, res) {
    try {
      const {user_id}=req.body; //return by middleware(authenticationToken)     
      const currentDate=moment().format("YYYY-MM-DD");
      const dataObj = await config.sequelize.query(
        `SELECT SC.*,C.* FROM student_course SC, courses C WHERE user_id = ?
        AND  SC.course_id=C.course_id AND course_end_date>=?
         ORDER BY SC.student_course_id DESC`,
        {
          raw: true,
          replacements: [user_id,currentDate],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      console.log(dataObj);

      return res.status(200).json({
        statusCode: 200,
        message: "User active courses list!",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async userActiveTestSeries(req, res) {
    try {          
      const {user_id}=req.body; //return by middleware(authenticationToken)
      const currentDate=moment().format("YYYY-MM-DD");

      const dataObj=await config.sequelize.query(
        `Select distinct(test_type_id) from test_series where test_series_id 
        in (Select test_series_id from test_series_course where course_id 
        in(SELECT course_id FROM student_course where user_id = ? AND course_end_date>=?))`,
        {
          raw: true,
          replacements: [user_id,currentDate],
          type: config.sequelize.QueryTypes.SELECT,
        });

      // console.log("-------------------",dataObj);
      var result = [];
      for (const test_type of dataObj) {        
        const seriesObj = await config.sequelize.query(
          `SELECT * FROM test_series WHERE test_type_id = ? AND test_series_id 
          in (Select test_series_id from test_series_course where course_id 
          in(SELECT course_id FROM student_course where user_id = ?))`,
            {
              raw: true,
              replacements: [test_type.test_type_id,user_id],
              type: config.sequelize.QueryTypes.SELECT,
            }            
        );
        var tmp=[]

        for(const data of seriesObj ){
          //for count the no of test presents in given test series
          const countTestSeries=await config.sequelize.query(
          `SELECT count(*) as count FROM tests WHERE test_series_id =?`,
            {
              raw: true,
              replacements: [data.test_series_id],
              type: config.sequelize.QueryTypes.SELECT,
            }
          );
          tmp.push({'test_series_id': data.test_series_id, 'test_series_name': data.test_series_name,'test_count':countTestSeries[0].count});          
        }//end of innter for loop

        // for getting the test type name
        const testTypeName=await config.sequelize.query(
          `SELECT test_type_name FROM test_types WHERE test_type_id =?`,
            {
              raw: true,
              replacements: [test_type.test_type_id],
              type: config.sequelize.QueryTypes.SELECT,
            }
          );

        var tmp2=[];
        tmp2={"test_type_name":testTypeName[0].test_type_name,"test_series_data":tmp};
        result.push(tmp2);
            
      } //end of outer for loop
      console.log(JSON.stringify(result));
      return res.status(200).json({
        statusCode: 200,
        message: "user active test series list!",
        data: result,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async userTests(req, res) {
    try {      
      const { user_id,test_series_id } = req.body;          

      const currentDate=moment().format("YYYY-MM-DD");
      const dataObj = await config.sequelize.query(
        `Select * from tests where test_series_id IN
        (SELECT test_series_id from test_series_course where course_id IN 
        (SELECT course_id from student_course WHERE user_id=? AND course_end_date >=?)) 
        AND test_series_id=? AND status=true AND '${currentDate}' 
        BETWEEN test_start_date AND test_end_date`,
        {
          raw: true,
          replacements: [user_id,currentDate,test_series_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(!dataObj.length){
        return res.status(200).json({
          statusCode: 200,
          message: "No active test found!",
        });
      }

      var result=[];
      var attemptedTest=[]
      var nonattemptedTest=[]
      for(const data of dataObj ){
        var tmp=[];
          //for count the no of test presents in given test series
        const chkTestAttempt=await config.sequelize.query(
        `SELECT * FROM user_test_attempt WHERE user_id =? AND test_id=?`,
          {
            raw: true,
            replacements: [user_id,data.test_id],
            type: config.sequelize.QueryTypes.SELECT,
          });   
          data['test_status']=chkTestAttempt[0].test_status; 
          if(chkTestAttempt[0].test_status==0) 
          {
            nonattemptedTest.push(data)
          } 
          else{
            attemptedTest.push(data);
          }                               
        }

        const finalOutput={"attempted_test":attemptedTest,"non_attempted_tes":nonattemptedTest}

      console.log(result);
      return res.status(200).json({
        statusCode: 200,
        message: "User active test list",
        data: finalOutput,
      });

    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async userTestResponse(req, res) {
    try {
      const {test_id,user_id}=req.body; 
      
      const dataObj = await config.sequelize.query(
        `SELECT UTA.*,T.* from user_test_attempt UTA, tests T WHERE UTA.test_id=T.test_id AND UTA.user_id = ? AND UTA.test_id=?`,
        {
          raw: true,
          replacements: [user_id,test_id],
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

}

module.exports = new CommonController();
