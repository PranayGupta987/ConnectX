import mongoose from "mongoose";

const { Schema, Types } = mongoose;

export const FRIEND_REQUEST_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
});

const friendRequestSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: Object.values(FRIEND_REQUEST_STATUS),
      default: FRIEND_REQUEST_STATUS.PENDING,
      index: true,
    },
    respondedAt: { type: Date, default: null },
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

// Only one *pending* request between two users at a time (either direction).
friendRequestSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
