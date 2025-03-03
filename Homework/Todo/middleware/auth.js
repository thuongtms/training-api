const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const userID = req.headers.userid || req.headers.userID;

        if (!userID) {
            return res.status(400).json({ message: 'UserID is required' });
        }

        const user = await User.findById(userID);
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports = auth;