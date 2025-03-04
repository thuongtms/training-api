const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { authen , authorize} = require('../middleware/authen');

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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// cancel order
router.put("/order/:id/cancel", authen, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Tìm đơn hàng của user
        const order = await Order.findOne({ _id: id, user: userId });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }

        // Kiểm tra trạng thái đơn hàng
        if (order.status !== "processing") {
            return res.status(400).json({ message: "Không thể hủy đơn hàng khi đang ở trạng thái 'processing/shipping'." });
        }

        // Cập nhật trạng thái đơn hàng
        order.status = "canceled";
        await order.save();

        res.json({ message: "Đơn hàng đã được hủy thành công.", order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// get list order
router.get("/orders", authen, async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId });

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// detail order
router.get("/orders/:id", authen, async (req, res) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const order = await Order.findOne({ _id: id, user: userId });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }
        // Lấy danh sách productId từ đơn hàng
        const productIds = order.items.map(item => item.product);
        // Lay thông tin chi tiết sản phẩm từ Product
        const products = await Product.find({ _id: { $in: productIds } }).select("name price thumbnail");
        const orderWithDetails = {
            ...order.toObject(),
            items: order.items.map(item => ({
                product: products.find(p => p._id.toString() === item.product.toString()),
                quantity: item.quantity,
                price: item.price
            }))
        };

        return res.json({ order: orderWithDetails });

    } catch (error) {
        res.status(500).json({ error: err.message });
    }
});

// Admin cập nhật trạng thái đơn hàng
router.put("/admin/orders/:id/status", authen, authorize(["admin"]), async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        const validStatuses = ["processing", "delivered", "canceled", "shipping"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ." });
        }

        // Tìm và cập nhật trạng thái đơn hàng
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }

        return res.json({ message: "Cập nhật trạng thái thành công.", order });

    } catch (error) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;

