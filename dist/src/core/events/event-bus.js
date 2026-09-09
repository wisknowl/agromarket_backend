"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const events_1 = require("events");
class DomainEventBus {
    constructor() {
        this.emitter = new events_1.EventEmitter();
        // Allow ample listeners across engines
        this.emitter.setMaxListeners(50);
    }
    /**
     * Publish a typed domain event
     */
    publish(type, payload) {
        const event = {
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
    subscribe(type, handler) {
        const listener = async (event) => {
            try {
                await handler(event);
            }
            catch (error) {
                console.error(`[EventBus] Error handling event ${type}:`, error);
            }
        };
        this.emitter.on(type, listener);
        return () => this.emitter.off(type, listener);
    }
    /**
     * Subscribe to all domain events (useful for logging and audit trails)
     */
    subscribeAll(handler) {
        const listener = async (event) => {
            try {
                await handler(event);
            }
            catch (error) {
                console.error('[EventBus] Error in wildcard listener:', error);
            }
        };
        this.emitter.on('*', listener);
        return () => this.emitter.off('*', listener);
    }
}
exports.eventBus = new DomainEventBus();
exports.default = exports.eventBus;
