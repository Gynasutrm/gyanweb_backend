const config = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const QuestionModel = require("../../../models/Question");
const ResponseModel = require("../../../models/ResponseSave");

class CommonController {
  
  async myCourse(req, res) {
    try {
      const userId=req.user.sub; //return by middleware(authenticationToken)     
      const currentDate=moment().format("YYYY-MM-DD");
      const dataObj = await config.sequelize.query(
        `SELECT SC.*,C.* FROM student_course SC, courses C WHERE user_id = ?
        AND  SC.course_id=C.course_id AND course_end_date>=?
         ORDER BY SC.student_course_id DESC`,
        {
          raw: true,
          replacements: [userId,currentDate],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      console.log(dataObj);

      return res.status(200).json({
        statusCode: 200,
        message: "My active course list!",
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
      const userId=req.user.sub; //return by middleware(authenticationToken)
      const currentDate=moment().format("YYYY-MM-DD");

      const dataObj=await config.sequelize.query(
        `Select distinct(test_type_id) from test_series where test_series_id 
        in (Select test_series_id from test_series_course where course_id 
        in(SELECT course_id FROM student_course where user_id = ? AND course_end_date>=?))`,
        {
          raw: true,
          replacements: [userId,currentDate],
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
              replacements: [test_type.test_type_id,userId],
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
        message: "My active test series list!",
        data: result,
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
      const { test_series_id } = req.body;          
      const userId=req.user.sub; //return by middleware(authenticationToken)
    
      const currentDate=moment().format("YYYY-MM-DD");
      const dataObj = await config.sequelize.query(
        `Select * from tests where test_series_id IN
        (SELECT test_series_id from test_series_course where course_id IN 
        (SELECT course_id from student_course WHERE user_id=? AND course_end_date >=?)) 
        AND test_series_id=? AND status=true AND '${currentDate}' 
        BETWEEN test_start_date AND test_end_date`,
        {
          raw: true,
          replacements: [userId,currentDate,test_series_id],
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
      for(const data of dataObj ){
        var tmp=[];
        var test_status=0;
          //for count the no of test presents in given test series
          const chkTestAttempt=await config.sequelize.query(
          `SELECT * FROM user_test_attempt WHERE user_id =? AND test_id=?`,
            {
              raw: true,
              replacements: [userId,data.test_id],
              type: config.sequelize.QueryTypes.SELECT,
            });          

          if(!chkTestAttempt.length){
            const insertStatus=await config.sequelize.query(
            `INSERT into user_test_attempt(user_id,test_id,test_status) VALUES(?,?,?)`,
              {
                raw: true,
                replacements:[userId,data.test_id,0],
                type: config.sequelize.QueryTypes.INSERT,
              });
            test_status=0;
          }
          else{
            test_status=chkTestAttempt[0].test_status;
          }
          data['test_status']=test_status;        
          result.push(data);
        }

      console.log(result);
      return res.status(200).json({
        statusCode: 200,
        message: "My active test list",
        data: result,
      });

    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async preStartTest(req,res){
    try {      
      const { test_id } = req.params;          
      const userId=req.user.sub; //return by middleware(authenticationToken)

      const dataObj = await config.sequelize.query(
        `Select * from tests where test_id=? AND test_series_id 
        in (Select test_series_id from test_series_course where course_id 
        in (SELECT course_id FROM student_course where user_id = ?))`,
        {
          raw: true,
          replacements: [test_id,userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      ); 

      if(!dataObj.length) {
        return res
        .status(200)
        .json({ statusCode: 203, message: "No test found!" });
      } 
      const startDate=dataObj[0].test_start_date;
      const endDate=dataObj[0].test_end_date;
      const currentDate=moment().format("YYYY-MM-DD");
      const currentTime=moment().format("HH:mm");
      const testTime=moment(dataObj[0].test_time, ["h:mm A"]).format("HH:mm");
      

      if(currentDate < startDate)
      {
        return res
        .status(200)
          .json({ statusCode: 203, message: "Your test not yet started!" }); 
      }
      if(currentDate > endDate){
        return res
        .status(200)
          .json({ statusCode: 203, message: "Your test has been expired!" });
      }
      if(currentDate==startDate){
        var chk=await compareTime(currentTime,testTime);
        console.log(chk);
        if(!chk){
          return res
          .status(200)
            .json({ statusCode: 203, message: "Your test not yet started! starting time is : "+ dataObj[0].test_time}); 
        }
      }

      const attemptId = await config.sequelize.query(
        `Select user_test_attempt_id,test_status from user_test_attempt where test_id=? 
        AND user_id=?`,
        {
          raw: true,
          replacements: [test_id,userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(!attemptId.length)
      {
        return res
          .status(200)
          .json({ statusCode: 203, message: "This test not for you!" });
      }

      if(attemptId[0].test_status==2){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Test already running by user!" });
      }

      // genrate new token for test 
      const token =
        JWT_TOKEN_PREFIX +
        " " +
        jwt.sign({ sub: userId,attempt_id: attemptId[0].user_test_attempt_id }, process.env.SECRET_KEY);

      return res.status(200).json({
        statusCode: 200,
        message: "Test instructions",
        data: dataObj,
        token
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async startTest(req,res){
    try {            

      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      } 

      // check test alredy start or not
      const chkTestObj = await config.sequelize.query(
        `SELECT * FROM user_test_attempt WHERE user_test_attempt_id=? 
        AND user_id=? AND test_status=0`,
        {
          raw: true,
          replacements: [attempt_id,userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(chkTestObj.length){
        //update test status to running
        const start_time=moment().format()
        const updateObj = await config.sequelize.query(
          `UPDATE user_test_attempt set test_start_time=?,test_status=2 WHERE user_test_attempt_id=?
          AND user_id=? AND test_status=0`,
          {
            raw: true,
            replacements: [start_time,attempt_id,userId],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        ); 
        //select all question of given test order by serial no asc
        const selQueObj = await config.sequelize.query(
          `SELECT TQ.*, Q.* from test_questions TQ, questions Q where 
          test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
          AND TQ.question_id=Q.question_id ORDER by serial_no`,
          {
            raw: true,
            replacements: [attempt_id,userId],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );

        // insert all question, fetching from last query with same order
        let subClQry ="INSERT INTO user_test_response (user_test_attempt_id,ques_id, question_status) VALUES ";
        for(const data of selQueObj){
            subClQry += `(${attempt_id},${data.question_id},0),`;                
        }
        subClQry = subClQry.slice(0, -1);
        await config.sequelize.query(subClQry, {
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        });
      }//end of if 

      // check test pause or not
      const chkTestObj2 = await config.sequelize.query(
        `SELECT * FROM user_test_attempt WHERE user_test_attempt_id=? 
        AND user_id=? AND test_status=1`,
        {
          raw: true,
          replacements: [attempt_id,userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if(chkTestObj2.length){
        //set status to running if pause
        const updateObj = await config.sequelize.query(
          `UPDATE user_test_attempt set test_status=2 WHERE user_test_attempt_id=?
          AND user_id=? AND test_status=1`,
          {
            raw: true,
            replacements: [attempt_id,userId],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        ); 
      }

      const index_id=1;

      // chk question exixts or not 
      const selQueObj = await config.sequelize.query(
        `SELECT * from test_questions WHERE 
        test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
        AND serial_no=?`,
        {
          raw: true,
          replacements: [attempt_id,userId,index_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(!selQueObj.length){
        return res
         .status(200)
         .json({ statusCode: 203, message: "No question found in given test!" }); 
       }
      const ques_id=selQueObj[0].question_id;
      const finalOutput=await questionStatus(attempt_id,userId,index_id,ques_id);
      
      return res.status(200).json({
        statusCode: 200,
        message: "Start test",
        data: finalOutput,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async questionIndex(req, res) {
    try {
      const{index_id}=req.params;
      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      }          
      //for checking given question index exists or not
      const selQueObj = await config.sequelize.query(
          `SELECT * from test_questions WHERE 
          test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
          AND serial_no=?`,
          {
            raw: true,
            replacements: [attempt_id,userId,index_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
      if(!selQueObj.length){
       return res
        .status(200)
        .json({ statusCode: 203, message: "No question found of given id!" }); 
      }

      // if comes first time visit set question status=1
        const tmp = await config.sequelize.query(
          `UPDATE user_test_response set question_status=1
          WHERE question_status=0 AND ques_id = (SELECT question_id from test_questions WHERE test_id 
          IN (SELECT test_id from user_test_attempt WHERE user_id=? AND user_test_attempt_id=?) 
          AND serial_no=? LIMIT 1) AND user_test_attempt_id=?`,
          {
            raw: true,
            replacements:[userId,attempt_id,index_id,attempt_id],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
      // end if comes first time visit set question status=1    

      const ques_id=selQueObj[0].question_id;
      const finalOutput=await questionStatus(attempt_id,userId,index_id,ques_id);

      // console.log(finalOutput);
      return res.status(200).json({
        statusCode: 200,
        message: "Question",
        data: finalOutput,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async questionSave(req, res) {
    try {
      const {index_id,ques_response}=req.body;

      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      } 
      //for checking given question index exists or not
      const selQueObj = await config.sequelize.query(
          `SELECT * from test_questions WHERE 
          test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
          AND serial_no=?`,
          {
            raw: true,
            replacements: [attempt_id,userId,index_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
      if(!selQueObj.length){
       return res
        .status(200)
        .json({ statusCode: 203, message: "No question found of given id!" }); 
      }

       //check if already updated response with status =3
      const chkAlradySubmitObj = await config.sequelize.query(
        `SELECT * FROM user_test_response WHERE question_status=3
        AND ques_id = ? AND user_test_attempt_id=?`,
        {
          raw: true,
          replacements:[selQueObj[0].question_id,attempt_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(chkAlradySubmitObj.length){
        await ResponseModel.findOneAndUpdate({_id: chkAlradySubmitObj[0].user_que_response }, 
          { $set: { 'correct_options': ques_response } }, 
          { new: true }, function(err, doc) {
            if(err){
              console.log("Error while updating response");
              return res.status(200).json({
                statusCode: 200,
                message: "Error while saving response!",
              })
            }
            });
      }
      else{
      // add save response to mongodb
        const question_id = selQueObj[0].question_id;      
        const obj = new ResponseModel();
        obj.question_id = question_id;
        obj.correct_options = ques_response;
        const resultObj = await obj.save();//it will return the insert object

        const dataObj = await config.sequelize.query(
          `UPDATE user_test_response set question_status=3,user_que_response = '${resultObj._id}'
          WHERE ques_id = ? AND user_test_attempt_id=?`,
          {
            raw: true,
            replacements:[selQueObj[0].question_id,attempt_id],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
      }
    // end of updating

    const ques_id=selQueObj[0].question_id;
    const finalOutput=await questionStatus(attempt_id,userId,index_id,ques_id);
    return res.status(200).json({
      statusCode: 200,
      message: "save response successfully!",
      data: finalOutput,
    });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async questionSaveNext(req, res) {
    try {
      const {index_id,ques_response}=req.body;
      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      } 
      
      //for checking given question index exists or not
      const selQueObj = await config.sequelize.query(
          `SELECT * from test_questions WHERE 
          test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
          AND serial_no=?`,
          {
            raw: true,
            replacements: [attempt_id,userId,index_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
      if(!selQueObj.length){
       return res
        .status(200)
        .json({ statusCode: 203, message: "No question found of given id!" }); 
      }

      //check if already updated response with status =3
      const chkAlradySubmitObj = await config.sequelize.query(
        `SELECT * FROM user_test_response WHERE question_status=3
        AND ques_id = ? AND user_test_attempt_id=?`,
        {
          raw: true,
          replacements:[selQueObj[0].question_id,attempt_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(chkAlradySubmitObj.length){
        await ResponseModel.findOneAndUpdate({_id: chkAlradySubmitObj[0].user_que_response }, 
          { $set: { 'correct_options': ques_response } }, 
          { new: true }, function(err, doc) {
            if(err){
              console.log("Error while updating response");
              return res.status(200).json({
                statusCode: 200,
                message: "Error while saving response!",
              })
            }
            });
      }
      else{
      // add save response to mongodb
        const question_id = selQueObj[0].question_id;      
        const obj = new ResponseModel();
        obj.question_id = question_id;
        obj.correct_options = ques_response;
        const resultObj = await obj.save();//it will return the insert object

        const dataObj = await config.sequelize.query(
          `UPDATE user_test_response set question_status=3,user_que_response = '${resultObj._id}'
          WHERE ques_id = ? AND user_test_attempt_id=?`,
          {
            raw: true,
            replacements:[selQueObj[0].question_id,attempt_id],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
      }
    // end of updating

      // const dataObj = await config.sequelize.query(
      //   `UPDATE user_test_response set question_status=3, user_que_response=?
      //   WHERE ques_id = (SELECT question_id from test_questions WHERE test_id 
      //   IN (SELECT test_id from user_test_attempt WHERE user_id=? AND user_test_attempt_id=?) 
      //   AND serial_no=? LIMIT 1)`,
      //   {
      //     raw: true,
      //     replacements:[ques_response,userId,attempt_id,index_id],
      //     type: config.sequelize.QueryTypes.UPDATE,
      //   }
      // );

      //for checking given next question index exists or not
      const selQueObj2 = await config.sequelize.query(
          `SELECT * from test_questions WHERE 
          test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
          AND serial_no=?`,
          {
            raw: true,
            replacements: [attempt_id,userId,index_id+1],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
      if(!selQueObj2.length){
       return res
        .status(200)
        .json({ statusCode: 203, message: "Question save , no next question found!" }); 
      }

      // if comes first time visit set question status=1
        const tmp = await config.sequelize.query(
          `UPDATE user_test_response set question_status=1
          WHERE question_status=0 AND ques_id = (SELECT question_id from test_questions WHERE test_id 
          IN (SELECT test_id from user_test_attempt WHERE user_id=? AND user_test_attempt_id=?) 
          AND serial_no=? LIMIT 1) AND user_test_attempt_id=?`,
          {
            raw: true,
            replacements:[userId,attempt_id,index_id,attempt_id],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
      // end if comes first time visit set question status=1

      const ques_id=selQueObj2[0].question_id;
      const finalOutput=await questionStatus(attempt_id,userId,index_id+1,ques_id);

      console.log(finalOutput);
      
      return res.status(200).json({
        statusCode: 200,
        message: "save response successfully!, next question - ",
        data: finalOutput,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async markForReview(req, res) {
    try {
      const {index_id}=req.body;
      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      } 
      //for checking given question index exists or not
      const selQueObj = await config.sequelize.query(
          `SELECT * from test_questions WHERE 
          test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
          AND serial_no=?`,
          {
            raw: true,
            replacements: [attempt_id,userId,index_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
      if(!selQueObj.length){
       return res
        .status(200)
        .json({ statusCode: 203, message: "No question found of given id!" }); 
      }

      const dataObj = await config.sequelize.query(
        `UPDATE user_test_response set question_status=2
        WHERE ques_id = (SELECT question_id from test_questions WHERE test_id 
        IN (SELECT test_id from user_test_attempt WHERE user_id=? AND user_test_attempt_id=?) 
        AND serial_no=? LIMIT 1)`,
        {
          raw: true,
          replacements:[userId,attempt_id,index_id],
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      const ques_id=selQueObj[0].question_id;
      const finalOutput=await questionStatus(attempt_id,userId,index_id,ques_id);

      return res.status(200).json({
        statusCode: 200,
        message: "save response successfully!",
        data: finalOutput,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async responseClear(req, res) {
    try {
      const {index_id}=req.body;
      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      } 

      //for checking given question index exists or not
      const selQueObj = await config.sequelize.query(
          `SELECT * from test_questions WHERE 
          test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
          AND serial_no=?`,
          {
            raw: true,
            replacements: [attempt_id,userId,index_id],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
      if(!selQueObj.length){
       return res
        .status(200)
        .json({ statusCode: 203, message: "No question found of given id!" }); 
      }

       //check if already updated response with status =3
      const chkAlradySubmitObj = await config.sequelize.query(
        `SELECT * FROM user_test_response WHERE question_status=3
        AND ques_id = ? AND user_test_attempt_id=?`,
        {
          raw: true,
          replacements:[selQueObj[0].question_id,attempt_id],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      var chk=0;
      if(chkAlradySubmitObj.length){
        // delete response from mongodb 
        var myquery = {_id: chkAlradySubmitObj[0].user_que_response };
        await ResponseModel.deleteOne(myquery, function(err, obj) {
          if (err) {
            console.log("Error while clear response!");
          }
          else{
            chk=1;
          }
        });
      }
      
      // clear response from main db 
      if(chk){
        const dataObj = await config.sequelize.query(
          `UPDATE user_test_response set question_status=1,user_que_response = ''
          WHERE ques_id = ? AND user_test_attempt_id=?`,
          {
            raw: true,
            replacements:[selQueObj[0].question_id,attempt_id],
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
      }

      const ques_id=selQueObj[0].question_id;
      const finalOutput=await questionStatus(attempt_id,userId,index_id,ques_id);

      return res.status(200).json({
        statusCode: 200,
        message: "Response clear successfully!",
        data:finalOutput
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async submitTest(req, res) {
    try {
      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;
      // console.log(userId);

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      }
      //check is already submit
      const checkObj = await config.sequelize.query(
        `SELECT * FROM user_test_attempt WHERE user_id=? AND user_test_attempt_id=? AND test_status=3`,
        {
          raw: true,
          replacements:[userId,attempt_id],
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      // console.log(checkObj);
      if(checkObj[0].length){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Test is already submit!" });
      }

      //submit the set set test_status =3
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
      //########################end of data calculation###############################


      return res.status(200).json({
        statusCode: 200,
        message: "Your test is successfully submit!",
        // data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  } 

  async pauseTest(req, res) {
    try {
      const userId=req.user.sub; //return by middleware(authenticationToken)
      const attempt_id=req.user.attempt_id;

      if(attempt_id==undefined){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Token is not valid!" }); 
      } 

      //submit the set set test_status =1 for pause test
      const dataObj = await config.sequelize.query(
        `UPDATE user_test_attempt set test_status=1 WHERE user_id=? 
        AND user_test_attempt_id=?`,
        {
          raw: true,
          replacements:[userId,attempt_id],
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
       
      return res.status(200).json({
        statusCode: 200,
        message: "Your test is pause! can be start leter!",
        // data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  } 

  async resumeTest(req, res) {
    try {
      const { test_id } = req.params;          
      const userId=req.user.sub; //return by middleware(authenticationToken)         

      const dataObj = await config.sequelize.query(
        `Select test_instruction,test_id from tests where test_id=? AND test_series_id 
        in (Select test_series_id from test_series_course where course_id 
        in (SELECT course_id FROM student_course where user_id = ?))`,
        {
          raw: true,
          replacements: [test_id,userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      ); 

      if(!dataObj.length) {
        return res
        .status(200)
        .json({ statusCode: 203, message: "No test found!" });
      } 

      const attemptId = await config.sequelize.query(
        `Select user_test_attempt_id from user_test_attempt where test_id=? AND user_id=?`,
        {
          raw: true,
          replacements: [test_id,userId],
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

       //check is already submit
      const checkObj = await config.sequelize.query(
        `SELECT * FROM user_test_attempt WHERE user_id=? AND user_test_attempt_id=? AND test_status=3`,
        {
          raw: true,
          replacements:[userId,attemptId[0].user_test_attempt_id],
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      if(checkObj[0].length){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Test is already submit!" });
      } 

      // console.log(attemptId[0].user_test_attempt_id);
      // genrate new token for test 
      const token =
        JWT_TOKEN_PREFIX +
        " " +
        jwt.sign({ sub: userId,attempt_id: attemptId[0].user_test_attempt_id }, process.env.SECRET_KEY);
      
      //submit the set set test_status =1 for pause test
      const dataObj2 = await config.sequelize.query(
        `UPDATE user_test_attempt set test_status=2 WHERE user_id=? AND user_test_attempt_id=? AND test_status=1`,
        {
          raw: true,
          replacements:[userId,attemptId[0].user_test_attempt_id],
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
       
      return res.status(200).json({
        statusCode: 200,
        message: "Your test is started agian! best of luck!",
        token
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
  
  async streamList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM streams WHERE is_deleted = false ORDER BY stream_name`,
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
  
  async classList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT * FROM classes WHERE is_deleted = false ORDER BY class_name`,
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

  async pathshalaList(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT ua.user_id as school_id, ua.full_name as school_name FROM user_accounts ua, school_registration sr WHERE user_type_id=3 AND ua.user_id=sr.user_id  ORDER by full_name`,
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

}//end of class

async function compareTime(current,test){
  if(current === test){
    return 1;
  }
  var time1 = current.split(':');
  var time2 = test.split(':');

  if(eval(time1[0]) > eval(time2[0])){
      return 1;
  } else if(eval(time1[0]) == eval(time2[0]) && eval(time1[1]) > eval(time2[1])) {
      return 1;
  } else {
      return 0;
  }
  
}
// checking question status, status count , question details
async function questionStatus(attempt_id,userId,index,ques_id){

  const selQueStatusObj = await config.sequelize.query(
    `SELECT question_status from user_test_response WHERE user_test_attempt_id=? ORDER BY response_id`,
    {
      raw: true,
      replacements: [attempt_id],
      type: config.sequelize.QueryTypes.SELECT,
    }
  );

  var question_list=[];
  var i=1;      
  for(const data of selQueStatusObj){
        var tmp=[];            
        tmp={"index":i,"status":data.question_status}
        question_list.push(tmp);
        i=i+1;
    }

  // status vise count
  const selQueStatusCountObj = await config.sequelize.query(
    `SELECT count(*),question_status from user_test_response WHERE user_test_attempt_id=? GROUP BY question_status`,
    {
      raw: true,
      replacements: [attempt_id],
      type: config.sequelize.QueryTypes.SELECT,
    }
  );
  // question to be display bases on index
  const selQueDisplayObj = await config.sequelize.query(
      `SELECT TQ.*, Q.* from test_questions TQ, questions Q where 
      test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
      AND TQ.question_id=Q.question_id AND TQ.serial_no=? LIMIT 1`,
      {
        raw: true,
        replacements: [attempt_id,userId,index],
        type: config.sequelize.QueryTypes.SELECT,
      }
    );
  tmp={};
  for (const element of selQueDisplayObj) {
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

    if (element.mongodb_id) {
      const qsn = await QuestionModel.findById({
        _id: element.mongodb_id,
      }).lean();
      // element.mongoData = qsn;
      element.problem_description=qsn.problem_description;

      if(element.problem_type_id==7)
        element.multiple_options='';
      else
        element.multiple_options=qsn.multiple_options;
        

    }
  }
  // end question to be display bases on index

  //for checking last index
  const selQueObj = await config.sequelize.query(
    `SELECT serial_no from test_questions WHERE 
    test_id IN(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? AND user_id=?)
    AND serial_no is NOT null
    ORDER BY serial_no DESC LIMIT 1`,
      {
        raw: true,
        replacements: [attempt_id,userId,],
        type: config.sequelize.QueryTypes.SELECT,
      }
    );

  var is_last_question=0;
  if(index==selQueObj[0].serial_no){
    is_last_question=1;
  }
  // if already answred
  const selAlreadQueObj = await config.sequelize.query(
    `SELECT user_que_response from user_test_response WHERE ques_id=? 
    AND user_test_attempt_id=? AND question_status=3 `,
    {
      raw: true,
      replacements: [ques_id,attempt_id],
      type: config.sequelize.QueryTypes.SELECT,
    }
  );
  console.log("----------",selAlreadQueObj);
  var is_already_save=[];
  if(selAlreadQueObj.length){        
    let result = await ResponseModel.find({_id: selAlreadQueObj[0].user_que_response}).select('question_id correct_options')
    is_already_save=result;
  }
  // end of already answred
        
  const finalOutput={"totalquestions":question_list,
  "questions_status":selQueStatusCountObj,
  "question":selQueDisplayObj,
  "is_already_save":is_already_save,
  "is_last_question":is_last_question,
  "index_id":parseInt(index)
  } 

  return finalOutput;
}

 
module.exports = new CommonController();
