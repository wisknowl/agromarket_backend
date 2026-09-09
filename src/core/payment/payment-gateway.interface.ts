/**
 * AgroMarket Core Payment Gateway Abstraction
 * Supports multi-currency cross-border transactions and pluggable vendor adapters.
 */

export interface EscrowInitParams {
  orderId: string;
  amount: number;
  currency: string;
  payerReference: string; // Phone, Email, or Wallet ID
  metadata?: Record<string, any>;
}

export interface EscrowInitResult {
  transactionReference: string;
  checkoutUrl?: string;
  status: 'INITIALIZED' | 'PENDING_OTP' | 'SUCCESS';
  provider: string;
}

export interface PayoutParams {
  recipientAccount: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface PayoutResult {
  payoutReference: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  provider: string;
  rawResponse?: any;
}

export interface IPaymentGatewayAdapter {
  readonly providerId: string;
  readonly supportedCurrencies: string[];

  initializeEscrow(params: EscrowInitParams): Promise<EscrowInitResult>;
  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean;
  disbursePayout(params: PayoutParams): Promise<PayoutResult>;
}
