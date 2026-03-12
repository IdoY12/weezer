import Joi from "joi";

export const userIdParamValidator = Joi.object({
    userId: Joi.string().uuid().required()
});

export const conversationIdParamValidator = Joi.object({
    conversationId: Joi.string().uuid().required()
});

export const sendMessageValidator = Joi.object({
    content: Joi.string().trim().min(1).max(5000).required()
});
