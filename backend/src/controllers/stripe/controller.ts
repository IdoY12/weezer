import { NextFunction, Request, Response } from "express";
import config from 'config'
import Stripe from "stripe";
import User from "../../models/User";

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    const secret = config.get<string>('stripe.secret')
    console.log('test secret idodo', secret)

    try {
        const stripe = new Stripe(secret)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true
            },
            metadata: {
                userId: req.userId
            }
        })

        console.log('paymentIntent in "createPaymentIntent" middleware', paymentIntent)

        res.json({
            clientSecret: paymentIntent.client_secret
        })
    } catch (e) {
        next(e)
    }
}

export async function webhook(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('in webhook middleware', req.body)
        // verify the webhook with stripe
        const webhookSec = config.get<string>('stripe.whsec')
        const stripeSecret = config.get<string>('stripe.secret')

        const stripe = new Stripe(stripeSecret)

        const signature = req.get('stripe-signature')

        if (!signature) return next({ message: 'missing stripe signature' })

        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            webhookSec
        )

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                const userId = paymentIntent.metadata.userId
                if (!userId) return next({ message: 'missing userId in "webhook" middleware' })
                await User.update(
                    { isPay: true },
                    { where: { id: userId } }
                )
                break;
        }

        res.sendStatus(200)
    } catch (e) {
        next(e)
    }
}
