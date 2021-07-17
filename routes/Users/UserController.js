const config = require("../../config/connection");
let referralCodeGenerator = require('referral-code-generator')
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const moment = require("moment");

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

class UserController {
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
      } = req.body;
      let password = "12345678"; //Math.random();
      let pass=password; // for sending password to mail
      const chkUser = await config.sequelize.query(
        `SELECT * FROM user_accounts WHERE email = ?`,
        {
          replacements: [email],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (chkUser.length) {
        return res.status(200).json({
          statusCode: 203,
          message: "Email already exists",
        });
      }
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
        `INSERT INTO user_accounts (user_type_id,full_name, email,mobile,referalcode, state_id, city_id, password,status,verified) 
        VALUES (?,?,?,?,?,?,?,?,true,true) RETURNING user_id`,
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
      lastInsertedId = result[0][0].user_id;

      // get enrollment id

      const getEnrolId = await generateEnrollmentNo({
        user_id: lastInsertedId,
        full_name,
      });
      // if user type is student then insert in student_profiles #pathshala
      if (user_type_id == 1) {
        await config.sequelize.query(
          `INSERT INTO student_profiles (user_id,enrollment_id,student_domain_id, school_id) VALUES (?,?,?,?)`,
          {
            replacements: [lastInsertedId, getEnrolId,1, school_id],
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
          `INSERT INTO school_registration (school_name,user_id,enrollment_id) VALUES (?,?,?)`,
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
          `INSERT INTO student_parents (user_id,student_id) VALUES (?,?)`,
          {
            replacements: [lastInsertedId, getStudent[0].user_id],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );
      }
      // ######### if everythin is ok then send mail to user with Credential #####
      var mailOptions = {
        from: 'noreply@gyansutrm.com',
        to: email,
        subject: 'Your Gyansutrm account is ready to go',
        html: '<p><center><img src="cid:unique@gyansutrum.ee" width="300px"/></center></p>'
        +'<center><p><strong>Hi '+ full_name + '</strong></p></center>'+
        '<div style="background:#009dff; color:#fff; padding:20px;"><center><p>Welcome to Gyansutrm</p><p>The India’s Best Education Platform</p>' +
        '<p>You’re all set. Are you excited to explore your learning Path go ahead……..</p></center></div>'+ 
        '<p><strong>You are the best and you have chosen the best learning platform.</strong></p><p><strong>Happy learning.</strong></p>'+ 
        '<p><strong># Let’s Do it.</strong></p><p><strong>Let us  make your study room your classroom.</strong></p>'+
        '<p><strong>Your Registration was successful with username : '+email+' and password :' + pass +'</strong></p>'+
        '<p><strong>We’re here to help you in achieving your Goals !.</strong></p>'+
        '<p><a href="http://gyansutrm.com/"><strong>LOG IN TO YOUR NEW ACCOUNT</strong></a></p>'+
        '<p><strong>Keep updated :</strong></p>'+
        '<p><a href="https://www.youtube.com/channel/UCoTfGD34Vu7SVvSEJo_N8fw"><img src="cid:unique@gyansutrumYoutube.ee" width="36px"/></a>'+
        '<a href="https://www.facebook.com/Gyansutram"><img src="cid:unique@gyansutrumFacebook.ee" width="36px"/></a>'+
        '<a href="https://instagram.com/gyansutrm?igshid=ddb0g9iay8wc"><img src="cid:unique@gyansutrumInstagram.ee" width="36px"/></a>'+
        '<a href="https://twitter.com/gyansutrm"><img src="cid:unique@gyansutrumTwitter.ee" width="36px"/></a></p>'+
        '<p><strong>Please do not reply directly to this email. If you have any questions or comments regarding this email, please contact us at reachus@gyansutrm.com</strong></p>'+
        '<p><strong>This message was produced and distributed by Gyansutrm Private Limited, 5/11,'+
        'vijay nagar, Indore 452001. GSPL will not be bound by, and specifically objects to, any term, condition or other provision which is different from or in addition to the provisions of the GSPL Privacy policy &amp; Terms &amp; conditions  (whether or not it would materially alter such GSPL Privacy policy or GSPL Terms &amp; conditions ) and which is submitted in any order, receipt, acceptance, confirmation, correspondence or otherwise, unless GSPL specifically agrees to such provision in a written instrument signed by GSPL.</strong></p>',
        
        attachments: [{
            filename: 'logo.jpg',
            path: 'public/images/logo.jpg',
            cid: 'unique@gyansutrum.ee',
          },
          {
            filename: 'youtube.jpg',
            path: 'public/images/youtube.jpg',
            cid: 'unique@gyansutrumYoutube.ee' //same cid value as in the html img src
          },
          {
            filename: 'facebook.jpg',
            path: 'public/images/facebook.jpg',
            cid: 'unique@gyansutrumFacebook.ee' //same cid value as in the html img src
          },
          {
            filename: 'instagram.jpg',
            path: 'public/images/instagram.jpg',
            cid: 'unique@gyansutrumInstagram.ee' //same cid value as in the html img src
          },
          {
            filename: 'twitter.jpg',
            path: 'public/images/twitter.jpg',
            cid: 'unique@gyansutrumTwitter.ee' //same cid value as in the html img src
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
      // ########### end of mail function #############
    

      return res
        .status(200)
        .json({ statusCode: 200, message: "Added", user_id: lastInsertedId });
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

  async profile(req, res) {
    try {
      const { id } = req.params;
      const getUser = await config.sequelize.query(
        `SELECT user_id, user_type_id FROM user_accounts WHERE user_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!getUser.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "User not exixts!" });
      }
      console.log("-getUser", getUser);
      let user_type_id = getUser[0].user_type_id;
      if(!user_type_id)
      {
        return res
        .status(200)
        .json({ statusCode: 203, message: "User type is not defiend!" });
      }

      let qry = "";
      if (user_type_id == 1) {
        qry = `SELECT UA.*, SP.*,SD.domain_name,SR.school_name,  S.stream_name, 
        C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name,
         CCT.city_name AS school_city_name FROM user_accounts UA
        LEFT JOIN states ST ON ST.state_id = UA.state_id 
        LEFT JOIN cities CT ON CT.city_id = UA.city_id
        , student_profiles SP 
        LEFT JOIN streams S ON S.stream_id = SP.stream_id 
        LEFT JOIN classes C ON C.class_id = SP.class_id 
        LEFT JOIN states SST ON SST.state_id = SP.school_state_id 
        LEFT JOIN cities CCT ON CCT.city_id = SP.school_city_id
        LEFT JOIN  school_registration SR ON SR.user_id=SP.school_id
        LEFT JOIN student_domain SD ON SD.student_domain_id = SP.student_domain_id
        WHERE SP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 2) {
        qry = `SELECT UA.*, ESP.*,SD.domain_name,S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name  FROM user_accounts UA
        LEFT JOIN states ST ON ST.state_id = UA.state_id 
        LEFT JOIN cities CT ON CT.city_id = UA.city_id 
        , egyan_student_profiles ESP
        LEFT JOIN streams S ON S.stream_id = ESP.stream_id 
        LEFT JOIN classes C ON C.class_id = ESP.class_id 
        LEFT JOIN states SST ON SST.state_id = ESP.school_state_id 
        LEFT JOIN cities CCT ON CCT.city_id = ESP.school_city_id 
        LEFT JOIN student_domain SD ON SD.student_domain_id = ESP.student_domain_id
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

      console.log("-qry", qry);
      const dataObj = await config.sequelize.query(qry, {
        replacements: [id],
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });
      console.log("------",dataObj[0]);

      if (user_type_id == 1 || user_type_id == 2) {
            dataObj[0].present_address_obj = await getAddress(
            dataObj[0].present_address_id
          );
        
         dataObj[0].parmanent_address_obj = await getAddress(
          dataObj[0].parmanent_address_id
        );
        
      }

      if (user_type_id == 3) {
        dataObj[0].school_address_obj = await getAddress(
          dataObj[0].school_address_id
        );
      }

      if (dataObj.length) {
        // remove password
        delete dataObj[0].password;
        delete dataObj[0].login_token;
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

  async profileUpdate(req, res) {
    try {
      let { id } = req.params;
      const { full_name, state_id, city_id } = req.body;

      let returnQry="";
      // const { imgLocation } = req.file ? req.file : "";
      const imgLocation= req.file ? req.file.location:"";

      const getUser = await config.sequelize.query(
        `SELECT user_id, user_type_id FROM user_accounts WHERE user_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      console.log("-getUser", getUser);
      if (!getUser.length) {
        return res
          .status(200)
          .json({ statusCode: 203, message: "No user find" });
      }
      let user_type_id = getUser[0].user_type_id;
      // let table = await getTableByUserType(obj.user_type_id);
      let upCol = "";
      let uaSql = `UPDATE user_accounts SET `;
      if (full_name) upCol += ` full_name = '${full_name}',`;
      if (state_id) upCol += ` state_id = ${state_id},`;
      if (city_id) upCol += ` city_id = ${city_id},`;
      if (upCol) {
        uaSql += upCol.slice(0, -1);
        uaSql += ` WHERE user_id = ?`;

        // update users main table
        await config.sequelize.query(uaSql, {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        });
      }
      if (user_type_id == 1) {
        let {
          admission_date,
          present_address_id,
          present_address_obj,
          parmanent_address_id,
          parmanent_address_obj,
          dob,
          alternate_mobile,
          stream_id,
          class_id,
          aadhar_no,
          gender,
          blood_group,
          previous_school_name,
          school_state_id,
          school_city_id,
        } = req.body;
        //chek field is empty or undefined return null
        admission_date=await chkObj2(admission_date);
        dob=await chkObj2(dob);
        stream_id=await chkObj2(stream_id);
        class_id=await chkObj2(class_id);
        school_state_id=await chkObj2(school_state_id);
        school_city_id=await chkObj2(school_city_id);

        //chek field is empty or undefined return blank
        alternate_mobile=await chkObj(alternate_mobile);
        gender=await chkObj(gender);
        blood_group=await chkObj(blood_group);
        previous_school_name=await chkObj(previous_school_name);
        aadhar_no=await chkObj(aadhar_no);

        //for getting the address id if exixts
        const getUserAddressId = await config.sequelize.query(
          `SELECT present_address_id,parmanent_address_id FROM student_profiles WHERE user_id = ?`,
          {
            replacements: [id],
            raw: true,
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
        present_address_id=getUserAddressId[0].present_address_id;
        parmanent_address_id=getUserAddressId[0].parmanent_address_id;

        let upPro = "";
        let query = `UPDATE student_profiles SET `;
        if (admission_date) upPro += ` admission_date = '${admission_date}',`;
        if (dob) upPro += ` dob = '${dob}',`;
        if (imgLocation) upPro += ` profile_image = '${imgLocation}',`;
        if (alternate_mobile)
          upPro += ` alternate_mobile = '${alternate_mobile}',`;
        if (stream_id) upPro += ` stream_id = ${stream_id},`;
        if (class_id) upPro += ` class_id = ${class_id},`;
        if (aadhar_no) upPro += ` aadhar_no = '${aadhar_no}',`;
        if (gender) upPro += ` gender = '${gender}',`;
        if (blood_group) upPro += ` blood_group = '${blood_group}',`;
        if (previous_school_name)
          upPro += ` previous_school_name = '${previous_school_name}',`;
        if (school_state_id) upPro += ` school_state_id = ${school_state_id},`;
        if (school_city_id) upPro += ` school_city_id = ${school_city_id},`;
        if (upPro) {
          query += upPro.slice(0, -1);
          query += ` WHERE user_id = ? `;
          console.log("-query--1", query);
          // update student profile
          await config.sequelize.query(query, {
            replacements: [id],
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          });
        }
        if (present_address_obj) {
          await saveStudentAddress({
            id,
            fieldName: "present_address_id",
            objArr: present_address_obj,
            user_type_id,
            exist_id: present_address_id,
          });
        }
        if (parmanent_address_obj) {
          await saveStudentAddress({
            id,
            fieldName: "parmanent_address_id",
            objArr: parmanent_address_obj,
            user_type_id,
            exist_id: parmanent_address_id,
          });
        }

        //for returning updated profile data
        returnQry=`SELECT UA.*, SP.*,SD.domain_name,SR.school_name,  S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name FROM user_accounts UA
              LEFT JOIN states ST ON ST.state_id = UA.state_id 
              LEFT JOIN cities CT ON CT.city_id = UA.city_id
              , student_profiles SP 
              LEFT JOIN streams S ON S.stream_id = SP.stream_id 
              LEFT JOIN classes C ON C.class_id = SP.class_id 
              LEFT JOIN states SST ON SST.state_id = SP.school_state_id 
              LEFT JOIN cities CCT ON CCT.city_id = SP.school_city_id
              LEFT JOIN  school_registration SR ON SR.user_id=SP.school_id
              LEFT JOIN student_domain SD ON SD.student_domain_id = SP.student_domain_id
              WHERE SP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;

      } else if (user_type_id == 2) {
        // update egyan student
        let {
          admission_date,
          present_address_id,
          present_address_obj,
          parmanent_address_id,
          parmanent_address_obj,
          dob,
          alternate_mobile,
          stream_id,
          class_id,
          aadhar_no,
          gender,
          blood_group,
          previous_school_name,
          school_state_id,
          school_city_id,
        } = req.body;

        //chek field is empty or undefined return null
        admission_date=await chkObj2(admission_date);
        dob=await chkObj2(dob);
        stream_id=await chkObj2(stream_id);
        class_id=await chkObj2(class_id);
        school_state_id=await chkObj2(school_state_id);
        school_city_id=await chkObj2(school_city_id);

        //chek field is empty or undefined return blank
        alternate_mobile=await chkObj(alternate_mobile);
        gender=await chkObj(gender);
        blood_group=await chkObj(blood_group);
        previous_school_name=await chkObj(previous_school_name);
        aadhar_no=await chkObj(aadhar_no);

        //for getting the address id if exixts
        const getUserAddressId = await config.sequelize.query(
          `SELECT present_address_id,parmanent_address_id FROM egyan_student_profiles WHERE user_id = ?`,
          {
            replacements: [id],
            raw: true,
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
        present_address_id=getUserAddressId[0].present_address_id;
        parmanent_address_id=getUserAddressId[0].parmanent_address_id;
        // console.log("------------------",present_address_id,parmanent_address_id)

        let upPro = "";
        let query = `UPDATE egyan_student_profiles SET `;
        if (admission_date) upPro += ` admission_date = '${admission_date}',`;
        if (dob) upPro += ` dob = '${dob}',`;
        if (imgLocation) upPro += ` profile_image = '${imgLocation}',`;
        if (alternate_mobile)
          upPro += ` alternate_mobile = '${alternate_mobile}',`;
        if (stream_id) upPro += ` stream_id = ${stream_id},`;
        if (class_id) upPro += ` class_id = ${class_id},`;
        if (aadhar_no) upPro += ` aadhar_no = '${aadhar_no}',`;
        if (gender) upPro += ` gender = '${gender}',`;
        if (blood_group) upPro += ` blood_group = '${blood_group}',`;
        if (previous_school_name)
          upPro += ` previous_school_name = '${previous_school_name}',`;
        if (school_state_id) upPro += ` school_state_id = ${school_state_id},`;
        if (school_city_id) upPro += ` school_city_id = ${school_city_id},`;
        if (upPro) {
          query += upPro.slice(0, -1);
          query += ` WHERE user_id = ? `;
          console.log("-query--1", query);
          await config.sequelize.query(query, {
            replacements: [id],
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          });
        }
        if (present_address_obj) {
          await saveStudentAddress({
            id,
            fieldName: "present_address_id",
            objArr: present_address_obj,
            user_type_id,
            exist_id: present_address_id,
          });
        }
        if (parmanent_address_obj) {
          await saveStudentAddress({
            id,
            fieldName: "parmanent_address_id",
            objArr: parmanent_address_obj,
            user_type_id,
            exist_id: parmanent_address_id,
          });
        }
        
        //for returning updated profile data
        returnQry = `SELECT UA.*, ESP.*,SD.domain_name,S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name  FROM user_accounts UA
              LEFT JOIN states ST ON ST.state_id = UA.state_id 
              LEFT JOIN cities CT ON CT.city_id = UA.city_id 
              , egyan_student_profiles ESP
              LEFT JOIN streams S ON S.stream_id = ESP.stream_id 
              LEFT JOIN classes C ON C.class_id = ESP.class_id 
              LEFT JOIN states SST ON SST.state_id = ESP.school_state_id 
              LEFT JOIN cities CCT ON CCT.city_id = ESP.school_city_id
              LEFT JOIN student_domain SD ON SD.student_domain_id = ESP.student_domain_id 
              WHERE ESP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 3) {
        let {
          school_name,
          school_address_id,
          school_address_obj,
          director_name,
          director_contact_no,
          school_admin_contact_no,
          director_email,
          school_admin_email,
          establish_year,
          registration_no,
          aadhar_no,
          gst_no,
          pan_no,
        } = req.body;

        school_name=await chkObj(school_name);
        director_name=await chkObj(director_name);
        director_contact_no=await chkObj(director_contact_no);
        school_admin_contact_no=await chkObj(school_admin_contact_no);
        director_email=await chkObj(director_email);
        school_admin_email=await chkObj(school_admin_email);
        establish_year=await chkObj(establish_year);
        registration_no=await chkObj(registration_no);
        aadhar_no=await chkObj(aadhar_no);
        gst_no=await chkObj(gst_no);
        pan_no=await chkObj(pan_no);

        //for getting the address id if exixts
        const getUserAddressId = await config.sequelize.query(
          `SELECT school_address_id FROM school_registration WHERE user_id = ?`,
          {
            replacements: [id],
            raw: true,
            type: config.sequelize.QueryTypes.SELECT,
          }
        );
        school_address_id=getUserAddressId[0].school_address_id;

        let upPro = "";
        let query = `UPDATE school_registration SET `;
        if (imgLocation) upPro += ` profile_image = '${imgLocation}',`;
        if (school_name) upPro += ` school_name = '${school_name}',`;
        if (director_name) upPro += ` director_name = '${director_name}',`;
        if (director_contact_no)
          upPro += ` director_contact_no = '${director_contact_no}',`;
        if (school_admin_contact_no)
          upPro += ` school_admin_contact_no = '${school_admin_contact_no}',`;
        if (director_email) upPro += ` director_email = '${director_email}',`;
        if (school_admin_email)
          upPro += ` school_admin_email = '${school_admin_email}',`;
        if (establish_year) 
        {
          if(establish_year.length!=4){
            return res.status(200).json({
              statusCode: 203,
              message: "establishment year length should be 4!",
              data: [],
            });
          }  
          upPro += ` establish_year = '${establish_year}',`;
        }
        if (registration_no)
          upPro += ` registration_no = '${registration_no}',`;
        if (aadhar_no) upPro += ` aadhar_no = '${aadhar_no}',`;
        if (gst_no) upPro += ` gst_no = '${gst_no}',`;
        if (pan_no) upPro += ` pan_no = '${pan_no}',`;
        if (upPro) {
          query += upPro.slice(0, -1);
          query += ` WHERE user_id = ? `;
          console.log("-query--1", query);
          await config.sequelize.query(query, {
            replacements: [id],
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          });
        }
        //  update school address
        if (school_address_obj) {
          console.log("---sschool_address_id", school_address_id);
          await saveStudentAddress({
            id,
            fieldName: "school_address_id",
            objArr: school_address_obj,
            user_type_id,
            exist_id: school_address_id,
          });
        }
        //for returning updated profile data
        returnQry = `SELECT UA.*, S.* ,
              SST.state_name AS school_state_name, CCT.city_name AS school_city_name
              FROM school_registration S ,user_accounts UA
              LEFT JOIN states SST ON SST.state_id = UA.state_id 
              LEFT JOIN cities CCT ON CCT.city_id = UA.city_id 
              WHERE 
              S.user_id = UA.user_id 
              AND UA.user_id = ? 
              AND UA.is_deleted = false`;

      } else if (user_type_id == 4) {
        // const {} = req.body;
        // await config.sequelize.query(
        //   `UPDATE educators SET  WHERE user_id = ?`,
        //   {
        //     replacements: [full_name, state_id, city_id, user_i],
        //     raw: true,
        //     type: config.sequelize.QueryTypes.UPDATE,
        //   }
        // );
      } else if (user_type_id == 5) {
        // const {} = req.body;
        // await config.sequelize.query(
        //   `UPDATE student_parents SET  WHERE user_id = ?`,
        //   {
        //     replacements: [full_name, state_id, city_id, user_i],
        //     raw: true,
        //     type: config.sequelize.QueryTypes.UPDATE,
        //   }
        // );
      }

      const dataObj = await config.sequelize.query(returnQry, {
        replacements: [id],
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });
     
      if (user_type_id == 1 || user_type_id == 2) {
        dataObj[0].present_address_obj = await getAddress(
          dataObj[0].present_address_id
        );
        dataObj[0].parmanent_address_obj = await getAddress(
          dataObj[0].parmanent_address_id
        );
      }
      if (user_type_id == 3) {
        dataObj[0].school_address_obj = await getAddress(
          dataObj[0].school_address_id
        );
      }
      // console.log(dataObj[0]);
      if (dataObj.length) {
        // remove password aND token
        delete dataObj[0].password;
        delete dataObj[0].login_token;
      }

      return res.status(200).json({
        statusCode: 200,
        message: "Updated successfully",
        data: dataObj[0],
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async list(req, res) {
    try {

      const limit = 10;
      let page = req.query.page;
      if(page==undefined || page ==""){
        page=1;
      }
      page=parseInt(page);
      const startIndex = (page - 1) * limit;
      // const endIndex = page * limit;

      const {
        keyword,
        user_type_id,
        state_id,
        city_id,
        isDeleted,
        isBlocked,
      } = req.body;
      let listQry = `SELECT U.*, S.state_name, C.city_name FROM user_accounts U LEFT JOIN states S ON S.state_id = U.state_id LEFT JOIN cities C ON c.city_id = U.city_id WHERE U.is_deleted = false`;
      if (keyword != undefined && keyword != "") {
        listQry += ` AND (U.full_name LIKE '%${keyword}%' OR U.email LIKE '%${keyword}%')`;
      }
      if (state_id != undefined && state_id != "") {
        listQry += ` AND U.state_id = ${state_id}`;
      }
      if (city_id != undefined && city_id != "") {
        listQry += ` AND U.city_id = ${city_id}`;
      }
      if (user_type_id != undefined && user_type_id != "") {
        listQry += ` AND U.user_type_id = ${user_type_id}`;
      }
      
      const forCountObj=listQry;//for count the total records

      listQry += ` ORDER BY U.full_name`;
      // listQry += ` ORDER BY U.full_name LIMIT ${limit} OFFSET ${startIndex}`;
      console.log("-listQry", listQry);
      let dataObj = await config.sequelize.query(listQry, {
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });

      //count total records query
      const dataCountObj = await config.sequelize.query(forCountObj, {
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });

      // console.log(listQry);
      const totalcount=dataCountObj.length;
      const pageCount = Math.ceil(totalcount / limit);

      const finalOutput={"list_data":dataObj,"total_page":pageCount,"current_page":page,
      "total_records":totalcount,"limit":limit}

      return res.status(200).json({
        statusCode: 200,
        message: "user accounts list",
        data: dataObj,

      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async schoolList(req, res) {
    try {

      let listQry = `SELECT SR.user_id as school_id,SR.school_name FROM school_registration SR,
      user_accounts UA WHERE SR.user_id=UA.user_id AND UA.is_deleted = false`;
      
      console.log("-listQry", listQry);
      const dataObj = await config.sequelize.query(listQry, {
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });
      return res.status(200).json({
        statusCode: 200,
        message: "school list",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async studentInSchool(req, res) {
    try {
      const {school_id} = req.body;

      const chkSchObj = await config.sequelize.query(
        "SELECT * FROM user_accounts WHERE user_type_id=3 AND user_id=?", 
      {
        raw: true,
        replacements:[school_id],
        type: config.sequelize.QueryTypes.SELECT,
      });
      if(!chkSchObj.length){
        return res.status(200).json({
          statusCode: 200,
          message: "Given school is not present!"
        });
      }

      let listQry = `SELECT U.*, S.state_name, C.city_name FROM user_accounts U LEFT 
      JOIN states S ON S.state_id = U.state_id LEFT JOIN cities C ON c.city_id = U.city_id 
      , student_profiles SP
      WHERE U.is_deleted = false AND U.user_type_id=1 AND SP.school_id=? AND U.user_id=SP.user_id`;
      
      listQry += ` ORDER BY U.full_name`;
      console.log("-listQry", listQry);
      
      const dataObj = await config.sequelize.query(listQry, {
        raw: true,
        replacements:[school_id],
        type: config.sequelize.QueryTypes.SELECT,
      });
      return res.status(200).json({
        statusCode: 200,
        message: "user list of given school",
        data: dataObj,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async deleteUsr(req, res) {
    try {
      const {user_id} = req.body;

      const chkUsrExixtObjawait = await config.sequelize.query(
        `SELECT * from user_accounts WHERE user_id = ?`,
        {
          replacements: [user_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if(!chkUsrExixtObjawait.length){
          return res.status(200).json({
          statusCode: 200,
          message: "user not exists!"
        });
      }

      const dataObj = await config.sequelize.query(
        `DELETE from user_accounts WHERE user_id = ?`, 
        {
        raw: true,
        replacements:[user_id],
        type: config.sequelize.QueryTypes.UPDATE,
      });
      return res.status(200).json({
        statusCode: 200,
        message: "user delete successfully",
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async approveUsr(req, res) {
    try {
      const {user_id} = req.body;

      const chkUsrExixtObjawait = await config.sequelize.query(
        `SELECT * from user_accounts WHERE user_id = ?`,
        {
          replacements: [user_id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if(!chkUsrExixtObjawait.length){
          return res.status(200).json({
          statusCode: 200,
          message: "user not exists!"
        });
      }
      var approve=!(chkUsrExixtObjawait[0].status);
      console.log("----",approve);


      const dataObj = await config.sequelize.query(
        `UPDATE user_accounts set status=? WHERE user_id = ?`, 
        {
        raw: true,
        replacements:[approve,user_id],
        type: config.sequelize.QueryTypes.UPDATE,
      });
      const finalOutput={"approve_status":approve}
      return res.status(200).json({
        statusCode: 200,
        message: "Successfully approve/disapprove!",
        data:finalOutput
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

}

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

async function getAddress(address_id) {
  
  const addressObj = await config.sequelize.query(
    `SELECT UA.*,S.state_name, C.city_name FROM user_address UA
    LEFT JOIN states S ON S.state_id = UA.state_id
    LEFT JOIN cities C ON C.city_id = UA.city_id
    WHERE UA.address_id = ?`,
    {
      replacements: [address_id],
      raw: true,
      type: config.sequelize.QueryTypes.SELECT,
    }
  );
  return addressObj[0];
}

async function getTableByUserType(user_type_id) {
  switch (user_type_id) {
    case 1:
      return "student_profiles";
    case 2:
      return "egyan_student_profiles";
    case 3:
      return "school_registration";
    case 4:
      return "educators";
    case 5:
      return "student_parents";
  }
}

async function getProfileImageFolderName(user_type_id) {
  switch (user_type_id) {
    case 1:
      return "students";
    case 2:
      return "estudents";
    case 3:
      return "pathsala";
    case 4:
      return "educators";
    case 5:
      return "parents";
  }
}

async function getFieldNameBy(fieldName) {
  switch (fieldName) {
    case "present_address_id":
      return "present_address_id";
    case "parmanent_address_id":
      return "parmanent_address_id";
    case "school_address_id":
      return "school_address_id";
  }
}

async function saveStudentAddress(obj) {
  console.log("-obj", obj);

  try{
    var {
      plot_no,
      street_name,
      landmark,
      state_id,
      city_id,
      pincode,
    } = JSON.parse(obj.objArr);
  }
  catch(error){
    var {
      plot_no,
      street_name,
      landmark,
      state_id,
      city_id,
      pincode,
    } = obj.objArr;
  }

  
  let table = await getTableByUserType(obj.user_type_id);
  let fieldName = obj.fieldName;
  let exist_id = obj.exist_id;
  console.log("-presOrParmId", exist_id);
  console.log("-plot_no", plot_no);

  if (exist_id) {
    let upPro = "";

    let query = `UPDATE user_address SET `;
    if (plot_no) upPro += ` plot_no = '${plot_no}',`;
    if (street_name) upPro += ` street_name = '${street_name}',`;
    if (landmark) upPro += ` landmark = '${landmark}',`;
    
    if (state_id!="") upPro += ` state_id = ${state_id},`;
    else upPro += ` state_id = null,`;
    if (city_id!="") upPro += ` city_id = ${city_id},`;
    else upPro += ` city_id = null,`;

    if (pincode) upPro += ` pincode = '${pincode}',`;
    if (upPro) {
      query += upPro.slice(0, -1);
      query += ` WHERE address_id = ? `;
      console.log("-query--1", query);
      await config.sequelize.query(query, {
        replacements: [exist_id],
        raw: true,
        type: config.sequelize.QueryTypes.UPDATE,
      });
    }
  } else {
    console.log("-addup");
    console.log("-obj", obj);

    if (state_id=="") 
      state_id = null;
    if (city_id=="")
      city_id = null;

    const result = await config.sequelize.query(
      `INSERT INTO user_address (plot_no,street_name,landmark,state_id,city_id,pincode) VALUES (?,?,?,?,?,?) RETURNING address_id`,
      {
        replacements: [
          plot_no,
          street_name,
          landmark,
          state_id,
          city_id,
          pincode,
        ],
        raw: true,
        type: config.sequelize.QueryTypes.INSERT,
      }
    );
    let address_id = result[0][0].address_id;
    console.log("address_id-",address_id);
    await config.sequelize.query(
      `UPDATE ${table} SET ${fieldName} = ?  WHERE user_id = ?`,
      {
        replacements: [address_id, obj.id],
        raw: true,
        type: config.sequelize.QueryTypes.UPDATE,
      }
    );
  }
}

async function chkObj(obj){
  if(obj=='null' || obj==undefined || obj=="")
  {
    return "";
  }
  else{
    return obj;
  }
}
async function chkObj2(obj){
  if(obj=='null' || obj==undefined || obj=="")
  {
    return null;
  }
  else{
    return obj;
  }
}

module.exports = new UserController();
