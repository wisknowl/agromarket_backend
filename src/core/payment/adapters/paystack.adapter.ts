import {
  IPaymentGatewayAdapter,
  EscrowInitParams,
  EscrowInitResult,
  PayoutParams,
  PayoutResult,
} from '../payment-gateway.interface';

export class PaystackAdapter implements IPaymentGatewayAdapter {
  readonly providerId = 'paystack';
  readonly supportedCurrencies = ['NGN', 'GHS', 'KES', 'ZAR'];

  async initializeEscrow(params: EscrowInitParams): Promise<EscrowInitResult> {
    const reference = `pstk_${params.orderId}_${Date.now()}`;
    return {
      provider: this.providerId,
      transactionReference: reference,
      checkoutUrl: `https://checkout.paystack.com/${reference}`,
      status: 'INITIALIZED',
    };
  }

  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean {
    const signature = headers['x-paystack-signature'];
    if (!signature && process.env.NODE_ENV === 'production') {
      return false;
    }
    return Boolean(payload);
  }

  async disbursePayout(params: PayoutParams): Promise<PayoutResult> {
    const reference = `pstk_trf_${params.idempotencyKey}`;
    return {
      provider: this.providerId,
      payoutReference: reference,
      status: 'SUCCESS',
      rawResponse: { recipient: params.recipientAccount, amount: params.amount, currency: params.currency },
    };
  }
}
