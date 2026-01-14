import { useContext } from "react";
import { loadStripe } from "@stripe/stripe-js";
import "./Translation.css";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "../checkout-form/CheckoutForm";
import AuthContext from "../auth/auth/AuthContext";

export default function Translations() {

    const authContext = useContext(AuthContext)

    const isPaying = authContext?.isPay

    const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)


    return (
        <div className="Translations">
            {isPaying && 
                <>
                    transaltion form...
                </>
            }

            {!isPaying && 
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