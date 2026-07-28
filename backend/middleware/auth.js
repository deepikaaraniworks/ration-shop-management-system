const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireStaff = (req, res, next) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }
  next();
};

const requireBeneficiary = (req, res, next) => {
  if (req.user.role !== 'beneficiary') {
    return res.status(403).json({ success: false, message: 'Beneficiary access required' });
  }
  next();
};

module.exports = { authenticateToken, requireStaff, requireBeneficiary };
