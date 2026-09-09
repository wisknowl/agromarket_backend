"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MtnOrangeMoMoAdapter = void 0;
class MtnOrangeMoMoAdapter {
    constructor() {
        this.providerId = 'momo_orange';
        this.supportedCurrencies = ['XAF', 'XOF'];
    }
    async initializeEscrow(params) {
        const reference = `momo_${params.orderId}_${Date.now()}`;
        return {
            provider: this.providerId,
            transactionReference: reference,
            status: 'PENDING_OTP', // Mobile Money requests prompt USSD/PIN on farmer/buyer phone
        };
    }
    verifyWebhookSignature(payload, _headers) {
        return Boolean(payload);
    }
    async disbursePayout(params) {
        const reference = `momo_payout_${params.idempotencyKey}`;
        return {
            provider: this.providerId,
            payoutReference: reference,
            status: 'SUCCESS',
            rawResponse: { phone: params.recipientAccount, amount: params.amount, currency: params.currency },
        };
    }
}
exports.MtnOrangeMoMoAdapter = MtnOrangeMoMoAdapter;
