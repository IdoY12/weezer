import Joi from "joi";

export const searchUsersValidator = Joi.object({
    query: Joi.string().min(2).max(100).optional()
});

export const profilePictureValidator = Joi.object({
    image: Joi.object({
        mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/webp', 'image/gif').required(),
        size: Joi.number().max(5 * 1024 * 1024).required() // Max 5MB
    }).unknown(true).required()
});

export const getUserValidator = Joi.object({
    id: Joi.string().uuid().required()
});
