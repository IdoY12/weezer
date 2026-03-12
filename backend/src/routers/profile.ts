import { Router } from "express";
import { createPost, deletePost, getPost, getProfile, getProfileByUserId, updatePost } from "../controllers/profile/controller";
import validation from "../middlewares/validation";
import { getPostValidator, getUserProfileValidator, newPostImageValidator, newPostValidator, updatePostValidator } from "../controllers/profile/validator";
import paramValidation from "../middlewares/param-validation";
import fileUploader from "../middlewares/file-uploader";
import fileValidation from "../middlewares/file-validation";

const router = Router()
router.get('/', getProfile)
router.get('/user/:userId',
    paramValidation(getUserProfileValidator),
    getProfileByUserId
)
router.get('/:id',
    paramValidation(getPostValidator),
    getPost
)
router.delete('/:id', deletePost)
router.post('/',
    validation(newPostValidator), 
    fileValidation(newPostImageValidator),
    fileUploader, 
    createPost
)
router.patch('/:id', 
    validation(updatePostValidator), 
    updatePost
)

export default router