let referralCodeGenerator = require('referral-code-generator')
const config = require("../../../config/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const moment = require("moment");
var http = require("https");

const saltRounds = 10;
const ACCOUNT_VERIFIED_EMAIL=true;

// email settings
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'noreply@gyansutrm.com',
    pass: 'GyanReply@123'
  }
});

class AuthController {
  // for user login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const checkUser = await config.sequelize.query(
        `SELECT * FROM user_accounts WHERE email = ?`,
        {
          replacements: [email],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (checkUser.length) {
        if (!bcrypt.compareSync(password, checkUser[0].password)) {
          return res
            .status(200)
            .json({ statusCode: 203, message: "Invalid login details." });
        }
      } else {
        return res.status(200).json({
          statusCode: 203,
          message: "Email not match in system.",
        });
      }
      const id=checkUser[0].user_id;
      const mobile=checkUser[0].mobile;
      const name=checkUser[0].full_name;

      if(!checkUser[0].verified)
      {
        //send otp again if not verified
        const getOTP = await generateOtp();        
        await sendotpMobileAndEmail(getOTP,email,mobile,id,name);

        return res.status(200).json({
          statusCode: 203,
          message: "User is not verified yet. Please verified your account with given OTP!",
          user_id:id
        });
      }
              
      const token =
      JWT_TOKEN_PREFIX +
      " " +
      jwt.sign({ sub: id }, process.env.SECRET_KEY);

      //check if user already login
      if(checkUser[0].is_login){
        return res
        .status(200)
        .json({ statusCode: 203, message: "User is already login with this email id and passowrd!",token });
      }

      var ip = (req.headers['x-forwarded-for'] || '')   
          .split(',').pop().trim() ||
          req.connection.remoteAddress||                    
          req.socket.remoteAddress ||  
          req.connection.socket.remoteAddress;
      console.log(ip);
      const currentLoginTime=moment().format();

      //update data in login table
      const updateUser = await config.sequelize.query(
        `UPDATE user_accounts set is_login=True,login_ip_address=?,last_login_at=?,login_token=?
         WHERE user_id = ?`,
        {
          replacements: [ip,currentLoginTime,token,id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      
      return res.status(200).json({
        statusCode: 200,
        message: "User logedin",
        data: 1,
        token,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async dashboard(req, res) {
    try {
    
      const id=req.user.sub;//call middleware token
      const getUserObj = await config.sequelize.query(
        `SELECT user_type_id FROM user_accounts WHERE user_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      
      const user_type_id=getUserObj[0].user_type_id;
      let qry = "";

      if (user_type_id == 1) {
        qry = `SELECT UA.*, SP.*,SR.school_name,  S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name FROM user_accounts UA
        LEFT JOIN states ST ON ST.state_id = UA.state_id 
        LEFT JOIN cities CT ON CT.city_id = UA.city_id
        , student_profiles SP 
        LEFT JOIN streams S ON S.stream_id = SP.stream_id 
        LEFT JOIN classes C ON C.class_id = SP.class_id 
        LEFT JOIN states SST ON SST.state_id = SP.school_state_id 
        LEFT JOIN cities CCT ON CCT.city_id = SP.school_city_id
        LEFT JOIN  school_registration SR ON SR.user_id=SP.school_id
        WHERE SP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 2) {
        qry = `SELECT UA.*, ESP.*,S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name  FROM user_accounts UA
        LEFT JOIN states ST ON ST.state_id = UA.state_id 
        LEFT JOIN cities CT ON CT.city_id = UA.city_id 
        , egyan_student_profiles ESP
        LEFT JOIN streams S ON S.stream_id = ESP.stream_id 
        LEFT JOIN classes C ON C.class_id = ESP.class_id 
        LEFT JOIN states SST ON SST.state_id = ESP.school_state_id 
        LEFT JOIN cities CCT ON CCT.city_id = ESP.school_city_id 
        WHERE ESP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 3) {
        qry = `SELECT UA.*, S.* ,
        SST.state_name AS school_state_name, CCT.city_name AS school_city_name
        FROM school_registration S ,user_accounts UA
        LEFT JOIN states SST ON SST.state_id = UA.state_id 
        LEFT JOIN cities CCT ON CCT.city_id = UA.city_id 
        WHERE 
        S.user_id = UA.user_id 
        AND UA.user_id = ? 
        AND UA.is_deleted = false`;
      } else if (user_type_id == 4) {
        qry = `SELECT UA.*, E.* FROM user_accounts UA, educators E WHERE E.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 5) {
        qry = `SELECT UA.*, SP.* FROM user_accounts UA, student_parents SP WHERE SP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      }

      const profileObj = await config.sequelize.query(qry, {
        replacements: [id],
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });

        const currentDate=moment().format("YYYY-MM-DD");
        const actCourseObj = await config.sequelize.query(
          `SELECT SC.*,C.*,S.stream_name,CC.course_category_name FROM student_course SC, courses C 
          LEFT JOIN streams S ON S.stream_id = C.stream_id
          LEFT JOIN course_categories CC ON CC.course_category_id = C.course_category_id
          WHERE SC.user_id = ?
          AND  SC.course_id=C.course_id AND course_end_date>=?
          ORDER BY SC.student_course_id DESC`,
          {
            raw: true,
            replacements: [id ,currentDate],
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
        delete profileObj[0].password;//for deleting particualr field from data
        delete profileObj[0].login_token;

        var notification_data=[];
        var event=[];
        var profile_completed="85%";
        var performance={"best_subject":"Maths","best_topic":"calculation","poor_subject":"English","poor_topic":"Lictacure"}
        const finalData={"profile_data":profileObj[0],"active_course":actCourseObj,
        "profile_completed":profile_completed,"events":event,"notification_data":notification_data,
        "performance":performance}
      
      return res.status(200).json({
        statusCode: 200,
        message: "User dashboard",
        data: finalData,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  // for user registraion
  async register(req, res) {
    let lastInsertedId = "";
    try {
      const {
        user_type_id,
        enrollment_id,
        school_id,
        full_name,
        email,
        mobile,
        state_id,
        city_id,
        confirm_password,
      } = req.body;
      let { password } = req.body;
      if(mobile.length!=10){
        return res.status(200).json({
          statusCode: 203,
          message: "Mobile no should be 10 digit!",
          data: {},
        });
      }

      if (password != confirm_password) {
        return res.status(200).json({
          statusCode: 203,
          message: "Password not matched",
          data: {},
        });
      }
      const chkUser = await config.sequelize.query(
        `SELECT user_id,email,mobile FROM user_accounts WHERE email = ?`,
        {
          replacements: [email],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (chkUser.length) {
        const getOTP = await generateOtp();   
        await sendotpMobileAndEmail(getOTP,chkUser[0].email,chkUser[0].mobile,chkUser[0].user_id,full_name);

        return res.status(200).json({
          statusCode: 203,
          message: "User is already registered with this email-id! Please verified you account with given OTP!",
          data:chkUser[0].user_id,
        });
      }
      // check pathsala
      if (user_type_id == 1) {
        if (!school_id) {
          return res.status(200).json({
            statusCode: 203,
            message: "Pathsala id missing",
          });
        }
        if (!(await checkSchool(school_id))) {
          return res.status(200).json({
            statusCode: 203,
            message: "Pathsala not exists",
          });
        }
      }
      const refral_code= referralCodeGenerator.alphaNumeric('uppercase', 2, 4);

      password = await bcrypt.hash(password, saltRounds);
      const result = await config.sequelize.query(
        `INSERT INTO user_accounts (user_type_id,full_name, email,mobile,referalcode, state_id, city_id, password) VALUES (?,?,?,?,?,?,?,?) RETURNING user_id`,
        {
          replacements: [
            user_type_id,
            full_name,
            email,
            mobile,
            refral_code,
            state_id,
            city_id,
            password,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );
      const lastInsertedId = result[0][0].user_id;      

      // get enrollment id
      const getEnrolId = await generateEnrollmentNo({
        user_id: lastInsertedId,
        full_name,
      });

      // if user type is student then insert in student_profiles #pathshala
      if (user_type_id == 1) {
        await config.sequelize.query(
          `INSERT INTO student_profiles (user_id,enrollment_id,student_domain_id,school_id) VALUES (?,?,?,?)`,
          {
            replacements: [lastInsertedId, getEnrolId,1,school_id],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );

        // if student is E-gyan
      } else if (user_type_id == 2) {
        await config.sequelize.query(
          `INSERT INTO egyan_student_profiles (user_id,enrollment_id,student_domain_id) VALUES (?,?,?)`,
          {
            replacements: [lastInsertedId, getEnrolId,2],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );
        // if user is pathsala/school
      } else if (user_type_id == 3) {
        await config.sequelize.query(
          `INSERT INTO school_registration(school_name,user_id,enrollment_id) VALUES (?,?,?)`,
          {
            replacements: [full_name,lastInsertedId, getEnrolId],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );
        // if user is educator
      } else if (user_type_id == 4) {
        await config.sequelize.query(
          `INSERT INTO educators (user_id ) VALUES (?)`,
          {
            replacements: [lastInsertedId],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );
        // if user is parent
      } else if (user_type_id == 5) {
        // get student id by enrollment id
        const getStudent = await config.sequelize.query(
          `SELECT user_id FROM student_profiles WHERE enrollment_id = ?`,
          {
            replacements: [enrollment_id],
            raw: true,
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
        if (!getStudent.length) {
          return res
            .status(200)
            .json({ statusCode: 203, message: "No student find" });
        }
        await config.sequelize.query(
          `INSERT INTO student_parents(user_id,student_id) VALUES (?,?)`,
          {
            replacements: [lastInsertedId, getStudent[0].user_id],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );
      }

      // send otp 
      if (ACCOUNT_VERIFIED_EMAIL){        
        if(result){
          const getOTP = await generateOtp();   
          await sendotpMobileAndEmail(getOTP,email,mobile,lastInsertedId,full_name);
        }
      }
    //end of pending user account

      return res.status(200).json({ statusCode: 200, message: "User registered successfully! Please verified you account with give OTP!",
      user_id:lastInsertedId});
    } catch (error) {
      console.log("-error", error);
      // delete if any child entry not working
      if (lastInsertedId != "") {
        await config.sequelize.query(
          `DELETE FROM user_accounts WHERE user_id = ?`,
          {
            replacements: [lastInsertedId],
            raw: true,
            type: config.sequelize.QueryTypes.DELETE,
          }
        );
      }
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  // for user logout
  async logout(req, res) {
    let lastInsertedId = "";
    try {
      return res
      .status(200)
      .json({ statusCode: 200, message: "Logout successfully!" });

    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  // for user change password
  async changePassword(req, res) {
    try {
      // for verifiying token
      const user_id=req.user.sub;//get call from middleware

      const {old_password,confirm_password} = req.body;
      let { new_password } = req.body;

      if(new_password==""){
        return res.status(200).json({
          statusCode: 203,
          message: "New password can not be blank!",
          data: {},
        });
      }

      if (new_password != confirm_password) {
        return res.status(200).json({
          statusCode: 203,
          message: "Password not matched",
          data: {},
        });
      }
      // check old password is correct
      const checkUser = await config.sequelize.query(
        `SELECT * FROM user_accounts WHERE user_id = ? AND password=?`,
        {
          replacements: [user_id,old_password],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if(!checkUser.length){
        return res.status(200).json({
          statusCode: 203,
          message: "Old password is not correct! Please enter correct old password!",
          data: {},
        });
      }

      new_password = await bcrypt.hash(new_password, saltRounds);
      const result = await config.sequelize.query(
        `UPDATE user_accounts set password=? WHERE user_id=?`,
        {
          replacements: [password,user_id],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      if(result){
        return res
        .status(200)
        .json({ statusCode: 203, message: "Password update successfully!" });
      } 


    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  // for otp verification 
  async otpVerfy(req,res){
    try {
      const { user_id, otp } = req.body;
      const checkOtp = await config.sequelize.query(
        `SELECT * FROM pending_user_accounts WHERE user_id = ? ORDER BY pending_user_id DESC limit 1`,
        {
          replacements: [user_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        });

      if (checkOtp.length) {
        // otp will expire after 10 min
        var otp_create_time=moment(checkOtp[0].created_at);
        var current_time=moment(moment().format());
        var countdowm_minuts = parseInt(current_time.diff(otp_create_time, 'minutes'));            
        var msg="Your OTP is not valid.";
        if(countdowm_minuts>10){
          return res
              .status(200)
              .json({ statusCode: 203, message: msg });
        }
        if (otp != checkOtp[0].email_otp) {
          return res
            .status(200)
            .json({ statusCode: 203, message: "Invalid OTP." });
        }
        else{
          //set user account table verified
          await config.sequelize.query(
          `UPDATE user_accounts SET verified=true WHERE user_id=?`,
          {
            replacements: [user_id],
            raw: true,
            type: config.sequelize.QueryTypes.SELECT,
          });
          // delete record from pedning user accounts
          await config.sequelize.query(
          `DELETE from pending_user_accounts WHERE user_id=?`,
          {
            replacements: [user_id],
            raw: true,
            type: config.sequelize.QueryTypes.SELECT,
          });

          return res
            .status(200)
            .json({ statusCode: 200, message: "User verified successfully!" });
        }
      } else {
        return res.status(200).json({
          statusCode: 203,
          message: "Invalid details.",
        });
      }
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  // for otp resend 
  async otpResend(req,res){
    try {
      const { user_id} = req.body;      
      const getOTP = await generateOtp();
      const getEmail = await config.sequelize.query(
        `SELECT email,verified,mobile,full_name FROM user_accounts WHERE user_id = ?`,
        {
          replacements: [user_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(getEmail.length){
        console.log(getEmail[0].verified);
        if(getEmail[0].verified){
          return res
          .status(200)
          .json({ statusCode: 200, message: "Already verified account!"});
        }
        const email=getEmail[0].email;
        const mobile=getEmail[0].mobile;
        const name=getEmail[0].full_name;

        console.log(mobile);

        //send otp again if not verified       
        await sendotpMobileAndEmail(getOTP,email,mobile,user_id,name);

        return res
          .status(200)
          .json({ statusCode: 200, message: "OTP send successfully!"});
        }
      else{
        return res
          .status(200)
          .json({ statusCode: 203, message: "User does not exists in our system."});
        }

    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  // forgot password otp  
  async forgotPasswordOtp(req,res){
    try {
      const {email} = req.body;      
      const getOTP = await generateOtp();
      const getEmail = await config.sequelize.query(
        `SELECT user_id,mobile,full_name FROM user_accounts WHERE email = ?`,
        {
          replacements: [email],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(getEmail.length){
        const mobile=getEmail[0].mobile;
        const name=getEmail[0].full_name;
        //send otp again if not verified       
        await sendotpMobileAndEmail(getOTP,email,mobile,getEmail[0].user_id,name);

        return res
          .status(200)
          .json({ statusCode: 200, message: "OTP send successfully!"});
        }
      else{
        return res
          .status(200)
          .json({ statusCode: 203, message: "User does not exists in our system."});
        }

    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  //verify forgot password otp 
  async otpVerfyForgotPassword(req,res){
    try {
      const { email, otp } = req.body;
      if(email==undefined){
        return res
            .status(200)
            .json({ statusCode: 203, message: "Email cann't be blank." });
      }
      if(otp==undefined){
        return res
            .status(200)
            .json({ statusCode: 203, message: "OTP cann't be blank." });
      }

      const getEmail = await config.sequelize.query(
        `SELECT user_id FROM user_accounts WHERE email = ?`,
        {
          replacements: [email],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(!getEmail.length){
        return res
            .status(200)
            .json({ statusCode: 203, message: "Details is not valid." });
      }
      const user_id=getEmail[0].user_id;
      const checkOtp = await config.sequelize.query(
        `SELECT * FROM pending_user_accounts WHERE user_id = ? ORDER BY pending_user_id DESC limit 1`,
        {
          replacements: [user_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        });

      if (checkOtp.length) {
        // otp will expire after 10 min
        var otp_create_time=moment(checkOtp[0].created_at);
        var current_time=moment(moment().format());
        var countdowm_minuts = parseInt(current_time.diff(otp_create_time, 'minutes'));            
        var msg="Your OTP is not valid.";
        if(countdowm_minuts>10){
          return res
              .status(200)
              .json({ statusCode: 203, message: msg });
        }
        if (otp != checkOtp[0].email_otp) {
          return res
            .status(200)
            .json({ statusCode: 203, message: "Invalid OTP." });
        }
        else{
          
          await config.sequelize.query(
            `UPDATE pending_user_accounts SET is_otp_verified=true WHERE user_id=?`,
            {
              replacements: [user_id],
              raw: true,
              type: config.sequelize.QueryTypes.SELECT,
            });

          return res
            .status(200)
            .json({ statusCode: 200, message: "OTP verified successfully!",data:1 });
        }
      } else {
        return res.status(200).json({
          statusCode: 203,
          message: "Invalid details.",
        });
      }
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  // for user change forgot password
  async changeForgotPassword(req, res) {
    try {

      const {email,confirm_password} = req.body;
      let { new_password } = req.body;

      if(new_password==""){
        return res.status(200).json({
          statusCode: 203,
          message: "New password can not be blank!",
          data: {},
        });
      }

      if (new_password != confirm_password) {
        return res.status(200).json({
          statusCode: 203,
          message: "Password not matched",
          data: {},
        });
      }
      if(new_password.length<8){
        return res.status(200).json({
          statusCode: 203,
          message: "Minimun password length should be 8 characters!",
          data: {},
        });
      }
      const getEmail = await config.sequelize.query(
        `SELECT user_id FROM user_accounts WHERE email = ?`,
        {
          replacements: [email],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if(!getEmail){
        return res
            .status(200)
            .json({ statusCode: 203, message: "Details is not valid." });
      }
      const user_id=getEmail[0].user_id;

      const chkOtpVerified = await config.sequelize.query(
        `SELECT * FROM pending_user_accounts WHERE user_id=? AND is_otp_verified=TRUE`,
        {
          replacements: [user_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        });
        if(!chkOtpVerified.length){
          return res
        .status(200)
        .json({ statusCode: 203, message: "OTP is not verified!" });
        }

      // for setting new password
      new_password = await bcrypt.hash(new_password, saltRounds);
      const result = await config.sequelize.query(
        `UPDATE user_accounts set password=? WHERE email=?`,
        {
          replacements: [new_password,email],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      if(result){
        
        // delete record from pedning user accounts
        await config.sequelize.query(
        `DELETE from pending_user_accounts WHERE user_id=?`,
        {
          replacements: [user_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        });

        return res
        .status(200)
        .json({ statusCode: 203, message: "Password change successfully!" });
      } 

    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

}

// send otp on mail and mobile 
async function sendotpMobileAndEmail(otp,email,mobile,user_id,name){
  try{
      const query2=await config.sequelize.query(
        `INSERT INTO pending_user_accounts (phone_otp,email_otp,user_id) VALUES (?,?,?)`,
        {
          replacements: [otp,otp,user_id],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );

      console.log(email);
      // for sending otp mail 
      var mailOptions = {
        from: 'noreply@gyansutrm.com',
        to: email,
        subject: 'Verify Your Gyansutrm Account',
        html: '<p><center><img src="cid:unique@gyansutrum.ee" width="300px"/></center></p>'
        +'<p>Hello '+ name + '</p><p>Please verify your Gyansutrm account by entering this OTP ' + otp +
        '. </p><p>Gyansutrm wish you a lot of best wishes for your learning journey!</p><p>	Best Regards,</p>' 
        +'<p><img src="cid:unique@gyansutrum2.ee" width="150px"/></p><p>Gyansutrm Team</p>',
        attachments: [{
            filename: 'user.jpg',
            path: 'public/images/user.jpg',
            cid: 'unique@gyansutrum.ee',
          },
          {
            filename: 'logo.jpg',
            path: 'public/images/logo.jpg',
            cid: 'unique@gyansutrum2.ee' //same cid value as in the html img src
          }
        ]
      };
      await transporter.sendMail(mailOptions, function(error, info){
        if (error) {        
          console.log("Some error while sending email! Try again! " , error);        
        }
          else {        
            console.log("Email sent successfully!");        
        }
      });

      //for sendng otp on mobile
      const path= "/api/v5/otp?template_id=609a2ba2851f0811676ca144&mobile=91"+mobile+"&authkey=360398AJb0MIetlgsU6098b955P1&otp="+otp;
          var options = {
            "method": "GET",
            "hostname": "api.msg91.com",
            "port": null,
            "path": path,
            "headers": {
              "content-type": "application/json"
            }
          };            
          var reqs = http.request(options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
              chunks.push(chunk);
            });
            res.on("end", function () {
              var body = Buffer.concat(chunks);
              console.log(body.toString());
            });
          });
          reqs.end();
    }
  catch(error){
    console.log("error while sending mail");
    }

}
// Generate 6 digit otp
async function generateOtp(){
  var otp=Math.floor(100000 + Math.random() * 900000);
  return otp;
}
// check pathshala exists
async function checkSchool(school_id) {
  const getSchool = await config.sequelize.query(
    `SELECT user_id FROM user_accounts WHERE user_type_id = 3 AND user_id = ?`,
    {
      replacements: [school_id],
      raw: true,
      type: config.sequelize.QueryTypes.SELECT,
    }
  );
  return getSchool.length ? getSchool[0].user_id : "";
}

// Generate enrollment number 15 digit
async function generateEnrollmentNo(data) {
  let name = data.full_name.substr(0, 3);  
  if(name.length==1)
    name="00"+name;
  else if(name.length==2)
    name="0"+name;
  let enrolmentID=name;
  enrolmentID += moment().format("DDMMYY");
  let user_id=data.user_id;

  if(user_id.toString().length==1)
    user_id="00000"+user_id;
  else if(user_id.toString().length==2)
    user_id="0000"+user_id;
  else if(user_id.toString().length==3)
    user_id="000"+user_id;
  else if(user_id.toString().length==4)
    user_id="00"+user_id;
  else if(user_id.toString().length==5)
    user_id="0"+user_id;

  enrolmentID += user_id;  
  return enrolmentID;
}

module.exports = new AuthController();
