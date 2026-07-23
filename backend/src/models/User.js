import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, Types } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-zA-Z0-9_.]+$/,
      index: true,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    passwordHash: { type: String, select: false },
    avatarUrl: { type: String, default: null },
    coverUrl: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 280 },
    status: { type: String, default: null, maxlength: 80 },

    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, index: true, sparse: true },

    isVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    refreshTokenHashes: { type: [String], default: [], select: false },

    // Social graph
    friends: { type: [{ type: Types.ObjectId, ref: "User" }], default: [], index: true },
    blocked: { type: [{ type: Types.ObjectId, ref: "User" }], default: [] },

    // Presence
    isOnline: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: null },

    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        delete ret.refreshTokenHashes;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  },
);

userSchema.index({ displayName: "text", username: "text", email: "text" });

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

userSchema.methods.verifyPassword = async function verifyPassword(plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

export const User = mongoose.model("User", userSchema);

/** Minimal public projection used across friend/chat responses. */
export const USER_PUBLIC_FIELDS = "id username displayName avatarUrl coverUrl bio status isOnline lastSeen";
