const router = require('express').Router();
const User = require('../models/User');

// Get all users
// router.get('/', async (req, res) => {
//     try {
//         const users = await User.find();
//         res.json(users);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });
// Get all user
// router.get('/', async (req, res) => {
//     try {
//         const query = {};
//         const {emailEnding, ...field} = req.query;
//         console.log(query);
//         if (emailEnding) {
//             const regex = new RegExp(`${emailEnding}$`, 'i');
//             const users = await User.find({ email: regex });
//             res.json(users);
//         }
//         else {
//             const users = await User.find();
//             res.json(users);
//         }
//     } catch (err) {
//         res.status(500).json({message : err.message});
//     }
// });
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        console.log("Email query:", email);
        let query = {};
        if (email && email.trim() !== '') {
            query.email = new RegExp(email, 'i');
        }
        const users = await User.find(query);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create user
router.post('/', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;