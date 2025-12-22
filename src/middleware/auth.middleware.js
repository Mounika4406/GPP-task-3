module.exports = (req, res, next) => {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({ error: "User required" });
  }

  req.user = {
    id: Number(userId),
    tier: req.header("x-user-tier") || "REGULAR"
  };

  next();
};
