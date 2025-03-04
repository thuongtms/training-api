const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { authen } = require('../middleware/authen');

// create order
// http://localhost:3000/api/order
router.post("/order", authen, async (req, res) => {
    try {
        const userId = req.user.id; 
        const { productIds } = req.body; 

        if (!productIds || productIds.length === 0) {
            return res.status(400).json({ message: "Vui lòng chọn ít nhất một sản phẩm để đặt hàng" });
        }

        // Tìm tất cả sản phẩm trong giỏ hàng của user có trong danh sách productIds
        const cartItems = await Cart.find({ userId, productId: { $in: productIds } });

        if (cartItems.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng" });
        }

        // Tạo danh sách sản phẩm cho đơn hàng
        const orderItems = cartItems.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
            thumbnail: item.thumbnail,
        }));

        // Tính tổng giá trị đơn hàng
        const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Tạo đơn hàng mới
        const newOrder = new Order({
            user: userId,
            items: orderItems,
            total: total,
            status: "processing",
        });

        await newOrder.save();

        // Xóa các sản phẩm đã đặt khỏi giỏ hàng
        await Cart.deleteMany({ userId, productId: { $in: productIds } });

        res.status(201).json({ message: "Đặt hàng thành công", order: newOrder });
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
});

// confirm order
router.put("/order/:id/confirm", authen, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        // Kiểm tra trạng thái hợp lệ
        if (!["delivered", "canceled"].includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ." });
        }

        // Tìm đơn hàng
        const order = await Order.findOne({ _id: id, user: userId });
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng hoặc bạn không có quyền xác nhận đơn hàng này." });
        }

        // Cập nhật trạng thái đơn hàng
        order.status = status;
        await order.save();

        res.json({ message: "Xác nhận đơn hàng thành công", order });
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
});

module.exports = router;

