const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResponseScehma = new Schema(
  {
    question_id: {
      type: Number,
    },
    correct_options: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ResponseSave", ResponseScehma);
