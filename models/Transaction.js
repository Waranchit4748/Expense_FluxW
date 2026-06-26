import { Schema, models, model } from 'mongoose';
import { Category } from './Category';

const TransactionSchema = new Schema(
    {
        // FK: owner of the transaction
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "User reference is required"],
            index: true,
        },
        // FK: category of the transaction
        CategoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category reference is required"],
        },
        // Amount is always positive
        amount: {
            type: Number,
            require: [true, "Amount is required"],
            min: [0.01, "Amount must be greater than 0"],
        },
        // Description / note for the transaction
        description: {
            type: String,
            trim: true,
            maxlength: 255,
            default: '',
        },
        // The date of the transaction (not createdAt)
        date: {
            type: Date,
            required: [true, 'Transaction date is required'],
            index: true,
        },
        // Where this record came form : 'normal' | 'excel', 'csv', 'pdf' | 'image'
        source: {
            type: String,
            enum: ["manual", "excel", "csv", "pdf", "image"],
            default: 'manual'
        },
        extractNote: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

//
TransactionSchema.index({ userId:1, date: -1});
//
TransactionSchema.index({ userId: 1, CategoryId: 1 });

export const Transaction = models.Transaction || model("Transaction", TransactionSchema);
