// library/validators.js

import { z } from 'zod';

const objectIdRegex = new RegExp("^[0-9a-fA-F]{24}$");

// Auth

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(50),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().trim().min(6).max(100)
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
});

// Transactions

export const transactionSchema = z.object({
    categoryId: z.string().min(1, 'Category is required'),
    amount: z.coerce.number().positive('Amount must be positive'),
    description: z.string().trim().max(255).optional().default(''),
    date: z.coerce.date('Invalid date'),
    source: z.enum(['manual', 'excel', 'csv', 'pdf', 'image']).optional().default("manual"),
    extractNote: z.string().optional().nullable(),
});

export const transactionUpdateSchema = transactionSchema.partial();

// Query params for listing transactions
export const transactionQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    // filter by category id
    categoryId: z.string().regex(objectIdRegex, 'Invalid category id').optional(),
    // filter by type ('income' | 'expense')
    type: z.enum(['income', 'expense']).optional(),
    // date range
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    // sort field and direction
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().trim().max(100).optional(),
});

// Categories

export const categorySchema = z.object({
    name: z.string().min(1, "Name is required").max(50).trim(),
    type: z.enum(["income", "expense"]),
    icon: z.string().optional().default("tag"),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
        .optional()
        .default("#6366f1"),
});

export const categoryUpdateSchema = categorySchema.partial();

// Admin

export const banUserSchema = z.object({
    isBanned: z.boolean(),
    bannedReason: z.string().max(200).optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.isBanned && !data.bannedReason?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['bannedReason'],
            message: 'Banned reason is required',
        });
    }
});

export const adminCategorySchema = categorySchema.extend({
    isGlobal: z.boolean().optional().default(true),
});