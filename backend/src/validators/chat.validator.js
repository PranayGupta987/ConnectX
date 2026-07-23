import { body, param, query } from "express-validator";

export const openConversationValidator = [body("userId").isMongoId()];

export const idParamValidator = [param("id").isMongoId()];

export const messageIdParamValidator = [param("messageId").isMongoId()];

export const listMessagesValidator = [
  param("id").isMongoId(),
  query("before").optional().isISO8601(),
  query("limit").optional().toInt().isInt({ min: 1, max: 100 }),
];

export const sendMessageValidator = [
  param("id").isMongoId(),
  body("content").optional().isString().isLength({ max: 4000 }),
  body("replyTo").optional().isMongoId(),
];

export const editMessageValidator = [
  param("messageId").isMongoId(),
  body("content").isString().trim().isLength({ min: 1, max: 4000 }),
];
