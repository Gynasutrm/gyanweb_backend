const jwt = require('jsonwebtoken');

const {BlacklistToken} = require("../sequelize");
const config = require("../config/connection");
const Blacklist=BlacklistToken


function blacklistToken(req, res, next) {
  const authHeader = req.headers['authorization'];
 
  const bearer = authHeader && authHeader.split(' ')[0];
  if (bearer != "Bearer")
      return res.sendStatus(401);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log(token);
  if (token == null)
    return res.sendStatus(401);


  Blacklist.findOne({ where: {token: token } })
    .then((found) => {
      if (found){
        jwt.verify(token, process.env.SECRET_KEY, async (err, payload) => {
            if (err)
                return res.sendStatus(403);
            if(payload){
                const updateUser = await config.sequelize.query(
                    `UPDATE user_accounts set is_login=False,login_token='' WHERE user_id = ?`,
                    {
                        replacements: [payload.sub],
                        raw: true,
                        type: config.sequelize.QueryTypes.SELECT,
                    }
                );
            }

        });

        return res
        .status(200)
        .json({ statusCode: 203, message: "Invalid Token." });
      }
      else {
        jwt.verify(token, process.env.SECRET_KEY, async (err, payload) => {
          if (err)
            return res.sendStatus(403);
          if(payload){
              const checkUser = await config.sequelize.query(
                `SELECT email,login_token FROM user_accounts WHERE user_id = ? and is_login=True`,
                {
                  replacements: [payload.sub],
                  raw: true,
                  type: config.sequelize.QueryTypes.SELECT,
                }
              );
              if(checkUser.length){
                const updateUser = await config.sequelize.query(
                    `UPDATE user_accounts set is_login=False,login_token='' WHERE user_id = ?`,
                    {
                        replacements: [payload.sub],
                        raw: true,
                        type: config.sequelize.QueryTypes.SELECT,
                    }
                );
                //if token same
                if(checkUser[0].login_token==token){
                  const blacklist_token = Blacklist.create({
                      token:token
                    });
                }
                else{
                  const blacklist_token_table = Blacklist.create({
                    token:checkUser[0].login_token
                  }); 
                  const blacklist_token_user = Blacklist.create({
                    token:token
                  }); 
                }


              }
          }
          next();
        });
      }
    });
}

module.exports = blacklistToken