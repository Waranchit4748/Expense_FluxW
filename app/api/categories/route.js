// api/categories/route.js

import { connectDB } from '@/library/mongodb';
import { Category } from '@/models/Category';
import { categorySchema } from '@/library/validators';
import { ok, create, error, serverError, requireAuth} from '@/library/apiHelpers';

/**
 * Get /api/categories
 * return : global categories + user own custom categories
 */
export const GET = requireAuth(async (req, createContext, session) => {
    try {
        await connectDB();

        const categories = await Category.find({
            isActive: true,
            $or: [{ isGlobal: true }, { createdBy: session.user.id }],
        })
            .sort({ isGlobal: -1, type: 1, name: 1}).lean();

        return ok(categories);
    } catch (err) {
        return serverError(err);
    }
});

/**
 * POST /api/categories
 * // create a user-specific custom category (isGlobal : false)
 */
export const POST = requireAuth(async (req, createContext, session) => {
    try {
        const body = await req.json();
        const parsed = categorySchema.safeParse(body);

        if (!parsed.success) {
            return error('Validation failed', 422, parsed.error.flatten().fieldErrors);
        }

        await connectDB();

        const { name, type, icon, color } = parsed.data;

        const duplicate = await Category.findOne({
            name: new RegExp(`^${name}$`, "i"),
            type,
            createdBy: session.user.id,
            isActive: true,
        });

        if (duplicate) {
            return error(`A '${type}' category named '${name}' already exists`, 409);
        }

        const category = await Category.create({
            name,
            type,
            icon,
            color,
            createdBy: session.user.id,
            isGlobal: false,
        });

        return created(category);

    } catch(err) {
        if (err.code === 11000) {
            return error('Category already exists', 409);
        }

        return serverError(err);
    }
});