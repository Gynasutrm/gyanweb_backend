const config = require("../../config/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const moment = require("moment");

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
      let password = "123456"; //Math.random();
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
      password = await bcrypt.hash(password, saltRounds);
      const result = await config.sequelize.query(
        `INSERT INTO user_accounts (user_type_id,full_name, email,mobile, state_id, city_id, password) VALUES (?,?,?,?,?,?,?) RETURNING user_id`,
        {
          replacements: [
            user_type_id,
            full_name,
            email,
            mobile,
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
          `INSERT INTO student_profiles (user_id,enrollment_id, school_id) VALUES (?,?,?)`,
          {
            replacements: [lastInsertedId, getEnrolId, school_id],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );

        // if student is E-gyan
      } else if (user_type_id == 2) {
        await config.sequelize.query(
          `INSERT INTO egyan_student_profiles (user_id,enrollment_id) VALUES (?,?)`,
          {
            replacements: [lastInsertedId, getEnrolId],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );
        // if user is pathsala/school
      } else if (user_type_id == 3) {
        await config.sequelize.query(
          `INSERT INTO school_registration (user_id,enrollment_id) VALUES (?,?)`,
          {
            replacements: [lastInsertedId, getEnrolId],
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

  async registerold(req, res) {
    // if user type is student then insert in student_profiles
    // if (user_type_id == 1) {
    //   await config.sequelize.query(
    //     `INSERT INTO student_profiles (user_id,enrollment_id,admission_date,student_domain_id,dob,alternate_mobile,present_address_id,parmanent_address_id,stream_id,class_id,aadhar_no,profile_image,gender,blood_group,previous_school_name,school_state_id,school_city_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    //     {
    //       replacements: [
    //         lastInsertedId,
    //         getEnrolId,
    //         admission_date,
    //         student_domain_id,
    //         dob,
    //         alternate_mobile,
    //         present_address_id,
    //         parmanent_address_id,
    //         stream_id,
    //         class_id,
    //         aadhar_no,
    //         profile_image,
    //         gender,
    //         blood_group,
    //         previous_school_name,
    //         school_state_id,
    //         school_city_id,
    //       ],
    //       raw: true,
    //       type: config.sequelize.QueryTypes.INSERT,
    //     }
    //   );

    //   // if student is E-gyan
    // } else if (user_type_id == 2) {
    //   await config.sequelize.query(
    //     `INSERT INTO egyan_student_profiles (user_id,enrollment_id,admission_date,student_domain_id,dob,alternate_mobile,present_address_id,parmanent_address_id,stream_id,class_id,aadhar_no,profile_image,gender,blood_group,previous_school_name,school_state_id,school_city_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    //     {
    //       replacements: [
    //         lastInsertedId,
    //         getEnrolId,
    //         admission_date,
    //         student_domain_id,
    //         dob,
    //         alternate_mobile,
    //         present_address_id,
    //         parmanent_address_id,
    //         stream_id,
    //         class_id,
    //         aadhar_no,
    //         profile_image,
    //         gender,
    //         blood_group,
    //         previous_school_name,
    //         school_state_id,
    //         school_city_id,
    //       ],
    //       raw: true,
    //       type: config.sequelize.QueryTypes.INSERT,
    //     }
    //   );
    //   // if user is pathsala/school
    // } else if (user_type_id == 3) {
    //   await config.sequelize.query(
    //     `INSERT INTO schools (user_id,enrollment_id,school_name,
    //       director_name,
    //       director_contact_no,
    //       school_admin_contact_no,
    //       director_email,
    //       school_admin_email,
    //       establish_year,
    //       registration_no,
    //       aadhar_card_no,
    //       gst_no,
    //       pan_no) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    //     {
    //       replacements: [
    //         lastInsertedId,
    //         getEnrolId,
    //         school_name,
    //         director_name,
    //         director_contact_no,
    //         school_admin_contact_no,
    //         director_email,
    //         school_admin_email,
    //         establish_year,
    //         registration_no,
    //         aadhar_card_no,
    //         gst_no,
    //         pan_no,
    //       ],
    //       raw: true,
    //       type: config.sequelize.QueryTypes.INSERT,
    //     }
    //   );
    //   // if user is educator
    // } else if (user_type_id == 4) {
    //   await config.sequelize.query(
    //     `INSERT INTO educators (user_id ) VALUES (?)`,
    //     {
    //       replacements: [lastInsertedId],
    //       raw: true,
    //       type: config.sequelize.QueryTypes.INSERT,
    //     }
    //   );
    //   // if user is parent
    // } else if (user_type_id == 5) {
    //   // get student id by enrollment id
    //   const getStudent = await config.sequelize.query(
    //     `SELECT user_id FROM student_profiles WHERE enrollment_id = ?`,
    //     {
    //       replacements: [enrollment_id],
    //       raw: true,
    //       type: config.sequelize.QueryTypes.SELECT,
    //     }
    //   );
    //   await config.sequelize.query(
    //     `INSERT INTO student_parents (user_id,student_id) VALUES (?,?)`,
    //     {
    //       replacements: [lastInsertedId, getStudent[0].user_id],
    //       raw: true,
    //       type: config.sequelize.QueryTypes.INSERT,
    //     }
    //   );
    // }
    try {
      const {
        user_type_id,
        school_id,
        parent_id,
        educator_id,
        full_name,
        email,
        mobile,
        confirm_password,
        referal_code,
        state_id,
        city_id,
      } = req.body;
      let { password } = req.body;
      if (password !== confirm_password) {
        return res.status(200).json({
          statusCode: 203,
          message: "Confirm password not matched",
          data: {},
        });
      }
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
          data: {},
        });
      }
      password = await bcrypt.hash(password, saltRounds);

      const result = await config.sequelize.query(
        `INSERT INTO user_accounts (user_type_id, school_id, parent_id, educator_id,full_name, email,mobile, referal_code, state_id, city_id, password) VALUES (?,?,?,?,?,?,?,?) RETURNING user_id`,
        {
          replacements: [
            user_type_id,
            school_id,
            parent_id,
            educator_id,
            full_name,
            email,
            mobile,
            referal_code,
            state_id,
            city_id,
            role_id,
            password,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );
      const lastInsertedId = result[0][0].user_id;
      //insert in pending users account
      await config.sequelize.query(
        `INSERT INTO pending_user_accounts (user_id) VALUES (?)`,
        {
          replacements: [lastInsertedId],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );
      // if user type is student then insert in student_profiles
      if (user_type_id == 1) {
        await config.sequelize.query(
          `INSERT INTO student_profiles (user_id,enrollment_id,admission_date,student_domain_id,dob,alternate_mobile,present_address_id,parmanent_address_id,stream_id,class_id,aadhar_no,profile_image,gender,blood_group,previous_school_name,school_state_id,school_city_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          {
            replacements: [
              lastInsertedId,
              enrollment_id,
              admission_date,
              student_domain_id,
              dob,
              alternate_mobile,
              present_address_id,
              parmanent_address_id,
              stream_id,
              class_id,
              aadhar_no,
              profile_image,
              gender,
              blood_group,
              previous_school_name,
              school_state_id,
              school_city_id,
            ],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );
      } else if (user_type_id == 2) {
      } else if (user_type_id == 3) {
      } else if (user_type_id == 4) {
      }
      // if any parent register then

      // if any school then insert in
      await config.sequelize.query(
        `INSERT INTO schools (user_id,enrollment_id,admission_date,school_state_id,school_city_id) VALUES (?,?,?,?,?,?)`,
        {
          replacements: [
            lastInsertedId,
            enrollment_id,
            admission_date,
            previous_school_name,
            school_state_id,
            school_city_id,
          ],
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        }
      );

      return res.status(200).json({ statusCode: 200, message: "Added" });
    } catch (error) {
      console.log("-error", error);
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
          .json({ statusCode: 203, message: "No user find" });
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
        qry = `SELECT UA.*, SP.*,  S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name FROM user_accounts UA
        LEFT JOIN states ST ON ST.state_id = UA.state_id 
        LEFT JOIN cities CT ON CT.city_id = UA.city_id
        , student_profiles SP 
        LEFT JOIN streams S ON S.stream_id = SP.stream_id 
        LEFT JOIN classes C ON C.class_id = SP.class_id 
        LEFT JOIN states SST ON SST.state_id = SP.school_state_id 
        LEFT JOIN cities CCT ON CCT.city_id = SP.school_city_id 
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

      console.log("-qry", qry);
      const dataObj = await config.sequelize.query(qry, {
        replacements: [id],
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });
      // get profile image url
      if (dataObj[0].profile_image) {
        dataObj[0].profile_image =
          IMAGE_URL +
          (await getProfileImageFolderName(user_type_id)) +
          "/" +
          dataObj[0].profile_image;
      }
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
      const { filename } = req.file ? req.file : "";

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
        const {
          admission_date,
          student_domain_id,
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
        let upPro = "";
        let query = `UPDATE student_profiles SET `;
        if (admission_date) upPro += ` admission_date = '${admission_date}',`;
        if (student_domain_id)
          upPro += ` student_domain_id = ${student_domain_id},`;
        if (dob) upPro += ` dob = '${dob}',`;
        if (filename) upPro += ` profile_image = '${filename}',`;
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
      } else if (user_type_id == 2) {
        // update egyan student
        const {
          admission_date,
          student_domain_id,
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
        let upPro = "";
        let query = `UPDATE egyan_student_profiles SET `;
        if (admission_date) upPro += ` admission_date = '${admission_date}',`;
        if (student_domain_id)
          upPro += ` student_domain_id = ${student_domain_id},`;
        if (dob) upPro += ` dob = '${dob}',`;
        if (filename) upPro += ` profile_image = '${filename}',`;
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
      } else if (user_type_id == 3) {
        const {
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

        let upPro = "";
        let query = `UPDATE school_registration SET `;
        if (filename) upPro += ` profile_image = '${filename}',`;
        if (school_name) upPro += ` school_name = '${school_name}',`;
        if (director_name) upPro += ` director_name = '${director_name}',`;
        if (director_contact_no)
          upPro += ` director_contact_no = '${director_contact_no}',`;
        if (school_admin_contact_no)
          upPro += ` school_admin_contact_no = '${school_admin_contact_no}',`;
        if (director_email) upPro += ` director_email = '${director_email}',`;
        if (school_admin_email)
          upPro += ` school_admin_email = '${school_admin_email}',`;
        if (establish_year) upPro += ` establish_year = '${establish_year}',`;
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

  async list(req, res) {
    try {
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
      listQry += ` ORDER BY U.full_name`;
      console.log("-listQry", listQry);
      const dataObj = await config.sequelize.query(listQry, {
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });
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
// Generate enrollment number
async function generateEnrollmentNo(data) {
  let enrolmentID = data.full_name.substr(0, 3);
  enrolmentID += moment().format("DDMMYY");
  enrolmentID += data.user_id;
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
    if (state_id) upPro += ` state_id = ${state_id},`;
    if (city_id) upPro += ` city_id = ${city_id},`;
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

module.exports = new UserController();
