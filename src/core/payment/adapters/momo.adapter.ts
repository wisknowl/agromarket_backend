import {
  IPaymentGatewayAdapter,
  EscrowInitParams,
  EscrowInitResult,
  PayoutParams,
  PayoutResult,
} from '../payment-gateway.interface';

export class MtnOrangeMoMoAdapter implements IPaymentGatewayAdapter {
  readonly providerId = 'momo_orange';
  readonly supportedCurrencies = ['XAF', 'XOF'];

  async initializeEscrow(params: EscrowInitParams): Promise<EscrowInitResult> {
    const reference = `momo_${params.orderId}_${Date.now()}`;
    return {
      provider: this.providerId,
      transactionReference: reference,
      status: 'PENDING_OTP', // Mobile Money requests prompt USSD/PIN on farmer/buyer phone
    };
  }

  verifyWebhookSignature(payload: any, _headers: Record<string, string>): boolean {
    return Boolean(payload);
  }

  async disbursePayout(params: PayoutParams): Promise<PayoutResult> {
    const reference = `momo_payout_${params.idempotencyKey}`;
    return {
      provider: this.providerId,
      payoutReference: reference,
      status: 'SUCCESS',
      rawResponse: { phone: params.recipientAccount, amount: params.amount, currency: params.currency },
    };
  }
}
