import { Router } from "express";
import { searchUsers, getCurrentUser, getUserById, uploadProfilePicture } from "../controllers/users/controller";
import validation from "../middlewares/validation";
import { searchUsersValidator, getUserValidator } from "../controllers/users/validator";
import paramValidation from "../middlewares/param-validation";
import fileUploader from "../middlewares/file-uploader";
import fileValidation from "../middlewares/file-validation";
import { profilePictureValidator } from "../controllers/users/validator";

const router = Router()

router.get('/search', validation(searchUsersValidator), searchUsers)
router.get('/me', getCurrentUser)
router.get('/:id', paramValidation(getUserValidator), getUserById)
router.post('/profile-picture', 
    fileValidation(profilePictureValidator),
    fileUploader,
    uploadProfilePicture
)

export default router
