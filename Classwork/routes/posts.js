const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post')

router.get('/', async (req, res) => {
    try {
        const { author, status, userId, month, count } = req.query;
        let query = {};
        if (author && author.trim() !== '') {
            const user = await User.findOne({ name: new RegExp(author, 'i') });
            if (user) {
                query.author = user._id;
            }
        }
        if (status) {
            query.status = status == 'true';
        }
        if (userId) {
            query.author = userId;
        }
        if (month) {
            const now = new Date();
            const currentMonth = new Date().getMonth() + 1;
            const queryMonth = parseInt(month, 10);

            if (queryMonth !== currentMonth) {
                return res.status(400).json({ message: "Chỉ có thể lọc bài viết trong tháng hiện tại." });
            }
            query.createdAt = {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            };
        }
        if (count === 'true') {
            const postCount = await Post.countDocuments(query);
            return res.json({ count_post: postCount });
        }
        const posts = await Post.find(query).populate('author', 'name');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// create post
router.post('/', async (req, res) => {
    const { author, title, content } = req.body;
    const user = await User.findById(author);
    if (!user) {
        res.status(400).json({ message: err.author })
    }
    const post = new Post({ author, title, content, status: true });
    try {
        const newPost = await post.save();
        res.status(201).json({ post: newPost });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//update
router.put('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post) {
            post.title = req.body.title || post.title;
            post.content = req.body.content || post.content;
            post.status = req.body.status || post.status;
            post.updatedAt = Date.now();
            const updatedPost = await post.save();
            res.json(updatedPost);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//Delete post
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post) {
            await post.deleteOne();
            res.json({ message: 'Post deleted' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;