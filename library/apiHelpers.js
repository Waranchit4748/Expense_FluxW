// library/apiHelpers.js

import { auth } from '@/library/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/library/mongodb';
import { User } from '@/models/User';

// Standardised API response helpers

// function when read data complete
export function ok(data, status = 200) {
    return NextResponse.json({ success: true, data}, { status });
}

// function when create new data complete
export function created(data) {
    return ok(data, 201);
}

// fuction when error by client side
export function error(message, status = 400, details = null) {
    const body = { success: false, message};
    if (details) body.details = details;
    return NextResponse.json(body, {status});
}

// fuction when search data not found 
export function notFound(resource = 'Resource') {
    return error(`${resource} not found`, 404);
}

// function when not access
export function forbidden(message = 'Access denied') {
    return error(message, 403)
}

// fuction when unauthorized
export function unauthorized(message = 'Authentication required') {
    return error(message, 401);
}

// function when error by server side
export function serverError(err) {
    console.error('[API Error]', err?.stack || err);
    return error('Internal server error', 500);
}

// Auth guard wrappers

/**
 * requireAuth(handler)
 * Returns 401 if not logged in or account is banned.
 * 
 * Usage : export const GET = requireAuth(async (req, ctx, session) => { ... })
 */
export function requireAuth(handler){
    return async (req, ctx) => {
        try {
            const session = await auth();

            if (!session?.user) {
                return unauthorized();
            }

            await connectDB();
            const user = await User.findById(session.user.id);

            if (!user)
                return unauthorized();

            if (user.isBanned)
               return forbidden("Account suspended"); 

            return handler(req, ctx, session);

        } catch (error) {
            return serverError(error);
        }
    };
}

/**
 * requireAdmin(handler)
 * requireAuth but additionally enforces role === 'admin'.
 */
export function requireAdmin(handler) {
    return async (req, ctx) => {
        try {
            const session = await auth();

            if (!session?.user) {
                return unauthorized();
            }
            await connectDB();
            const user = await User.findById(session.user.id);

            if (!user) {
                return unauthorized();
            }

            if (user.isBanned) {
                return forbidden('Account suspended');
            }
            
            if (user.role !== 'admin') {
                return forbidden("Admin access required");
            }

            return handler(req, ctx, session);
        } catch (error) {
            return serverError(error);
        }
    };
} 