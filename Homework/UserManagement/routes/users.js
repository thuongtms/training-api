const express = require('express');
const User = require('../models/User');
const { authen, authorize } = require('../middleware/authen');
const router = express.Router();

// get list user (admin)
router.get('/', authen, authorize(['admin']), async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// get profile
router.get('/me', authen, async (req, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// update profile
router.put('/me', authen, async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        if (username) user.username = username;
        if (email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: 'Email không hợp lệ' });
            }
            user.email = email;
        }

        await user.save();
        res.json({ message: 'Cập nhật thành công', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// delete user
router.delete('/:id', authen, authorize(['admin']), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        res.json({ message: 'Xóa tài khoản thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;