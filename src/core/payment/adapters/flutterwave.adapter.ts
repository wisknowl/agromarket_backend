import {
  IPaymentGatewayAdapter,
  EscrowInitParams,
  EscrowInitResult,
  PayoutParams,
  PayoutResult,
} from '../payment-gateway.interface';

export class FlutterwaveAdapter implements IPaymentGatewayAdapter {
  readonly providerId = 'flutterwave';
  readonly supportedCurrencies = ['USD', 'NGN', 'KES', 'GHS', 'UGX', 'TZS', 'RWF', 'ZMW', 'XAF', 'XOF'];

  async initializeEscrow(params: EscrowInitParams): Promise<EscrowInitResult> {
    const reference = `flw_tx_${params.orderId}_${Date.now()}`;
    return {
      provider: this.providerId,
      transactionReference: reference,
      checkoutUrl: `https://checkout.flutterwave.com/v3/hosted/pay/${reference}`,
      status: 'INITIALIZED',
    };
  }

  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || 'default_hash';
    const signature = headers['verif-hash'];
    if (signature && signature !== secretHash && process.env.NODE_ENV === 'production') {
      return false;
    }
    return Boolean(payload);
  }

  async disbursePayout(params: PayoutParams): Promise<PayoutResult> {
    const reference = `flw_transfer_${params.idempotencyKey}`;
    return {
      provider: this.providerId,
      payoutReference: reference,
      status: 'SUCCESS',
      rawResponse: { recipient: params.recipientAccount, amount: params.amount, currency: params.currency },
    };
  }
}
