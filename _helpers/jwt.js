const expressJwt = require("express-jwt");
const config = require("./../config/connection");

module.exports = jwt;

function jwt() {
  const { secret, algorithms } = {
    secret: process.env.SECRET_KEY,
    algorithms: ["sha1", "RS256", "HS256"],
  };
  return expressJwt({ secret, algorithms, isRevoked }).unless({
    path: [
      // public routes that don't require authentication
      "/auth/login",
      "/auth/register",
      "/users/register",
      "/users/login",
      "/questions/upload",
    ],
  });
}

async function isRevoked(req, payload, done) {
  const usertokenId = payload.sub;
  const user = await config.sequelize.query(
    `SELECT id FROM users WHERE id = ?`,
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

  done();
}
