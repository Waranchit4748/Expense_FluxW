// api/categories/[id]/route.js

import { connectDB } from '@/library/mongodb';
import { Category } from '@/models/Category';
import { categoryUpdateSchema } from '@/library/validators';
import { ok, error, notFound, forbidden, serverError, requireAuth } from "@/library/apiHelpers";
import mongoose from 'mongoose';

// PATCH /api/categories/[id]
export const PATCH = requireAuth(async (req, { params}, session) => {
    try {
        const body = await req.json();
        const parsed = categoryUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return error('Validation failed', 422, parsed.error.flatten().fieldErrors);
        }

        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return error('Invalid category id', 400);
        }
        const category = await Category.findById(params.id);

        if (!category || !category.isActive) return notFound('Category');

        // Users can only edit their own custom categories, not global ones
        if (category.isGlobal) {
            return forbidden('Global categories can only be modified by an admin');
        }

        if (category.createdBy?.toString() !== session.user.id) {
            return forbidden('You can only edit your own categories');
        }

        const { name, type, icon, color } = parsed.data;

        const newName = parsed.data.name ?? category.name;
        const newType = parsed.data.type ?? category.type;

        const duplicate = await Category.findOne({
            _id: { $ne: category._id },
            name: newName,
            type: newType,
            createdBy: session.user.id,
            isActive: true,
        });

        if (duplicate) {
            return error(`A '${newType}' category named '${newName}' already exists`, 409);
        }

        if (name !== undefined) category.name = name;
        if (type !== undefined) category.type = type;
        if (icon !== undefined) category.icon = icon;
        if (color !== undefined) category.color = color;
        
        await category.save();
        return ok(category)

    } catch(err) {
        return serverError(err);
    }
});

// DELETE /api/categories/[id]
// soft deletes (set isActive: false) to preserve transaction history
export const DELETE = requireAuth(async (req, { params }, session) => {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return error('Invalid category id', 400);
        }

        const category = await Category.findById(params.id);

        if (!category || !category.isActive) {
            return notFound('Category');
        }

        if (category.isGlobal) {
            return forbidden('Global categories can only be removed by an admin');
        }

        if (category.createdBy?.toString() !== session.user.id) {
            return forbidden('You can only delete your own categories');
        }
        
        category.isActive = false;
        await category.save();

        return ok({ message: 'Category removed' });
    } catch(err) {
        return serverError(err);
    }
});