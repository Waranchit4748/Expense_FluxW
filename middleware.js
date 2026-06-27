// middleware.js

import { auth } from '@/library/auth';
import { NextResponse } from 'next/server';

// helper function for 
const matchRoute = (pathname, route) =>
    pathname === route || pathname.startsWith(`${route}/`)

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/transactions", "/categories"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ["/login", "/register"];

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const pathname = nextUrl.pathname;

    const isLoggedIn = !!session?.user;
    const isAdmin = session?.user?.role === "admin";

    // Redirect logged-in users away from auth pages
    if (AUTH_ROUTES.some((route) => matchRoute(pathname, route))) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }
        return NextResponse.next();
    }

    // Protect admin routes
    if (ADMIN_ROUTES.some((route) => matchRoute(pathname, route))) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', nextUrl));
        }
        if (!isAdmin) {
            // Non-admin users trying to access admin routes → redirect to their dashboard
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }
        return NextResponse.next();
    }

    // Protect dashboard and user routes
    if (PROTECTED_ROUTES.some((route) => matchRoute(pathname, route))) {
        if (!isLoggedIn) {
            const loginUrl = new URL('/login', nextUrl);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }

    // Redirect root to dashboard (or login if not authenticated)
    if (pathname === '/') {
        return NextResponse.redirect(
            new URL(isLoggedIn ? "/dashboard" : "/login", nextUrl)
        );
    }
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
    ],
};