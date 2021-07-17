const config = require("../../../config/connection");
const moment = require("moment");
const jwt = require("jsonwebtoken");



class UserController {

  async profile(req, res) {
    try {        
      const id=req.user.sub; // getting data from authentication middleware token   

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
        qry = `SELECT UA.*, SP.*,SD.domain_name,SR.school_name, S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name FROM user_accounts UA
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
        qry = `SELECT UA.*, ESP.*,S.stream_name, C.class_name, ST.state_name, CT.city_name ,SST.state_name AS school_state_name, CCT.city_name AS school_city_name  FROM user_accounts UA
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

      if(!dataObj.length){
        return res
        .status(200)
        .json({ statusCode: 203, message: "User not found!" });        
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
      let returnQry="";
      const id=req.user.sub; // getting data from authentication middleware token 
      const { full_name, state_id, city_id } = req.body;
      // const { filename } = req.file ? req.file : "";
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

        // check value of given input 
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
      if (dataObj.length) {
        // remove password
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

}

// for getting the user address
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

//for selecting table based on user type
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

/// for image folder selection
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

//for saving the address
async function saveStudentAddress(obj) {
  // console.log(obj);
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
