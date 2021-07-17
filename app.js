const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const errorHandler = require(process.cwd() + "/_helpers/error-handler.js");


const jwt = require("./_helpers/jwt");
const cors = require("cors");
const app = express();
app.use(cors());

// connection to mongodb
// mongoose.connect(process.env.MONGO_URI, {
//   /* other options */
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
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
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(jwt());

const commonRouter = require("./routes/Common");
const indexRouter = require("./routes/index");
const authRouter = require("./routes/Auth");
const userRouter = require("./routes/Users");
const streamRouter = require("./routes/Streams");
const courseCatRouter = require("./routes/CourseCategory");
const subjectRouter = require("./routes/Subjects");
const classesRouter = require("./routes/Classes");
const examTypeRouter = require("./routes/ExamTypes");
const SubExamTypeRouter = require("./routes/SubExamTypes");
const courseRouter = require("./routes/Courses");
const testTypeRouter = require("./routes/TestTypes");
const examRouter = require("./routes/Exams");
const topicRouter = require("./routes/Topics");
const subTopicRouter = require("./routes/SubTopics");
const subSubTopicRouter = require("./routes/SubSubTopics");
const probActRouter = require("./routes/ProblemActualTypes");
const testSeriesRouter = require("./routes/TestSeries");
const testsRouter = require("./routes/Tests");
const qsnRouter = require("./routes/Questions");
const testQsnRouter = require("./routes/TestQuestions");
const actCodeRouter = require("./routes/CourseActivationCode");

app.use("/", indexRouter);
app.use("/commons", commonRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/course-categories", courseCatRouter);
app.use("/streams", streamRouter);
app.use("/subjects", subjectRouter);
app.use("/classes", classesRouter);
app.use("/exam-types", examTypeRouter);
app.use("/sub-exam-types", SubExamTypeRouter);
app.use("/courses", courseRouter);
app.use("/test-types", testTypeRouter);
app.use("/exam", examRouter);
app.use("/topics", topicRouter);
app.use("/sub-topics", subTopicRouter);
app.use("/sub-sub-topics", subSubTopicRouter);
app.use("/problem-actual-types", probActRouter);
app.use("/test-series", testSeriesRouter);
app.use("/tests", testsRouter);
app.use("/questions", qsnRouter);
app.use("/test-questions", testQsnRouter);
app.use("/course-activation-codes", actCodeRouter);

global.JWT_TOKEN_PREFIX = process.env.JWT_TOKEN_PREFIX;
global.IMAGE_URL = process.env.IMAGE_URL;
global.PAGE_LIMIT = process.env.PAGE_LIMIT;

process.env.TZ = "Asia/Calcutta";

app.use(errorHandler);

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });

module.exports = app;
