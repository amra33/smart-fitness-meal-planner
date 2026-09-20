const express = require("express");
const FoodLog = require("../models/foodlog");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// CREATE a food log entry
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { foodName, calories, protein, carbs, fat, servingSize, mealType } = req.body;

        const log = await FoodLog.create({
            userId: req.userId,
            foodName,
            calories,
            protein,
            carbs,
            fat,
            servingSize,
            mealType
        });

        res.status(201).json({ message: "Food log created", log });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET all food logs for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const logs = await FoodLog.find({ userId: req.userId }).sort({ date: -1 });
        res.json({ message: "Food logs fetched", logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE a food log entry
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const log = await FoodLog.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!log) {
            return res.status(404).json({ message: "Log not found" });
        }

        res.json({ message: "Food log deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;