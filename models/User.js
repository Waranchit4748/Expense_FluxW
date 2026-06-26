import moongoose, { Schema, models, model } from "mongoose";
import bcrypt from "bcryptjs";

// PEPPER
// Pepper is a server-side secret stored in env vars, never in the database.
// IMPORTANT: rotating PASSWORD_PEPPER invalidates ALL existing passwords.

// Fail loudly in production — a missing pepper is a security misconfiguration.
if (process.env.NODE_ENV === "production" && !process.env.PASSWORD_PEPPER){
    throw new Error("PASSWORD_PEPPER environment variable is required in production");
}
const PEPPER = process.env.PASSWORD_PEPPER || "dev-pepper-change-in-production";

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        email: {
            type: String,
            require: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false // Never return password in queries by default
        },
        // Role: 'user' or 'admin
        role: {
            type: String,
            enum: ['user', admin],
            default: 'user',
        },
        isBanned: {
            type: Boolean,
            defualt: false,
        },
        bannedReason: {
            type: String,
            default: null,
        },
        bannedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // for createAt, updateAt
    }
);

// Hash password before save : raw + salt + pepper
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const pepperedPassword = this.password + PEPPER;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(pepperedPassword, salt);
    next();
});

// verify password
// Must apply the same pepper before comparing, otherwise bcrypt.compare always fails.
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const pepperedCandidate = candidatePassword + PEPPER;
    return bcrypt.compare(pepperedCandidate, this.password);
}

// remove sensitive fields 
UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const User = models.User || model("User", UserSchema);