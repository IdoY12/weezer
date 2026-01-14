import { Router } from "express";
import express from "express";
import { createPaymentIntent } from "../controllers/stripe/controller";

const router = Router()

router.post('/payment-intent', createPaymentIntent)

export default router