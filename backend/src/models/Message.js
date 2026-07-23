import mongoose from "mongoose";

const { Schema, Types } = mongoose;

export const MESSAGE_TYPE = Object.freeze({
  TEXT: "text",
  IMAGE: "image",
  SYSTEM: "system",
});

const messageSchema = new Schema(
  {
    conversation: { type: Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Types.ObjectId, ref: "User", required: true, index: true },

    type: { type: String, enum: Object.values(MESSAGE_TYPE), default: MESSAGE_TYPE.TEXT },

    content: { type: String, default: "", maxlength: 4000 },
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },

    replyTo: { type: Types.ObjectId, ref: "Message", default: null },

    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    deletedForEveryone: { type: Boolean, default: false, index: true },

    /** Per-recipient seen tracking. */
    seenBy: {
      type: [{ user: { type: Types.ObjectId, ref: "User" }, at: { type: Date, default: Date.now } }],
      default: [],
    },
    /** Delivery to any of the recipient's sockets. */
    deliveredTo: {
      type: [{ user: { type: Types.ObjectId, ref: "User" }, at: { type: Date, default: Date.now } }],
      default: [],
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
        return ret;
      },
    },
  },
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
