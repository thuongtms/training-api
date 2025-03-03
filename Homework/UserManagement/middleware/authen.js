const User = require('../models/User');

const authen = async (req, res, next) => {
    try {
        const userID = req.headers.userid || req.headers.userID;

        if (!userID) {
            return res.status(400).json({ message: 'UserID is required' });
        }

        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ message: 'User does not exist' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// kiểm tra vai trò người dùng
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        next();
    };
};

module.exports = { authen, authorize };