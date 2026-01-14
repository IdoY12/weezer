import { Router } from "express";
import { translate } from "../controllers/openai/controller";

const router = Router()

router.post('/translate', translate)

export default router