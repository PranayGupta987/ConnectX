import mongoose from "mongoose";

const { Schema, Types } = mongoose;

export const AI_ROLES = Object.freeze({
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
});

const aiMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: Object.values(AI_ROLES),
      required: true,
    },
    content: { type: String, required: true, maxlength: 32_000 },
    model: { type: String, default: null },
    tokens: { type: Number, default: null },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } },
);

const aiConversationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    messages: { type: [aiMessageSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        if (Array.isArray(ret.messages)) {
          ret.messages = ret.messages.map((m) => {
            const mid = m._id?.toString?.() ?? m.id;
            const { _id, ...rest } = m;
            return { ...rest, id: mid };
          });
        }
        return ret;
      },
    },
  },
);

aiConversationSchema.index({ user: 1, updatedAt: -1 });

export const AIConversation = mongoose.model("AIConversation", aiConversationSchema);
