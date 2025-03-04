const User = require("../models/User");

const authen = async (req, res, next) => {
    try {
        const token = req.headers["token"];

        if (!token) {
            return res.status(401).json({ message: "Không có token, không được phép truy cập" });
        }

        // Kiểm tra user có tồn tại với token không
        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại hoặc token không hợp lệ" });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Kiểm tra quyền admin
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập" });
        }
        next();
    };
};

module.exports = { authen, authorize };
