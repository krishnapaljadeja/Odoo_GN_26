const jwt = require("jsonwebtoken");
const { prisma } = require("../../db");

module.exports = async (req, res, next) => {
  try {
    jwt.verify(req.cookies.t, process.env.AUTH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
      }

      try {
        // Re-fetch the live user on every request (rather than trusting the
        // JWT payload) so role promotions and deactivation take effect
        // immediately for an already-logged-in session.
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user || user.status !== "ACTIVE") {
          return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
        }

        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          status: user.status,
          departmentId: user.departmentId,
        };

        return next();
      } catch (lookupError) {
        return next(lookupError);
      }
    });
  } catch (error) {
    return next(error);
  }
};
