const Sequelize = require('sequelize');
const BlacklistTokenModel = require('./models/BlacklistToken')

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: "postgres",
      port: 5432,
      dialectOptions: {
        options: {
          encrypt: true,
          requestTimeout: 3000000, // timeout = 30 seconds
          freezeTableName: true,
          enableArithAbort: true,
          validateBulkLoadParameters: true,
          multipleStatements: true,
        },
      },
      retry: {
        max: 500,
        match: [
          "Connection lost - write ECONNRESET",
          "Connection lost - read ECONNRESET",
          "Failed to connect to complianceserver.database.windows.net:1433 in 15000ms",
          "Failed to connect to complianceserver.database.windows.net:1433 - socket hang up",
          "parent: ConnectionError: Failed to connect to localhost:1433 in 15000ms",
          "Failed to connect to localhost:1433 in 15000ms",
        ],
      },
      logging: false,
      pool: { max: 100, min: 0, acquire: 30000, idle: 3000000 },
    }
  );


const BlacklistToken = BlacklistTokenModel(sequelize, Sequelize);

sequelize.sync().then(() => {
  // eslint-disable-next-line no-console
  console.log('db and tables have been created');
});

module.exports = {BlacklistToken};