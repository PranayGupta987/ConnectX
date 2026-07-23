import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { callService } from "../services/call.service.js";

export const callController = {
  history: asyncHandler(async (req, res) => {
    const data = await callService.history({ userId: req.userId, ...req.query });
    return ApiResponse.ok(res, data);
  }),

  getOne: asyncHandler(async (req, res) => {
    const data = await callService.get({ userId: req.userId, callId: req.params.id });
    return ApiResponse.ok(res, data);
  }),

  clear: asyncHandler(async (req, res) => {
    const data = await callService.clearHistory({ userId: req.userId });
    return ApiResponse.ok(res, data, "History cleared");
  }),
};
