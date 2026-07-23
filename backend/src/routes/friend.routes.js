import { Router } from "express";
import { friendController } from "../controllers/friend.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validationHandler } from "../middlewares/error.middleware.js";
import {
  searchUsersValidator,
  sendRequestValidator,
  idParamValidator,
} from "../validators/friend.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/search", searchUsersValidator, validationHandler, friendController.searchUsers);

router.get("/", friendController.listFriends);
router.delete("/:id", idParamValidator, validationHandler, friendController.removeFriend);

router.get("/requests/incoming", friendController.listIncomingRequests);
router.get("/requests/outgoing", friendController.listOutgoingRequests);

router.post("/requests", sendRequestValidator, validationHandler, friendController.sendRequest);
router.post("/requests/:id/accept", idParamValidator, validationHandler, friendController.acceptRequest);
router.post("/requests/:id/reject", idParamValidator, validationHandler, friendController.rejectRequest);
router.delete("/requests/:id", idParamValidator, validationHandler, friendController.cancelRequest);

export default router;
