const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const errorHandler = require(process.cwd() + "/_helpers/error-handler.js");

const jwt = require("./_helpers/jwt_api");
const cors = require("cors");
const app = express();
app.use(cors());

//mongo db conection
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  autoIndex: false, // Don't build indexes
  poolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};
mongoose.connect(process.env.MONGO_URI, options, function (err) {
  if (err) {
    console.log("--err");
    throw err;
  }
  console.log("Connection has been established for Mongodb.");
});
mongoose.Promise = global.Promise;
mongoose.set("debug", true);

// view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
//app.use(jwt());

const commonRouter = require("./apis/routes/Common");
const indexRouter = require("./apis/routes/index");
const authRouter = require("./apis/routes/Auth");
const userRouter = require("./apis/routes/Users");
const userResponse = require("./apis/routes/Response");


app.use("/api/commons", commonRouter);
app.use("/api/", indexRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/response", userResponse);


global.JWT_TOKEN_PREFIX = process.env.JWT_TOKEN_PREFIX;
global.IMAGE_URL = process.env.IMAGE_URL;

process.env.TZ = "Asia/Calcutta";

app.use(errorHandler);

module.exports = app;
