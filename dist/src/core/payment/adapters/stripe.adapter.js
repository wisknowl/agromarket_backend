"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAdapter = void 0;
class StripeAdapter {
    constructor() {
        this.providerId = 'stripe';
        this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
    }
    async initializeEscrow(params) {
        const reference = `stripe_cs_${params.orderId}_${Date.now()}`;
        // In production, instantiate stripe.checkout.sessions.create()
        return {
            provider: this.providerId,
            transactionReference: reference,
            checkoutUrl: `https://checkout.stripe.com/pay/${reference}`,
            status: 'INITIALIZED',
        };
    }
    verifyWebhookSignature(payload, headers) {
        const signature = headers['stripe-signature'];
        if (!signature && process.env.NODE_ENV === 'production') {
            return false;
        }
        return Boolean(payload);
    }
    async disbursePayout(params) {
        const reference = `stripe_po_${params.idempotencyKey}`;
        return {
            provider: this.providerId,
            payoutReference: reference,
            status: 'SUCCESS',
            rawResponse: { recipient: params.recipientAccount, amount: params.amount, currency: params.currency },
        };
    }
}
exports.StripeAdapter = StripeAdapter;
