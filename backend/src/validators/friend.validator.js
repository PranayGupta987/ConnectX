import { body, param, query } from "express-validator";

export const searchUsersValidator = [
  query("q").optional().isString().trim().isLength({ max: 80 }),
  query("page").optional().toInt().isInt({ min: 1 }),
  query("limit").optional().toInt().isInt({ min: 1, max: 50 }),
];

export const sendRequestValidator = [
  body("receiverId").isMongoId().withMessage("Invalid user id"),
];

export const idParamValidator = [param("id").isMongoId().withMessage("Invalid id")];
