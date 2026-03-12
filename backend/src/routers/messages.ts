import { Router } from "express";
import validation from "../middlewares/validation";
import paramValidation from "../middlewares/param-validation";
import {
    conversationIdParamValidator,
    sendMessageValidator,
    userIdParamValidator
} from "../controllers/messages/validator";
import {
    getConversationMessages,
    getConversations,
    markConversationAsRead,
    sendMessageToUser
} from "../controllers/messages/controller";

const router = Router();

router.get("/conversations", getConversations);
router.get(
    "/conversations/:conversationId",
    paramValidation(conversationIdParamValidator),
    getConversationMessages
);
router.post(
    "/conversations/:conversationId/read",
    paramValidation(conversationIdParamValidator),
    markConversationAsRead
);
router.post(
    "/with/:userId",
    paramValidation(userIdParamValidator),
    validation(sendMessageValidator),
    sendMessageToUser
);

export default router;
