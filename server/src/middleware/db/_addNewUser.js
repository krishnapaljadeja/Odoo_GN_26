const { prisma } = require("../../db");

module.exports = async (login_id, hashed_password, first_name, last_name) => {
  try {
    const user = await prisma.user.create({
      data: {
        loginId: login_id,
        hashedPassword: hashed_password,
        firstName: first_name,
        lastName: last_name || null,
      },
    });

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
