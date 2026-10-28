"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./modules/auth");
const yields_1 = require("./modules/yields");
const feed_1 = require("./modules/feed");
const orders_1 = require("./modules/orders");
const fintech_1 = require("./modules/fintech");
const chat_1 = require("./modules/chat");
const farms_1 = require("./modules/farms");
const buyam_sellam_1 = require("./modules/buyam-sellam");
const admin_1 = require("./modules/admin");
const upload_1 = require("./modules/upload");
const notifications_1 = require("./modules/notifications");
const telemetry_routes_1 = require("./core/telemetry/telemetry.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middlewares
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
// Serve Static Uploads (Videos & Images)
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Request Logger (Prints visited URLs & methods to CLI)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
        console.log(`[API ${req.method}] ${req.originalUrl} -> ${color}${res.statusCode}\x1b[0m (${duration}ms)`);
    });
    next();
});
// API Health Check
app.get('/', (_req, res) => {
    res.json({
        name: 'AgroMarket (Agrom) Global Agri-Commerce API',
        version: '3.0.0 (Modular Domain Architecture)',
        status: 'ONLINE',
        time: new Date().toISOString(),
        modules: [
            'auth',
            'feed',
            'yields',
            'orders',
            'fintech',
            'chat',
            'farms',
            'buyam-sellam',
            'admin',
            'notifications',
        ],
    });
});
// Domain Module Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/yields', yields_1.yieldRoutes);
app.get('/api/categories', yields_1.getCategories);
app.use('/api/posts', feed_1.postRoutes);
app.use('/api/orders', orders_1.orderRoutes);
app.use('/api/fintech', fintech_1.fintechRoutes);
app.use('/api/chat', chat_1.chatRoutes);
app.use('/api/farms', farms_1.farmRoutes);
app.use('/api/wholesaler', buyam_sellam_1.buyamSellamRoutes);
app.use('/api/admin', admin_1.adminRoutes);
app.use('/api/upload', upload_1.uploadRoutes);
app.use('/api/notifications', notifications_1.notificationRoutes);
app.use('/api/telemetry', telemetry_routes_1.telemetryRoutes);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});
if (process.env.NODE_ENV !== 'test') {
    const serverPort = Number(PORT) || 5000;
    app.listen(serverPort, '0.0.0.0', () => {
        console.log(`🌱 AgroMarket Modular Server running on port ${serverPort}`);
        const interfaces = os_1.default.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name] || []) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`📡 Network Access (${name}): http://${iface.address}:${serverPort}`);
                }
            }
        }
        console.log(`💻 Local Access: http://localhost:${serverPort}`);
        console.log(`📱 Android Emulator Access: http://10.0.2.2:${serverPort}`);
    });
}
exports.default = app;
