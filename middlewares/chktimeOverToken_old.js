const jwt = require('jsonwebtoken');
const config = require("../config/connection");
const moment = require("moment");

async function chkTimeOverToken(req, res, next)
{
  const userId=req.user.sub; //get from authenticateion token
  const attempt_id=req.user.attempt_id;
  console.log(userId,attempt_id);
  if(attempt_id==undefined){
    return res
    .status(200)
    .json({ statusCode: 203, message: "Token is not valid!" }); 
  }

   // check if test is already submit
   const chkTestSubmitObj = await config.sequelize.query(
    `SELECT * FROM user_test_attempt WHERE user_test_attempt_id=? AND user_id=?`,
    {
        raw: true,
        replacements: [attempt_id,userId],
        type: config.sequelize.QueryTypes.SELECT,
      }
    );
    console.log(chkTestSubmitObj);
    if(!chkTestSubmitObj.length){
      return res
      .status(200)
      .json({ statusCode: 203, message: "No test found!" });
    }
    
    if(chkTestSubmitObj[0].test_status==3){
      return res
      .status(200)
      .json({ statusCode: 203, message: "Test is already submit!" });
    }
    

  const chkTimer = await config.sequelize.query(
      `SELECT UTA.test_start_time,UTA.test_status,T.test_duration from user_test_attempt UTA,tests T 
      WHERE UTA.user_test_attempt_id=? AND UTA.user_id=? 
      AND T.test_id=(SELECT test_id from user_test_attempt WHERE user_test_attempt_id=? LIMIT 1)`,
      {
        raw: true,
        replacements: [attempt_id,userId,attempt_id],
        type: config.sequelize.QueryTypes.SELECT,
      }
    );  
  var test_start_time=moment(chkTimer[0].test_start_time);
  var current_time=moment(moment().format());

  var countdowm_minuts = parseInt(current_time.diff(test_start_time, 'minutes'));            
  var test_duration=chkTimer[0].test_duration;
  var msg="Your time is over! Please submit your test.";
  if(countdowm_minuts>test_duration){
    return res
        .status(200)
        .json({ statusCode: 203, message: msg });
  }
  next();
}
module.exports = chkTimeOverToken