import { SettlementBreakdown } from './types/escrow.types';
import prisma from '../../../core/database/prisma';

export interface SettlementInput {
  subtotal: number;
  deliveryFee: number;
  currency?: string;
  farmerId: string;
  customCommissionPct?: number;
}

export class SettlementLedger {
  public static readonly DEFAULT_PLATFORM_COMMISSION_PCT = 0.035; // 3.5% as per Section 9.2

  /**
   * Calculates the exact multi-party settlement breakdown, checking for active microloans.
   */
  public static async computeSettlement(input: SettlementInput): Promise<SettlementBreakdown> {
    const { subtotal, deliveryFee, currency = 'XAF', farmerId, customCommissionPct } = input;
    const grossAmount = subtotal + deliveryFee;

    // 1. Platform Commission
    const commissionPct = customCommissionPct ?? this.DEFAULT_PLATFORM_COMMISSION_PCT;
    const platformCommission = Math.round(subtotal * commissionPct * 100) / 100;

    // 2. Transporter Fee
    const transporterFee = deliveryFee;

    // 3. Farmer Gross Revenue before loan deductions
    const farmerGross = subtotal - platformCommission;

    // 4. Check for active approved/disbursed loan applications for the farmer
    let loanRepaymentPct = 0;
    let loanRepaymentDeduction = 0;
    let activeLoanId: string | undefined;

    try {
      const activeLoan = await prisma.loanApplication.findFirst({
        where: {
          farmerId,
          status: 'DISBURSED',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (activeLoan) {
        activeLoanId = activeLoan.id;
        loanRepaymentPct = (activeLoan.repaymentDeductionPct || 20) / 100; // e.g. 20%
        loanRepaymentDeduction = Math.round(farmerGross * loanRepaymentPct * 100) / 100;

        // Ensure we don't deduct more than the remaining balance due
        const principal = Number(activeLoan.approvedAmount || activeLoan.requestedAmount);
        const alreadyRepaid = Number(activeLoan.totalRepaidAmount || 0);
        const remainingDue = Math.max(0, principal - alreadyRepaid);
        loanRepaymentDeduction = Math.min(loanRepaymentDeduction, remainingDue);
      }
    } catch (e) {
      // Running offline or test mode without DB
    }

    // 5. Net Farmer Payout
    const farmerNetPayout = Math.max(0, farmerGross - loanRepaymentDeduction);

    return {
      grossAmount,
      currency,
      subtotal,
      platformCommission,
      platformCommissionPct: commissionPct,
      loanRepaymentDeduction,
      loanRepaymentPct,
      transporterFee,
      farmerGross,
      farmerNetPayout,
      activeLoanId,
    };
  }

  /**
   * Pure settlement calculation (without database query) for tests and simulations
   */
  public static computePure(
    subtotal: number,
    deliveryFee: number,
    loanDeductionPct = 0.20,
    commissionPct = 0.035,
    currency = 'XAF'
  ): SettlementBreakdown {
    const grossAmount = subtotal + deliveryFee;
    const platformCommission = Math.round(subtotal * commissionPct * 100) / 100;
    const transporterFee = deliveryFee;
    const farmerGross = subtotal - platformCommission;
    const loanRepaymentDeduction = Math.round(farmerGross * loanDeductionPct * 100) / 100;
    const farmerNetPayout = Math.max(0, farmerGross - loanRepaymentDeduction);

    return {
      grossAmount,
      currency,
      subtotal,
      platformCommission,
      platformCommissionPct: commissionPct,
      loanRepaymentDeduction,
      loanRepaymentPct: loanDeductionPct,
      transporterFee,
      farmerGross,
      farmerNetPayout,
    };
  }
}
