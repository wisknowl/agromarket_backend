"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowMachine = void 0;
const event_bus_1 = require("../../../core/events/event-bus");
class EscrowMachine {
    /**
     * Asserts whether a given state transition is logically permitted.
     */
    static canTransition(from, to) {
        const allowed = this.ALLOWED_TRANSITIONS[from];
        return Boolean(allowed && allowed.includes(to));
    }
    /**
     * Executes a validated state transition and emits the appropriate domain event.
     */
    static transition(orderId, from, to) {
        if (!this.canTransition(from, to)) {
            return {
                orderId,
                fromState: from,
                toState: to,
                valid: false,
                message: `Illegal state transition from ${from} to ${to}. Allowed transitions: ${this.ALLOWED_TRANSITIONS[from]?.join(', ') || 'none (terminal)'}`,
            };
        }
        // Publish corresponding domain event
        switch (to) {
            case 'ESCROW_LOCKED':
                event_bus_1.eventBus.publish('ESCROW_LOCKED', { orderId, state: to });
                break;
            case 'IN_TRANSIT':
                event_bus_1.eventBus.publish('ORDER_DISPATCHED', { orderId, state: to });
                break;
            case 'DELIVERED':
                event_bus_1.eventBus.publish('ORDER_DELIVERED', { orderId, state: to });
                break;
            case 'ESCROW_RELEASED':
                event_bus_1.eventBus.publish('ESCROW_RELEASED', { orderId, state: to });
                event_bus_1.eventBus.publish('ORDER_COMPLETED', { orderId, state: to });
                break;
            case 'DISPUTED':
                event_bus_1.eventBus.publish('DISPUTE_RAISED', { orderId, state: to });
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
exports.EscrowMachine = EscrowMachine;
EscrowMachine.ALLOWED_TRANSITIONS = {
    ORDER_CREATED: ['ESCROW_LOCKED'],
    ESCROW_LOCKED: ['IN_TRANSIT', 'DISPUTED'],
    IN_TRANSIT: ['DELIVERED', 'DISPUTED'],
    DELIVERED: ['ESCROW_RELEASED'],
    DISPUTED: ['ARBITRATION'],
    ARBITRATION: ['REFUNDED', 'ESCROW_RELEASED'],
    ESCROW_RELEASED: [], // Terminal state
    REFUNDED: [], // Terminal state
};
