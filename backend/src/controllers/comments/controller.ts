import { NextFunction, Request, Response } from "express";
import Comment from "../../models/Comment";
import User from "../../models/User";
import socket from "../../io/io";

export async function newComment(req: Request<{ postId: string }>, res: Response, next: NextFunction) {

    try {

        const { postId } = req.params
        const { userId } = req
        const newComment = await Comment.create({ ...req.body, userId, postId })
        await newComment.reload({
            include: [User]
        })
        res.json(newComment)
        
        const newCommentPayload = {
            from: req.get("x-client-id"),
            postId: newComment.postId,
            newComment
        }
        
        console.log(`📤 Backend emitting NewComment:`, newCommentPayload)
        socket.emit('NewComment', newCommentPayload)
    } catch (e) {
        next(e)
    }

}