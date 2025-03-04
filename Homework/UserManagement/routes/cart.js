const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authen } = require('../middleware/authen');

// Thêm sản phẩm vào giỏ hàng
// http://localhost:3000/api/cart/add
router.post("/cart/add", authen, async (req, res) => {
    try {
        // Lấy userId từ token sau khi xác thực
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        // Kiểm tra nếu productId không có
        if (!productId) {
            return res.status(400).json({ message: "Thiếu productId" });
        }
        // Tìm sản phẩm trong database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }
        // Kiểm tra số lượng hợp lệ
        if (quantity <= 0) {
            return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
        }
        // Kiểm tra xem sản phẩm đã có trong giỏ của user chưa
        let cartItem = await Cart.findOne({ userId, productId });
        if (cartItem) {
            // Nếu đã có, tăng số lượng
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            // Nếu chưa có, thêm mới
            cartItem = new Cart({
                userId,
                productId,
                name: product.name,
                price: product.price,
                quantity,
                thumbnail: product.thumbnail,
            });
            await cartItem.save();
        }
        res.status(201).json({ message: "Thêm vào giỏ hàng thành công", cartItem });
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
});
// update quantity product in cart
// http://localhost:3000/api/cart/update
router.put("/cart/update", authen, async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const { productId, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Thiếu productId" });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
        }

        let cartItem = await Cart.findOne({ userId, productId });

        if (!cartItem) {
            return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.json({ message: "Cập nhật thành công", cartItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// delete quantity product in cart
// http://localhost:3000/api/cart/delete
router.delete("/cart/delete", authen, async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Thiếu productId" });
        }

        const cartItem = await Cart.findOne({ userId, productId });

        if (!cartItem) {
            return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
        }

        await Cart.deleteOne({ userId, productId });

        res.json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// get list product in cart
// http://localhost:3000/api/cart
router.get("/cart", authen, async (req, res) => {
    try {
        const userId = req.user.id; 

        const cartItems = await Cart.find({ userId }).populate("productId");

        res.json({
            message: "Lấy danh sách giỏ hàng thành công",
            cart: cartItems,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
