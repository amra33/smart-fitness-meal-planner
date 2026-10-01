const express = require("express");
const Pantry = require("../models/pantry");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ADD INGREDIENT
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { ingredient, quantity, unit } = req.body;

        if (!ingredient || quantity === undefined || !unit) {
            return res.status(400).json({
                message: "Ingredient, quantity and unit are required"
            });
        }

        const item = await Pantry.create({
            userId: req.userId,
            ingredient,
            quantity,
            unit
        });

        res.status(201).json({
            message: "Ingredient added",
            item
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});


// GET USER'S PANTRY
router.get("/", authMiddleware, async (req, res) => {
    try {
        const items = await Pantry.find({
            userId: req.userId
        }).sort({ ingredient: 1 });

        res.json({
            message: "Pantry fetched",
            items
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});


// UPDATE INGREDIENT
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { ingredient, quantity, unit } = req.body;

        const item = await Pantry.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId
            },
            {
                ingredient,
                quantity,
                unit
            },
            {
                new: true
            }
        );

        if (!item) {
            return res.status(404).json({
                message: "Ingredient not found"
            });
        }

        res.json({
            message: "Ingredient updated",
            item
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});


// DELETE INGREDIENT
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const item = await Pantry.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!item) {
            return res.status(404).json({
                message: "Ingredient not found"
            });
        }

        res.json({
            message: "Ingredient deleted"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;