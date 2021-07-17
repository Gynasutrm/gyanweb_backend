const config = require("../../config/connection");
const moment = require("moment");

class CourseActivationCodeController {
  async list(req, res) {
    try {
      const dataObj = await config.sequelize.query(
        `SELECT AC.*, CC.course_category_name, C.course_name 
        FROM course_activation_codes AC, course_categories CC, courses C 
        WHERE 
        AC.course_category_id = CC.course_category_id 
        AND AC.course_id = C.course_id 
        AND AC.is_deleted = false 
          ORDER BY AC.activation_code`,
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
  async add(req, res) {
    try {
      const {
        course_category_id,
        course_id,
        count_number,
        activation_code_start_date,
        activation_code_end_date,
        activation_validity_days,
      } = req.body;
      var data = [];
      
      for(var i=0;i<count_number;i++){
        let activation_code = await generateString(20);
        data.push(activation_code);
      }
      // return res.status(200).json({
      //   statusCode: 200,
      //   message: "Added successfully",
      //   data: data,
      // });


      let subExQry =
          "INSERT INTO course_activation_codes (course_category_id, course_id, activation_code,activation_code_start_date,activation_code_end_date,activation_validity_days) VALUES ";
        data.forEach((element) => {          
            subExQry += `(${course_category_id},${course_id},'${element}','${activation_code_start_date}','${activation_code_end_date}',${activation_validity_days}),`;
        });        
        subExQry = subExQry.slice(0, -1); // for removing last comma        
        await config.sequelize.query(subExQry, {
          raw: true,
          type: config.sequelize.QueryTypes.INSERT,
        });
      return res.status(200).json({
        statusCode: 200,
        message: count_number + " Activation code genrated successfully",
        data: {},
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }
  async view(req, res) {
    try {
      const { id } = req.params;

      const dataObj = await config.sequelize.query(
        `SELECT AC.*, CC.course_category_name, C.course_name 
        FROM course_activation_codes AC, course_categories CC, courses C 
        WHERE 
        AC.course_category_id = CC.course_category_id 
        AND AC.course_id = C.course_id 
        AND AC.is_deleted = false 
        AND course_activation_code_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
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

  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        course_category_id,
        course_id,
        activation_code_start_date,
        activation_code_end_date,
        activation_validity_days,
      } = req.body;
      const dataObj = await config.sequelize.query(
        `SELECT course_activation_code_id FROM course_activation_codes WHERE course_activation_code_id = ? AND is_deleted = false`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      let upPro = "";
      let query = `UPDATE course_activation_codes SET `;
      if (activation_code_start_date)
        upPro += ` activation_code_start_date = '${activation_code_start_date}',`;
      if (activation_code_end_date)
        upPro += ` activation_code_end_date = '${activation_code_end_date}',`;

      if (upPro) {
        query += upPro.slice(0, -1);
        query += ` WHERE course_activation_code_id = ? `;
        await config.sequelize.query(query, {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        });
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

  async delete(req, res) {
    try {
      const { id } = req.params;
      const dataObj = await config.sequelize.query(
        `SELECT * FROM course_activation_codes WHERE course_activation_code_id = ? AND is_deleted = false`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );
      if (!dataObj.length) {
        return res.status(200).json({ statusCode: 203, message: "Not exists" });
      }
      await config.sequelize.query(
        `UPDATE course_activation_codes SET is_deleted = true WHERE course_activation_code_id = ?`,
        {
          replacements: [id],
          raw: true,
          type: config.sequelize.QueryTypes.UPDATE,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Deleted successfully",
        data: {},
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async activateCode(req, res) {
    try {
      const {        
        user_id,
        activation_code,
      } = req.body;
      // const today = (moment().subtract(6, "days")).format("YYYY-MM-DD");
      var chk=0;
      const today = moment().format("YYYY-MM-DD");
      var course_end_date=moment().format("YYYY-MM-DD");
      console.log("-today", today);
      const dataObj = await config.sequelize.query(
        `SELECT * FROM course_activation_codes WHERE activation_code = ?`,
        {
          replacements: [activation_code],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      if (dataObj.length) {
        if((today >= dataObj[0].activation_code_start_date && today <= dataObj[0].activation_code_end_date)) {

          if(!dataObj[0].is_use){
            return res
              .status(200)
                .json({statusCode: 203, message: "Code already used!" });
            }
            chk=1;
            course_end_date=moment().add(dataObj[0].activation_validity_days,'days').format("YYYY-MM-DD")
        }else{
          chk=0;
          return res
            .status(200)
            .json({statusCode: 203, message: "Activation code expired!" });
        }        
      } else {
        chk=0;
        return res
          .status(200)
          .json({statusCode: 203, message: "Code does not exists!" });
      }

      
      if(chk){
        const result = await config.sequelize.query(
          `INSERT INTO student_course (
            course_id,
            user_id,
            activation_method,
            course_activation_code_id,course_end_date) VALUES (?,?,?,?,?) `,
          {
            replacements: [              
              dataObj[0].course_id,
              user_id,
              1,
              dataObj[0].course_activation_code_id,
              course_end_date
            ],
            raw: true,
            type: config.sequelize.QueryTypes.INSERT,
          }
        );

        if(result){
          //set course_activation_codes table is used
          await config.sequelize.query(
          `UPDATE course_activation_codes SET is_use=false WHERE activation_code=?`,
          {
            replacements: [dataObj[0].activation_code],
            raw: true,
            type: config.sequelize.QueryTypes.SELECT,
          });
        }

        return res.status(200).json({
          statusCode: 200,
          message: "Activated successfully",
          data: {},
        });
      }

    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async activateCodeList(req, res) {
    try {
      const today = moment().format("YYYY-MM-DD");
      const data = await config.sequelize.query(
        `SELECT SC.*,cac.activation_code, CC.course_category_name, C.course_name, U.full_name 
          FROM student_course SC,course_activation_codes cac, course_categories CC, courses C ,user_accounts U 
            WHERE 
              cac.course_activation_code_id=SC.course_activation_code_id
              AND cac.course_category_id = CC.course_category_id 
              AND cac.course_id = C.course_id 
              AND SC.user_id = U.user_id 
              `,
        {
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Used Activated Code by user!",
        data:data,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }
}

// declare all characters
const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

async function generateString(length) {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result.toUpperCase();
}

module.exports = new CourseActivationCodeController();
