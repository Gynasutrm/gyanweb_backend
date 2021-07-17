const config = require("../../config/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const moment = require("moment");

class UserController {
  async register(req, res) {
    try {
      const {
        user_type_id,
        enrollment_id,
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
          data: {},
        });
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
      const lastInsertedId = result[0][0].user_id;
      //insert in pending users account
      // await config.sequelize.query(
      //   `INSERT INTO pending_user_accounts (user_id) VALUES (?)`,
      //   {
      //     replacements: [lastInsertedId],
      //     raw: true,
      //     type: config.sequelize.QueryTypes.INSERT,
      //   }
      // );
      // get enrollment id
      const getEnrolId = await generateEnrollmentNo({
        user_id: lastInsertedId,
        full_name,
      });
      // if user type is student then insert in student_profiles
      if (user_type_id == 1) {
        await config.sequelize.query(
          `INSERT INTO student_profiles (user_id,enrollment_id) VALUES (?,?)`,
          {
            replacements: [lastInsertedId, getEnrolId],
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

      return res.status(200).json({ statusCode: 200, message: "Added" });
    } catch (error) {
      console.log("-error", error);
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
      const { id, user_type_id } = req.params;
      let qry = "";
      if (user_type_id == 1) {
        qry = `SELECT UA.*, SP.* FROM user_accounts UA, student_profiles SP WHERE SP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 2) {
        qry = `SELECT UA.*, ESP.* FROM user_accounts UA, egyan_student_profiles ESP WHERE ESP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 3) {
        qry = `SELECT UA.*, S.* FROM user_accounts UA, school_registration S WHERE S.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 4) {
        qry = `SELECT UA.*, E.* FROM user_accounts UA, educators E WHERE E.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      } else if (user_type_id == 5) {
        qry = `SELECT UA.*, SP.* FROM user_accounts UA, student_parents SP WHERE SP.user_id = UA.user_id AND UA.user_id = ? AND UA.is_deleted = false`;
      }
      const dataObj = await config.sequelize.query(qry, {
        replacements: [id],
        raw: true,
        type: config.sequelize.QueryTypes.SELECT,
      });
      // remove password
      delete dataObj[0].password;
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
      const { id, user_type_id } = req.params;
      const { full_name, state_id, city_id } = req.body;
      // update users main table
      await config.sequelize.query(
        `UPDATE user_accounts SET full_name = ? ,state_id = ? ,city_id = ? WHERE user_id = ?`,
        {
          replacements: [full_name, state_id, city_id, id],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );
      if (user_type_id == 1) {
        const {
          admission_date,
          student_domain_id,
          dob,
          alternate_mobile,
          present_address_id,
          parmanent_address_id,
          stream_id,
          class_id,
          aadhar_no,
          gender,
          blood_group,
          previous_school_name,
          school_state_id,
          school_city_id,
        } = req.body;

        // update student profile
        await config.sequelize.query(
          `UPDATE student_profiles SET admission_date = ? ,student_domain_id = ? ,dob = ?,alternate_mobile = ? ,present_address_id = ? ,parmanent_address_id = ?,stream_id = ? ,class_id = ? ,aadhar_no = ?,gender = ? ,blood_group = ? ,previous_school_name = ?,school_state_id = ? ,school_city_id = ? WHERE user_id = ?`,
          {
            replacements: [
              admission_date,
              student_domain_id,
              dob,
              alternate_mobile,
              present_address_id,
              parmanent_address_id,
              stream_id,
              class_id,
              aadhar_no,
              gender,
              blood_group,
              previous_school_name,
              school_state_id,
              school_city_id,
            ],
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
      } else if (user_type_id == 2) {
        // update egyan student
        const {
          admission_date,
          student_domain_id,
          dob,
          alternate_mobile,
          present_address_id,
          parmanent_address_id,
          stream_id,
          class_id,
          aadhar_no,
          gender,
          blood_group,
          previous_school_name,
          school_state_id,
          school_city_id,
        } = req.body;
        await config.sequelize.query(
          `UPDATE egyan_student_profiles SET admission_date = ? ,student_domain_id = ? ,dob = ?,alternate_mobile = ? ,present_address_id = ? ,parmanent_address_id = ?,stream_id = ? ,class_id = ? ,aadhar_no = ?,gender = ? ,blood_group = ? ,previous_school_name = ?,school_state_id = ? ,school_city_id = ? WHERE user_id = ?`,
          {
            replacements: [
              admission_date,
              student_domain_id,
              dob,
              alternate_mobile,
              present_address_id,
              parmanent_address_id,
              stream_id,
              class_id,
              aadhar_no,
              gender,
              blood_group,
              previous_school_name,
              school_state_id,
              school_city_id,
            ],
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
      } else if (user_type_id == 3) {
        const {
          school_name,
          school_address,
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
          school_state_id,
          school_city_id,
          pincode,
        } = req.body;
        await config.sequelize.query(
          `UPDATE school_registration SET school_name = ? ,school_address = ? ,director_name = ? ,director_contact_no = ?,school_admin_contact_no = ? ,director_email = ? ,school_admin_email = ?,establish_year = ? ,registration_no = ? ,aadhar_no = ?,gst_no = ? ,pan_no = ?,school_state_id = ?,school_city_id = ?,pincode = ? WHERE user_id = ?`,
          {
            replacements: [
              school_name,
              school_address,
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
              school_state_id,
              school_city_id,
              pincode,
            ],
            raw: true,
            type: config.sequelize.QueryTypes.UPDATE,
          }
        );
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
}

async function generateEnrollmentNo(data) {
  let enrolmentID = data.full_name.substr(0, 3);
  enrolmentID += moment().format("DDMMYY");
  enrolmentID += data.user_id;
  return enrolmentID;
}

module.exports = new UserController();
