import { useContext, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import "./Translation.css";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "../checkout-form/CheckoutForm";
import AuthContext from "../auth/auth/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Translations() {

    const authContext = useContext(AuthContext)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const isPaying = authContext?.isPay
    const [paidFromStripeRedirect, setPaidFromStripeRedirect] = useState<boolean>(
        sessionStorage.getItem("paidFromStripeRedirect") === "true"
    )

    useEffect(() => {
        if (searchParams.get("redirect_status") === "succeeded") {
            // Minimal client-side bridge: treat successful Stripe redirect as paid for current session.
            setPaidFromStripeRedirect(true)
            sessionStorage.setItem("paidFromStripeRedirect", "true")
            // Remove payment_intent/client_secret query params from the URL.
            navigate("/translations", { replace: true })
        }
    }, [navigate, searchParams])

    const canUseTranslation = Boolean(isPaying || paidFromStripeRedirect)

    const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)


    return (
        <div className="Translations">
            {canUseTranslation && 
                <>
                    transaltion form...
                </>
            }

            {!canUseTranslation && 
                <>
                    <div className="translation-header">
                        <h1 className="translation-title">Unlock Multilingual Translation</h1>
                        <div className="translation-description">
                            <p className="translation-intro">
                                This feature allows you to submit a song, poem, or any text and receive high-quality translations in <span className="highlight">7 different languages</span>.
                            </p>
                            <p className="translation-benefit">
                                Your payment grants full access to the translation form and enables instant multilingual output for your content.
                            </p>
                        </div>
                    </div>
                    <Elements stripe={stripePromise} options={{
                        mode: 'payment',
                        amount: 100,
                        currency: 'usd'
                    }}>
                        <CheckoutForm />
                    </Elements>
                </>
            }
        </div>
    )
}