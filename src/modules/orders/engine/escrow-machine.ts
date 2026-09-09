import { EscrowState, FsmTransitionResult } from './types/escrow.types';
import { eventBus } from '../../../core/events/event-bus';

export class EscrowMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<EscrowState, EscrowState[]> = {
    ORDER_CREATED: ['ESCROW_LOCKED'],
    ESCROW_LOCKED: ['IN_TRANSIT', 'DISPUTED'],
    IN_TRANSIT: ['DELIVERED', 'DISPUTED'],
    DELIVERED: ['ESCROW_RELEASED'],
    DISPUTED: ['ARBITRATION'],
    ARBITRATION: ['REFUNDED', 'ESCROW_RELEASED'],
    ESCROW_RELEASED: [], // Terminal state
    REFUNDED: [],        // Terminal state
  };

  /**
   * Asserts whether a given state transition is logically permitted.
   */
  public static canTransition(from: EscrowState, to: EscrowState): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return Boolean(allowed && allowed.includes(to));
  }

  /**
   * Executes a validated state transition and emits the appropriate domain event.
   */
  public static transition(orderId: string, from: EscrowState, to: EscrowState): FsmTransitionResult {
    if (!this.canTransition(from, to)) {
      return {
        orderId,
        fromState: from,
        toState: to,
        valid: false,
        message: `Illegal state transition from ${from} to ${to}. Allowed transitions: ${
          this.ALLOWED_TRANSITIONS[from]?.join(', ') || 'none (terminal)'
        }`,
      };
    }

    // Publish corresponding domain event
    switch (to) {
      case 'ESCROW_LOCKED':
        eventBus.publish('ESCROW_LOCKED', { orderId, state: to });
        break;
      case 'IN_TRANSIT':
        eventBus.publish('ORDER_DISPATCHED', { orderId, state: to });
        break;
      case 'DELIVERED':
        eventBus.publish('ORDER_DELIVERED', { orderId, state: to });
        break;
      case 'ESCROW_RELEASED':
        eventBus.publish('ESCROW_RELEASED', { orderId, state: to });
        eventBus.publish('ORDER_COMPLETED', { orderId, state: to });
        break;
      case 'DISPUTED':
        eventBus.publish('DISPUTE_RAISED', { orderId, state: to });
        break;
    }

    return {
      orderId,
      fromState: from,
      toState: to,
      valid: true,
      message: `Order ${orderId} successfully transitioned to ${to}`,
    };
  }
}
