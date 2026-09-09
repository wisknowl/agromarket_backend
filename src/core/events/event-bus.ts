import { EventEmitter } from 'events';

export type DomainEventType =
  | 'ORDER_CREATED'
  | 'ESCROW_LOCKED'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'ORDER_COMPLETED'
  | 'ESCROW_RELEASED'
  | 'DISPUTE_RAISED'
  | 'TELEMETRY_RECORDED'
  | 'CREDIT_SCORE_RECALCULATED';

export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  timestamp: Date;
  payload: T;
}

export type DomainEventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class DomainEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Allow ample listeners across engines
    this.emitter.setMaxListeners(50);
  }

  /**
   * Publish a typed domain event
   */
  public publish<T = any>(type: DomainEventType, payload: T): DomainEvent<T> {
    const event: DomainEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: new Date(),
      payload,
    };

    // Emit event asynchronously on next tick to avoid blocking caller
    setImmediate(() => {
      this.emitter.emit(type, event);
      this.emitter.emit('*', event);
    });

    return event;
  }

  /**
   * Subscribe to a specific domain event type
   */
  public subscribe<T = any>(type: DomainEventType, handler: DomainEventHandler<T>): () => void {
    const listener = async (event: DomainEvent<T>) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Error handling event ${type}:`, error);
      }
    };

    this.emitter.on(type, listener);
    return () => this.emitter.off(type, listener);
  }

  /**
   * Subscribe to all domain events (useful for logging and audit trails)
   */
  public subscribeAll(handler: DomainEventHandler): () => void {
    const listener = async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (error) {
        console.error('[EventBus] Error in wildcard listener:', error);
      }
    };

    this.emitter.on('*', listener);
    return () => this.emitter.off('*', listener);
  }
}

export const eventBus = new DomainEventBus();
export default eventBus;
