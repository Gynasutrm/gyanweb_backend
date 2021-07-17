const expressJwt = require("express-jwt");
const config = require("../config/connection");

module.exports = jwt;

function jwt() {
  const { secret, algorithms } = {
    secret: process.env.SECRET_KEY,
    algorithms: ["sha1", "RS256", "HS256"],
  };
  return expressJwt({ secret, algorithms, isRevoked }).unless({
    path: [
      // public routes that don't require authentication
      "/api/auth/login",
      "/api/auth/register",
    ],
  });
}

async function isRevoked(req, payload, done) {
  const usertokenId = payload.sub;
  const user = await config.sequelize.query(
    `SELECT user_id,user_type_id FROM user_accounts WHERE user_id = ?`,
    {
      replacements: [usertokenId],
      raw: true,
      type: config.sequelize.QueryTypes.SELECT,
    }
  );

  // // revoke token if user no longer exists
  if (!user.length) {
    return done(null, true);
  }
  req.body.userId = usertokenId;
  req.body.userTypeId = user[0].user_type_id;

  done();
}
