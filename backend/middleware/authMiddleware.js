const jwt = require("jsonwebtoken");
const httpError = require("../utils/httpError");

const protect = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return next(httpError(401, "Not authorized, no token"));
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    return next();
  } catch (error) {
    return next(httpError(401, "Not authorized, token failed"));
  }
};

module.exports = protect;
