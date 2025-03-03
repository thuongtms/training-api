const router = require("express").Router();
const crypto = require("crypto");
const User = require("../models/User");

// Băm mật khẩu
function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}
// Hàm tạo token ngẫu nhiên
function generateToken() {
    return crypto.randomBytes(8).toString("hex");
}
//register
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const errors = [];
        if (!username || username.trim().length < 5) {
            errors.push("Tên dài ít nhất 5 ký tự");
        }
        if (!email || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(email)) {
            errors.push("Invalid email format");
        }
        if (!password || password.trim().length < 6) {
            errors.push("Mật khẩu phải dài ít nhất 6 ký tự");
        }
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email đã được sử dụng" });
        }
        // Tạo token kích hoạt
        const activationToken = generateToken();
        // Tạo user mới
        const newUser = new User({
            username,
            email,
            password: hashPassword(password),
            role: role || "user",
            isVerified: false,
            activationToken,
        });
        await newUser.save();
        console.log(
            `Activation link: http://localhost:3000/api/auth/verify-email?token=${activationToken}`
        );
        res
            .status(201)
            .json({ message: "Đăng ký thành công. Vui lòng xác thực email." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/verify-email", async (req, res) => {
    try {
        const { token } = req.query;
        console.log("Received token:", token);
        if (!token) {
            return res.status(400).json({ message: "Invalid activation link" });
        }
        const user = await User.findOne({ activationToken: token });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        user.isVerified = true;
        user.activationToken = null;
        await user.save();
        res.json({ message: "Account active successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== hashPassword(password)) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        if (!user.isVerified) {
            return res
                .status(400)
                .json({ message: "Please verify your email first" });
        }
        const token = generateToken();
        user.token = token;
        await user.save();
        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// logout
router.post("/logout", async (req, res) => {
    try {
        const token = req.headers["token"];
        if (!token) {
            return res.status(400).json({ message: "Không có token" });
        }
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(400).json({ message: "Token không hợp lệ" });
        }
        user.token = null;
        await user.save();
        res.status(200).json({ message: "Logout thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// chang-password
router.post("/change-password", async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Không tìm thấy emaily" });
        }
        // Kiểm tra mật khẩu cũ có đúng không
        if (user.password !== hashPassword(oldPassword)) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
        }
        // Cập nhật mật khẩu mới
        user.password = hashPassword(newPassword);
        await user.save();
        res.json({ message: "Mật khẩu da được cập nhật" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// rerest pw
router.post("/forget-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Không tìm thấy email" });
        }
        // Tạo token đặt lại mật khẩu
        const resetToken = generateToken();
        user.resetPasswordToken = resetToken;
        await user.save();
        console.log(
            `Reset password link: http://localhost:3000/api/auth/reset?token=${resetToken}`
        );
        res.json({ message: "Kiểm tra email để nhận liên kết" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// token reset mật khẩu
router.post("/reset-password", async (req, res) => {
    try {
        const { token } = req.query;
        const { newPassword } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Missing reset token" });
        }
        const user = await User.findOne({ resetPasswordToken: token });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }
        // Cập nhật mật khẩu mới
        user.password = hashPassword(newPassword);
        user.resetPasswordToken = null; // Xóa token sau khi sử dụng
        await user.save();
        res.json({ message: "Password reset successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// return email verify 
router.post("/resend-email", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Email not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }
        const newToken = generateToken();
        user.activationToken = newToken;
        await user.save();
        console.log(
            `New activation link: http://localhost:3000/api/auth/verify-email??token=${newToken}`
        );
        res.json({ message: "Check console for new activation link." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;