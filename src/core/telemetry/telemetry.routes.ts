import { Router } from 'express';
import { telemetryService, TelemetryEventPayload } from './telemetry.service';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * Ingest high-frequency telemetry events from Frontend
 * POST /api/telemetry/events
 */
router.post('/events', optionalAuth, (req, res) => {
  try {
    const { events } = req.body;
    const userId = (req as any).user?.id || req.body.userId;

    if (Array.isArray(events)) {
      for (const ev of events) {
        telemetryService.recordEvent({
          ...ev,
          userId: ev.userId || userId,
        });
      }
      res.status(200).json({ success: true, processed: events.length });
    } else if (req.body.eventType) {
      telemetryService.recordEvent({
        ...req.body,
        userId: req.body.userId || userId,
      });
      res.status(200).json({ success: true, processed: 1 });
    } else {
      res.status(400).json({ success: false, error: 'No valid telemetry events provided' });
    }
  } catch (error: any) {
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
    const metrics = telemetryService.getEntityMetrics(entityType as 'FARMER' | 'POST' | 'YIELD', entityId);
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


export const telemetryRoutes = router;
export default router;
