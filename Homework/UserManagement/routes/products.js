const express = require('express');
const Product = require('../models/Product');
const { authen, authorize } = require('../middleware/authen');
const router = express.Router();

// thêm sản phẩm mới
router.post("/admin/products", authen, authorize(["admin"]), async (req, res) => {
    try {
        let { name, description, sku, price, qty, thumbnail, image } = req.body;
        if (name.length < 3 || name.length > 100) {
            return res.status(400).json({ message: "Tên sản phẩm phải từ 3 đến 100 ký tự." });
        }
        if (description.length < 5 || description.length > 500) {
            return res.status(400).json({ message: "Mô tả sản phẩm phải từ 5 đến 500 ký tự." });
        }
        if (sku.length < 3 || sku.length > 20) {
            return res.status(400).json({ message: "Mã SKU phải từ 3 đến 20 ký tự." });
        }
        if (price < 0) {
            return res.status(400).json({ message: "Giá sản phẩm phải lớn hơn 0." });
        }
        if (qty < 0) {
            return res.status(400).json({ message: "Số lượng phải lớn hơn 0." });
        }
        if (!thumbnail) thumbnail = `https://picsum.photos/200`;
        if (!image) image = `https://picsum.photos/seed/picsum/200/300`;
        const newProduct = new Product({ name, description, sku, price, qty, thumbnail, image });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;