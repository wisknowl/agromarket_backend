"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackAdapter = void 0;
class PaystackAdapter {
    constructor() {
        this.providerId = 'paystack';
        this.supportedCurrencies = ['NGN', 'GHS', 'KES', 'ZAR'];
    }
    async initializeEscrow(params) {
        const reference = `pstk_${params.orderId}_${Date.now()}`;
        return {
            provider: this.providerId,
            transactionReference: reference,
            checkoutUrl: `https://checkout.paystack.com/${reference}`,
            status: 'INITIALIZED',
        };
    }
    verifyWebhookSignature(payload, headers) {
        const signature = headers['x-paystack-signature'];
        if (!signature && process.env.NODE_ENV === 'production') {
            return false;
        }
        return Boolean(payload);
    }
    async disbursePayout(params) {
        const reference = `pstk_trf_${params.idempotencyKey}`;
        return {
            provider: this.providerId,
            payoutReference: reference,
            status: 'SUCCESS',
            rawResponse: { recipient: params.recipientAccount, amount: params.amount, currency: params.currency },
        };
    }
}
exports.PaystackAdapter = PaystackAdapter;
