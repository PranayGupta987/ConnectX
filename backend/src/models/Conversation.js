import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const conversationSchema = new Schema(
  {
    /** Sorted array of exactly 2 user ids for 1:1 conversations. */
    participants: {
      type: [{ type: Types.ObjectId, ref: "User" }],
      required: true,
      validate: [(v) => Array.isArray(v) && v.length === 2, "Conversation must have exactly 2 participants"],
      index: true,
    },
    lastMessage: { type: Types.ObjectId, ref: "Message", default: null },
    lastMessagePreview: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null, index: true },

    /** Per-user unread counters keyed by userId string. */
    unread: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        // Convert Map → plain object for JSON.
        if (ret.unread instanceof Map) ret.unread = Object.fromEntries(ret.unread);
        return ret;
      },
    },
  },
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

/** Return a deterministic participant key (sorted user ids). */
export function participantKey(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return [x, y];
}

export const Conversation = mongoose.model("Conversation", conversationSchema);
