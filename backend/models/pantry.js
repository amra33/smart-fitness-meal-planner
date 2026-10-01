const mongoose = require("mongoose");

const pantrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    ingredient: {
        type: String,
        required: true,
        trim: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 0
    },

    unit: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Pantry", pantrySchema);