export type EscrowState =
  | 'ORDER_CREATED'
  | 'ESCROW_LOCKED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'ESCROW_RELEASED'
  | 'DISPUTED'
  | 'ARBITRATION'
  | 'REFUNDED';

export interface SettlementBreakdown {
  grossAmount: number;
  currency: string;
  subtotal: number;
  platformCommission: number;
  platformCommissionPct: number;
  loanRepaymentDeduction: number;
  loanRepaymentPct: number;
  transporterFee: number;
  farmerGross: number;
  farmerNetPayout: number;
  activeLoanId?: string;
}

export interface FsmTransitionResult {
  orderId: string;
  fromState: EscrowState;
  toState: EscrowState;
  valid: boolean;
  message?: string;
}
