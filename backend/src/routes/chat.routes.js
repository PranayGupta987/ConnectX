import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validationHandler } from "../middlewares/error.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";
import {
  openConversationValidator,
  idParamValidator,
  messageIdParamValidator,
  listMessagesValidator,
  sendMessageValidator,
  editMessageValidator,
} from "../validators/chat.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", chatController.listConversations);
router.post("/", openConversationValidator, validationHandler, chatController.openConversation);
router.get("/:id", idParamValidator, validationHandler, chatController.getConversation);

router.get("/:id/messages", listMessagesValidator, validationHandler, chatController.listMessages);

router.post(
  "/:id/messages",
  uploadImage.single("image"),
  sendMessageValidator,
  validationHandler,
  chatController.sendMessage,
);

router.post("/:id/seen", idParamValidator, validationHandler, chatController.markSeen);

router.patch(
  "/messages/:messageId",
  editMessageValidator,
  validationHandler,
  chatController.editMessage,
);
router.delete(
  "/messages/:messageId",
  messageIdParamValidator,
  validationHandler,
  chatController.deleteMessage,
);

export default router;
