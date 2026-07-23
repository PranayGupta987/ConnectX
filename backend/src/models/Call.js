import mongoose from "mongoose";

const { Schema, Types } = mongoose;

export const CALL_TYPES = { AUDIO: "audio", VIDEO: "video" };
export const CALL_STATUS = {
  RINGING: "ringing",
  ONGOING: "ongoing",
  ENDED: "ended",
  MISSED: "missed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  FAILED: "failed",
};

const callSchema = new Schema(
  {
    caller: { type: Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(CALL_TYPES), required: true },
    status: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: CALL_STATUS.RINGING,
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    connectedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    durationSec: { type: Number, default: 0 },
    endedBy: { type: Types.ObjectId, ref: "User", default: null },
    endReason: { type: String, default: null },
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

callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ receiver: 1, createdAt: -1 });

export const Call = mongoose.model("Call", callSchema);
