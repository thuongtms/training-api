const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        thumbnail: {
          type: String,
        },
      },
    ],
    total: Number,
    status: {
      type: String,
      enum: ["processing", "delivered", "canceled", "shipping"],
      default: "processing",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
  },
  
);

module.exports = mongoose.model("Order", orderSchema);