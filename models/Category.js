import {Schema, models, model } from "moongoose";
import { timeStamp } from "node:console";

const CategorySchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxlength: 50,
        },
        //  'income' or 'expense'
        type: {
            type: String,
            enum: ['income', 'expense'],
            require: [true, 'Category type is required'],
        },
        // Icon identifier (emoji or lucide icon name) for UI display
        icon: {
            type: String,
            default: 'tag'
        },
        // Color hex for UI display
        color: {
            type: String,
            defualt: "#6366f1",
            match: [/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"],
        },
        // null = global (created by admin, available to all users)
        creatBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        isGlobal: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timeStamps: true,
    }
);

// user cannot have duplicate category names of the same type
CategorySchema.index({ name: 1, type: 1, createdBy: 1}, { unique: true});

export const Category = models.Category || model("Category", CategorySchema);