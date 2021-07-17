const config = require("./../../config/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const saltRounds = 10;

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const checkUser = await config.sequelize.query(
        `SELECT * FROM users WHERE email = ?`,
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
      console.log("-checkUser", checkUser);
      const token =
        JWT_TOKEN_PREFIX +
        " " +
        jwt.sign({ sub: checkUser[0].id }, process.env.SECRET_KEY);

      // const { user, ...passwordw } = checkUser[0];
      delete checkUser[0].password;
      return res.status(200).json({
        statusCode: 200,
        message: "User logedin",
        data: checkUser[0],
        token,
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }

  async register(req, res) {
    try {
      const {
        full_name,
        email,
        mobile,
        state_id,
        city_id,
        role_id,

        confirm_password,
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
        `SELECT * FROM users WHERE email = ?`,
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

      await config.sequelize.query(
        `INSERT INTO users (full_name, email,mobile, state_id, city_id, role_id, password) VALUES (?,?,?,?,?,?,?)`,
        {
          replacements: [
            full_name,
            email,
            mobile,
            state_id,
            city_id,
            role_id,
            password,
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
      const { userId } = req.body;
      const user = await config.sequelize.query(
        `SELECT * FROM users WHERE id = ?`,
        {
          replacements: [userId],
          raw: true,
          type: config.sequelize.QueryTypes.SELECT,
        }
      );

      return res.status(200).json({
        statusCode: 200,
        message: "User profile data",
        data: user[0],
      });
    } catch (error) {
      console.log("-error", error);
      return res
        .status(200)
        .json({ statusCode: 203, message: "Something went wrong" });
    }
  }
}

module.exports = new AuthController();
