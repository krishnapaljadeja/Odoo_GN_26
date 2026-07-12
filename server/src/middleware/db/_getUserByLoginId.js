const { prisma } = require("../../db");

module.exports = async (login_id) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        loginId: login_id,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      login_id: user.loginId,
      hashed_password: user.hashedPassword,
      first_name: user.firstName,
      last_name: user.lastName,
    };
  } catch (error) {
    throw error;
  }
};
