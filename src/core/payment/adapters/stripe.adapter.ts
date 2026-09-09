import {
  IPaymentGatewayAdapter,
  EscrowInitParams,
  EscrowInitResult,
  PayoutParams,
  PayoutResult,
} from '../payment-gateway.interface';

export class StripeAdapter implements IPaymentGatewayAdapter {
  readonly providerId = 'stripe';
  readonly supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];

  async initializeEscrow(params: EscrowInitParams): Promise<EscrowInitResult> {
    const reference = `stripe_cs_${params.orderId}_${Date.now()}`;
    // In production, instantiate stripe.checkout.sessions.create()
    return {
      provider: this.providerId,
      transactionReference: reference,
      checkoutUrl: `https://checkout.stripe.com/pay/${reference}`,
      status: 'INITIALIZED',
    };
  }

  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean {
    const signature = headers['stripe-signature'];
    if (!signature && process.env.NODE_ENV === 'production') {
      return false;
    }
    return Boolean(payload);
  }

  async disbursePayout(params: PayoutParams): Promise<PayoutResult> {
    const reference = `stripe_po_${params.idempotencyKey}`;
    return {
      provider: this.providerId,
      payoutReference: reference,
      status: 'SUCCESS',
      rawResponse: { recipient: params.recipientAccount, amount: params.amount, currency: params.currency },
    };
  }
}
