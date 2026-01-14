import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import useService from "../../hooks/use-service";
import StripeService from "../../services/auth-aware/StripeService";

export function CheckoutForm() {

    const stripeService = useService(StripeService)

    const stripe = useStripe()
    const elements = useElements()

    const [errorMessage, setErrorMessage] = useState<string>('')

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    async function handleSubmit(event: { preventDefault: Function }) {
        event.preventDefault()

        const { error: submitError } = await elements!.submit()
        if (submitError) {
            setErrorMessage(submitError.message!)
        }

        const data = await stripeService.createPaymentIntent()
        const { clientSecret } = data

        const stripeResponse = await stripe!.confirmPayment({
            elements: elements!,
            clientSecret,
            confirmParams: {
                return_url: 'http://localhost:5173/translations'
            }
        })

        console.log( 'hello idodod' , stripeResponse)

        if(stripeResponse.error) {
            setErrorMessage(stripeResponse.error.message!)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <button>
                Pay
            </button>
        </form>
    )
}