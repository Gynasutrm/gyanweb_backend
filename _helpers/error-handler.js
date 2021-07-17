module.exports = errorHandler;

function errorHandler(err, req, res, next) {
  console.log(err);
  if (typeof err === "string") {
    // custom application error
    return res.status(200).json({ message: err });
  }

  if (err.name === "ValidationError") {
    // mongoose validation error
    return res.status(200).json({ status: 203, message: err.message });
  }

  if (err.name === "UnauthorizedError") {
    // jwt authentication error
    return res.status(440).json({ status: 440, message: "Invalid Token" });
  }

  // default to 500 server error
  return res.status(500).json({ message: err.message });
}
