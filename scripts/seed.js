/**
 * scripts/seed.js
 * Run : node scripts/seed.js
 * 
 * defualt admin accouny
 * global income and expense categories
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env'});

import { User } from "../models/User.js";
import { Category } from "../models/Category.js";

import bcrypt from 'bcryptjs';

const GLOBAL_CATEGORIES = [
    // Income
    { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e' },
    { name: 'Freelance', type: 'income', icon: 'laptop', color: '#16a34a' },
    { name: 'Investment', type: 'income', icon: 'trending-up', color: '#15803d' },
    { name: 'Gift', type: 'income', icon: 'gift', color: '#4ade80' },
    { name: 'Bonus', type: 'income', icon: 'star', color: '#86efac' },
    { name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#bbf7d0' },

    // Expense
    { name: 'Food & Drink', type: 'expense', icon: 'utensils', color: '#f97316' },
    { name: 'Transport', type: 'expense', icon: 'car', color: '#fb923c' },
    { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#a855f7' },
    { name: 'Bills & Utilities', type: 'expense', icon: 'zap', color: '#3b82f6' },
    { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#ef4444' },
    { name: 'Entertainment', type: 'expense', icon: 'tv', color: '#ec4899' },
    { name: 'Education', type: 'expense', icon: 'book-open', color: '#06b6d4' },
    { name: 'Housing & Rent', type: 'expense', icon: 'home', color: '#8b5cf6' },
    { name: 'Travel', type: 'expense', icon: 'plane', color: '#0ea5e9' },
    { name: 'Insurance', type: 'expense', icon: 'shield', color: '#64748b' },
    { name: 'Savings & Investment', type: 'expense', icon: 'piggy-bank', color: '#10b981' },
    { name: 'Other Expense', type: 'expense', icon: 'minus-circle', color: '#94a3b8' },    
];

async function seed() {
    try { 
        console.log('Connecting to MongoDB...');
    
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing');
        }
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB connected');

        // Seed admin user 
        if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
            throw new Error('Missing seed admin credentials');
        }

        const hashedPassword = await bcrypt.hash(
            process.env.SEED_ADMIN_PASSWORD, 12
        );

        const admin = await User.findOneAndUpdate(
            { email: process.env.SEED_ADMIN_EMAIL },
            {
                $setOnInsert: {
                    name: "Admin",
                    email: process.env.SEED_ADMIN_EMAIL ,
                    password: hashedPassword,
                    role: "admin",
                    isBanned: false,
                },
            },
            { upsert: true, returnDocument: 'after' }
        );
        console.log(`Admin user: ${admin.email}`);

        let created = 0;
        let skipped = 0;

        for ( const cat of GLOBAL_CATEGORIES) {
            const result = await Category.findOneAndUpdate(
                { name: cat.name, type: cat.type, isGlobal: true},
                {
                    $setOnInsert: {
                        ...cat,
                        isGlobal: true,
                        isActive: true,
                        createdBy: admin._id,
                    },
                },
                { upsert: true, new: false}
            );

            if(result) skipped++;
            else created++;
        }
            console.log(`Categories: ${created} created, ${skipped} already existed`);
            console.log("Seed complete!");
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

seed().catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
});