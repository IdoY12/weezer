import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import User from "../../models/User";
import socket from "../../io/io";

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const query = req.query.query as string;

        if (!query || query.trim().length < 2) {
            return res.json([]);
        }

        // MySQL LIKE is case-insensitive by default with utf8mb4 collation
        const searchPattern = `%${query.trim()}%`;

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { username: { [Op.like]: searchPattern } },
                            { name: { [Op.like]: searchPattern } }
                        ]
                    },
                    {
                        id: { [Op.ne]: req.userId }
                    }
                ]
            },
            attributes: { exclude: ['password', 'email', 'googleId'] },
            limit: 20
        });

        const plainUsers = users.map(user => user.get({ plain: true }));

        res.json(plainUsers);
    } catch (e) {
        next(e);
    }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findByPk(req.userId, {
            attributes: { exclude: ['password', 'email', 'googleId'] }
        });

        if (!user) {
            return next({
                status: 404,
                message: 'User not found'
            });
        }

        res.json(user.get({ plain: true }));
    } catch (e) {
        next(e);
    }
}

export async function getUserById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password', 'email', 'googleId'] }
        });

        if (!user) {
            return next({
                status: 404,
                message: 'User not found'
            });
        }

        res.json(user.get({ plain: true }));
    } catch (e) {
        next(e);
    }
}

export async function uploadProfilePicture(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('📤 uploadProfilePicture called');
        console.log('📤 req.imageUrl:', req.imageUrl);
        console.log('📤 req.files:', req.files);
        console.log('📤 req.userId:', req.userId);
        
        if (!req.imageUrl) {
            console.error('❌ No imageUrl in request');
            return next({
                status: 400,
                message: 'No image file provided. Please ensure the file was uploaded successfully.'
            });
        }

        const user = await User.findByPk(req.userId);
        
        if (!user) {
            return next({
                status: 404,
                message: 'User not found'
            });
        }

        console.log('📤 Updating user profile picture:', {
            userId: user.id,
            oldPicture: user.profilePicture,
            newPicture: req.imageUrl
        });

        user.profilePicture = req.imageUrl;
        await user.save();

        const plainUser = user.get({ plain: true });
        delete plainUser.password;
        delete plainUser.email;
        delete plainUser.googleId;

        // Emit socket event for real-time profile picture update
        // Using string literal to avoid enum compilation issues
        const profilePicturePayload = {
            from: req.get('x-client-id') || 'stam',
            userId: user.id,
            profilePicture: user.profilePicture
        }
        
        console.log(`📤 Backend emitting user:profile-picture-updated:`, profilePicturePayload)
        socket.emit('user:profile-picture-updated', profilePicturePayload);

        console.log('✅ Profile picture updated successfully');
        res.json(plainUser);
    } catch (e) {
        console.error('❌ Error in uploadProfilePicture:', e);
        next(e);
    }
}
