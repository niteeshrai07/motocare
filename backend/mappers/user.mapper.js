const buildUserResponse = (user) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
};

module.exports = buildUserResponse;