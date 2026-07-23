import mongoose from "mongoose";

const { Schema, Types } = mongoose;

export const NOTIFICATION_TYPES = Object.freeze({
  FRIEND_REQUEST: "friend_request",
  FRIEND_ACCEPTED: "friend_accepted",
  NEW_MESSAGE: "new_message",
  AI_MENTION: "ai_mention",
  SYSTEM: "system",
});

const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: "", trim: true, maxlength: 1000 },
    actor: { type: Types.ObjectId, ref: "User", default: null },
    /** Optional structured metadata (conversationId, messageId, requestId, url…) */
    data: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
