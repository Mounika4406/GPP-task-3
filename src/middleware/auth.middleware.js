module.exports = (req, res, next) => {
  // TEMP simulated user
  req.user = {
    id: 1,
    tier: "GOLD",
  };
  next();
};
