const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const nodemailer = require("nodemailer");

const router = express.Router();


// EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// CHECK EMAIL CONNECTION
transporter.verify((error, success) => {
    if (error) {
        console.error("EMAIL ERROR:", error);
    } else {
        console.log("EMAIL SERVER READY");
    }
});


// REGISTER
router.post("/register", async (req, res) => {
    try {
        let {
            name,
            email,
            password,
            age,
            height,
            weight,
            activityLevel
        } = req.body;

        email = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP valid for 5 minutes
        const otpExpires = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        let user;

        if (existingUser) {

            existingUser.name = name;
            existingUser.password = hashedPassword;
            existingUser.age = age;
            existingUser.height = height;
            existingUser.weight = weight;
            existingUser.activityLevel = activityLevel;
            existingUser.otp = otp;
            existingUser.otpExpires = otpExpires;
            existingUser.isVerified = false;

            user = await existingUser.save();

        } else {

            user = await User.create({
                name,
                email,
                password: hashedPassword,
                age,
                height,
                weight,
                activityLevel,
                otp,
                otpExpires,
                isVerified: false
            });
        }


        // SEND OTP EMAIL
        const mailResult = await transporter.sendMail({
            from: `"Smart Fitness Project" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Test Message",
            text: `Hello. Your verification code is ${otp}.`
        });


        // TERMINAL LOGS
        console.log("OTP EMAIL SENT SUCCESSFULLY");
        console.log("Sent to:", email);
        console.log("Message ID:", mailResult.messageId);
        console.log("Accepted:", mailResult.accepted);
        console.log("Rejected:", mailResult.rejected);
        console.log("Response:", mailResult.response);
        console.log("Envelope:", mailResult.envelope);


        res.status(200).json({
            message: "OTP sent to your email",
            email: email
        });


    } catch (error) {

        console.error("REGISTRATION ERROR:", error);

        res.status(500).json({
            message: "Failed to send OTP"
        });
    }
});


// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
    try {

        let { email, otp } = req.body;

        email = email.trim().toLowerCase();
        otp = otp.toString().trim();

        const user = await User.findOne({ email });


        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }


        if (user.isVerified) {
            return res.status(400).json({
                message: "Email already verified"
            });
        }


        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({
                message: "OTP not found. Please register again."
            });
        }


        if (new Date() > user.otpExpires) {
            return res.status(400).json({
                message: "OTP has expired. Please register again."
            });
        }


        if (otp !== user.otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }


        // VERIFY USER
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();


        console.log("EMAIL VERIFIED:", email);


        res.json({
            message: "Email verified successfully"
        });


    } catch (error) {

        console.error("OTP VERIFICATION ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// LOGIN
router.post("/login", async (req, res) => {
    try {

        let { email, password } = req.body;

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });


        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }


        // EMAIL MUST BE VERIFIED
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in"
            });
        }


        // CHECK PASSWORD
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }


        // CREATE JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );


        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });


    } catch (error) {

        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// PROFILE
router.get("/profile", async (req, res) => {
    try {

        const authHeader =
            req.headers.authorization;


        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "No token provided"
            });
        }


        const token =
            authHeader.split(" ")[1];


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        const user = await User.findById(
            decoded.userId
        ).select("-password -otp");


        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        res.json({
            message: "Profile fetched successfully",
            user
        });


    } catch (error) {

        console.error("PROFILE ERROR:", error);

        res.status(401).json({
            message: "Invalid or expired token"
        });
    }
});


module.exports = router;