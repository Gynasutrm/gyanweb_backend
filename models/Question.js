const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuestionScehma = new Schema(
  {
    problem_description: {
      type: String,
    },

    multiple_options: {
      type: String,
    },
    tags: {
      type: String,
    },
    correct_options: { type: String },
    detailed_solutions: { type: String },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", QuestionScehma);
