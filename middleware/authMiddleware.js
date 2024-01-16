// authMiddleware.js

const bcrypt = require('bcryptjs');

const authUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'User is not authenticated, please try again.' });
};

const authAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(401).json({ message: 'Admin is not authenticated, please try again.' });
};

const comparePasswords = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw error;
  }
};

module.exports = { authUser, authAdmin, comparePasswords };
