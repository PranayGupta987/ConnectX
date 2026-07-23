import { body } from "express-validator";

export const signupValidator = [
  body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("username")
    .isString()
    .isLength({ min: 3, max: 24 })
    .withMessage("Username must be 3–24 characters")
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage("Letters, numbers, dot and underscore only"),
  body("displayName").isString().trim().isLength({ min: 2, max: 60 }).withMessage("Enter your name"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Include an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Include a number"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password").isString().isLength({ min: 8 }).withMessage("Password too short"),
];

export const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token").isString().isLength({ min: 20 }).withMessage("Invalid token"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[0-9]/)
    .withMessage("Weak password"),
];

export const verifyEmailValidator = [
  body("token").isString().isLength({ min: 20 }).withMessage("Invalid token"),
];

export const googleIdTokenValidator = [
  body("idToken").isString().isLength({ min: 10 }).withMessage("Missing Google id_token"),
];
