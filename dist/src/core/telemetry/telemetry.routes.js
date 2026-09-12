"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetryRoutes = void 0;
const express_1 = require("express");
const telemetry_service_1 = require("./telemetry.service");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * Ingest high-frequency telemetry events from Frontend
 * POST /api/telemetry/events
 */
router.post('/events', authMiddleware_1.optionalAuth, (req, res) => {
    try {
        const { events } = req.body;
        const userId = req.user?.id || req.body.userId;
        if (Array.isArray(events)) {
            for (const ev of events) {
                telemetry_service_1.telemetryService.recordEvent({
                    ...ev,
                    userId: ev.userId || userId,
                });
            }
            res.status(200).json({ success: true, processed: events.length });
        }
        else if (req.body.eventType) {
            telemetry_service_1.telemetryService.recordEvent({
                ...req.body,
                userId: req.body.userId || userId,
            });
            res.status(200).json({ success: true, processed: 1 });
        }
        else {
            res.status(400).json({ success: false, error: 'No valid telemetry events provided' });
        }
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
/**
 * Retrieve cached real-time metrics for an entity
 * GET /api/telemetry/metrics/:entityType/:entityId
 */
router.get('/metrics/:entityType/:entityId', (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const metrics = telemetry_service_1.telemetryService.getEntityMetrics(entityType, entityId);
        res.json({ success: true, metrics });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.telemetryRoutes = router;
exports.default = router;
