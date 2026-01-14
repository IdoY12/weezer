import AuthAware from "./AuthAware";

export default class StripeService extends AuthAware {
    async createPaymentIntent() {
        const { data } = await this.axiosInstance.post(`/stripe/payment-intent`);
        return data;
    }

}
