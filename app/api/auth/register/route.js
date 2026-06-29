// api/auth/register/route.js

import { connectDB } from '@/library/mongodb';
import { User } from '@/models/User';
import { registerSchema } from '@/library/validators';
import { created, error, serverError } from '@/library/apiHelpers';

export async function POST(req) {
    try {

        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return error('Validation failed', 422, parsed.error.flatten().fieldError);
        }

        await connectDB();

        const { name, email, password } = parsed.data;

        const existing = await User.findOne({ email });
        if (existing) {
            return error('An account with this email already exists', 409);
        }

        const user = await User.create({ name, email, password });

        return created({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

    } catch( err ) {
        if (err.code === 11000) {
            return error ('An account with this email already exists', 409)
        }

        return serverError(err);
    }
}