// library/auth.js

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({

    secret: process.env.AUTH_SECRET,

    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email'},
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    await connectDB();
                    const email = String(credentials.email).trim().toLowerCase();
                    const user = await User.findOne({ email }).select("+password");

                    if (!user) {
                        return null;
                    }

                    if (user.isBanned) {
                        return null;
                    }

                    const isValid = await user.comparePassword(String(credentials.password));
                    if (!isValid) {
                        return null;
                    }

                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };
                } catch (error) {
                    console.error("Authorize Error:", error);
                    return null;
                }
            },
        }),
    ],

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 60 * 60 * 24,
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.name = user.name;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.name = token.name;
                session.user.email = token.email;
            }
            return session;
        },
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },
});