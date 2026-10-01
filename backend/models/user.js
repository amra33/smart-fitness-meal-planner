const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    age: Number,

    height: Number,

    weight: Number,

    activityLevel: String,

    isVerified: {
        type: Boolean,
        default: false
    },

    otp: {
        type: String
    },

    otpExpires: {
        type: Date
    }

});

module.exports = mongoose.model("User", userSchema);