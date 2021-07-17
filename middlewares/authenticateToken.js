const jwt = require('jsonwebtoken');

const {BlacklistToken} = require("../sequelize");
const config = require("../config/connection");
const Blacklist=BlacklistToken


//MIDDLEWARE TO AUTHENTICTAE TOKEN BEFORE ACCESSING PROTECTED ROUTES
async function authenticateToken(req, res, next) {
    const ip = (req.headers['x-forwarded-for'] || '')   
          .split(',').pop().trim() ||
          req.connection.remoteAddress||                    
          req.socket.remoteAddress ||  
          req.connection.socket.remoteAddress;

  const authHeader = req.headers['authorization'];
  const bearer = authHeader && authHeader.split(' ')[0];
  if (bearer != "Bearer")
      return res.sendStatus(401);
  
    const token = authHeader && authHeader.split(' ')[1];
  if (token == null)
    return res.sendStatus(401);

  Blacklist.findOne({ where: {token: token } })
      .then((found) => {   
        if (found){
            return res
            .status(200)
            .json({ statusCode: 203, message: "Invalid Token." });
        }

        else {
            jwt.verify(token, process.env.SECRET_KEY, async (err, payload) => {
            if (err)
              return res.sendStatus(403);
            if(payload){
              console.log(payload);
              let checkUser=''
              if("attempt_id" in payload){
                 checkUser = await config.sequelize.query(
                  `SELECT email,login_ip_address FROM user_accounts WHERE user_id = ? 
                  AND is_login=True`,
                  {
                    replacements: [payload.sub],
                    raw: true,
                    type: config.sequelize.QueryTypes.SELECT,
                  }
                );
              }
              else{
                 checkUser = await config.sequelize.query(
                    `SELECT email,login_ip_address FROM user_accounts WHERE user_id = ? 
                    AND is_login=True AND login_token=?`,
                    {
                      replacements: [payload.sub,authHeader],
                      raw: true,
                      type: config.sequelize.QueryTypes.SELECT,
                    }
                  );
              }
              console.log("------",checkUser);
              if(!checkUser.length || checkUser==''){
                return res
                .status(200)
                .json({ statusCode: 203, message: "User is not authorized." });
              }
              if(checkUser[0].login_ip_address!=ip){
                return res
                .status(200)
                .json({ statusCode: 203, message: "User already login from other location." });
              }
            }
            
            req.user = payload;
            next();
          });
        }
      });

}

module.exports = authenticateToken