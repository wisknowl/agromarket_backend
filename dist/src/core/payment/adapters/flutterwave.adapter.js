"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveAdapter = void 0;
class FlutterwaveAdapter {
    constructor() {
        this.providerId = 'flutterwave';
        this.supportedCurrencies = ['USD', 'NGN', 'KES', 'GHS', 'UGX', 'TZS', 'RWF', 'ZMW', 'XAF', 'XOF'];
    }
    async initializeEscrow(params) {
        const reference = `flw_tx_${params.orderId}_${Date.now()}`;
        return {
            provider: this.providerId,
            transactionReference: reference,
            checkoutUrl: `https://checkout.flutterwave.com/v3/hosted/pay/${reference}`,
            status: 'INITIALIZED',
        };
    }
    verifyWebhookSignature(payload, headers) {
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || 'default_hash';
        const signature = headers['verif-hash'];
        if (signature && signature !== secretHash && process.env.NODE_ENV === 'production') {
            return false;
        }
        return Boolean(payload);
    }
    async disbursePayout(params) {
        const reference = `flw_transfer_${params.idempotencyKey}`;
        return {
            provider: this.providerId,
            payoutReference: reference,
            status: 'SUCCESS',
            rawResponse: { recipient: params.recipientAccount, amount: params.amount, currency: params.currency },
        };
    }
}
exports.FlutterwaveAdapter = FlutterwaveAdapter;
