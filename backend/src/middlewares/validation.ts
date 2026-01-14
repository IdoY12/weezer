import { NextFunction, Request, Response } from "express";
import { ObjectSchema, ValidationError } from "joi";

export default function validation(validator: ObjectSchema) {
    return async function (req: Request, res: Response, next: NextFunction) {
        try {
            // Validate with options to allow unknown fields (like confirmPassword) but strip them
            req.body = await validator.validateAsync(req.body, { 
                allowUnknown: true, 
                stripUnknown: true 
            })
            next()
        } catch (e) {
            // Format Joi validation errors to be more user-friendly
            if (e instanceof ValidationError && e.details && e.details.length > 0) {
                const firstError = e.details[0];
                const field = firstError.path.join('.');
                let message = firstError.message;
                
                // Make error messages more user-friendly
                if (firstError.type === 'string.min') {
                    message = `${field === 'username' ? 'Username' : field === 'password' ? 'Password' : field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${firstError.context?.limit} characters`;
                } else if (firstError.type === 'string.email') {
                    message = 'Please enter a valid email address';
                } else if (firstError.type === 'any.required') {
                    message = `${field === 'username' ? 'Username' : field === 'password' ? 'Password' : field === 'email' ? 'Email' : field.charAt(0).toUpperCase() + field.slice(1)} is required`;
                } else {
                    // Use Joi's message but remove field path prefix if present
                    message = message.replace(/^"[^"]*" /, '');
                }
                
                return next({
                    status: 422,
                    message: message
                })
            }
            
            next({
                status: 422,
                message: e.message || 'Validation error'
            })
        }
    }

}