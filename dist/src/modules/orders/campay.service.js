"use strict";
/**
 * Campay Cameroon Payment Gateway Service
 * Handles MTN Mobile Money & Orange Money collection, status verification,
 * and automated escrow disbursements to farmers and transporters.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.campayService = void 0;
class CampayService {
    constructor() {
        this.cachedToken = null;
        this.tokenExpiresAt = 0;
    }
    get baseUrl() {
        return process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api';
    }
    get username() {
        return process.env.CAMPAY_USERNAME || '';
    }
    get password() {
        return process.env.CAMPAY_PASSWORD || '';
    }
    get webhookKey() {
        return process.env.CAMPAY_WEBHOOK_KEY || '';
    }
    /**
     * Sanitizes phone number to standard Cameroon MSISDN format (237XXXXXXXXX)
     */
    formatCameroonPhone(phone) {
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('00237')) {
            cleaned = cleaned.substring(2);
        }
        else if (cleaned.startsWith('237')) {
            // already starts with country code
        }
        else if (cleaned.length === 9) {
            cleaned = `237${cleaned}`;
        }
        return cleaned;
    }
    /**
     * Retrieves an active Bearer Token, caching until expiration.
     */
    async getAuthToken() {
        const now = Date.now();
        if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
            return this.cachedToken;
        }
        try {
            const response = await fetch(`${this.baseUrl}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.username,
                    password: this.password,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Campay token authorization failed (${response.status}): ${errorText}`);
            }
            const data = (await response.json());
            this.cachedToken = data.token;
            this.tokenExpiresAt = now + data.expires_in * 1000;
            return this.cachedToken;
        }
        catch (err) {
            console.error('❌ [CAMPAY SERVICE] Token fetch error:', err.message);
            throw err;
        }
    }
    /**
     * Initiates an MTN MoMo or Orange Money USSD collection prompt on buyer's phone.
     */
    async collectPayment(params) {
        const token = await this.getAuthToken();
        const formattedPhone = this.formatCameroonPhone(params.from);
        const isDemo = this.baseUrl.includes('demo') ||
            this.baseUrl.includes('sandbox') ||
            process.env.CAMPAY_ENV === 'demo';
        // Campay sandbox demo environment strictly limits test transactions to 25.00 XAF (ER201)
        const collectAmount = isDemo ? Math.min(Math.round(params.amount), 25) : Math.round(params.amount);
        if (isDemo && params.amount > 25) {
            console.log(`ℹ️ [CAMPAY DEMO] Transaction is ${params.amount} XAF. Clamping to ${collectAmount} XAF for Campay sandbox limits so USSD push succeeds on device.`);
        }
        const response = await fetch(`${this.baseUrl}/collect/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
                amount: collectAmount.toString(),
                currency: 'XAF',
                from: formattedPhone,
                description: params.description,
                external_reference: params.externalReference,
            }),
        });
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ [CAMPAY COLLECT ERROR]', response.status, errorData);
            throw new Error(`Campay collection failed: ${errorData}`);
        }
        const data = (await response.json());
        console.log(`✅ [CAMPAY COLLECT INITIATED] Reference: ${data.reference}, USSD: ${data.ussd_code || 'N/A'}`);
        return data;
    }
    /**
     * Queries real-time transaction status from Campay.
     */
    async checkTransactionStatus(reference) {
        const token = await this.getAuthToken();
        const response = await fetch(`${this.baseUrl}/transaction/${reference}/`, {
            method: 'GET',
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to check Campay transaction ${reference}: ${errorText}`);
        }
        const data = (await response.json());
        return data;
    }
    /**
     * Disburses escrow payouts to a farmer or transporter wallet upon delivery confirmation.
     */
    async disburseEscrowPayout(params) {
        const token = await this.getAuthToken();
        const formattedPhone = this.formatCameroonPhone(params.to);
        console.log(`💸 [CAMPAY ESCROW RELEASE] Disbursing ${params.amount} XAF to ${formattedPhone}...`);
        const response = await fetch(`${this.baseUrl}/withdraw/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
                amount: Math.round(params.amount).toString(),
                currency: 'XAF',
                to: formattedPhone,
                description: params.description,
                external_reference: params.externalReference,
            }),
        });
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ [CAMPAY WITHDRAW ERROR]', response.status, errorData);
            throw new Error(`Campay payout failed: ${errorData}`);
        }
        return (await response.json());
    }
    /**
     * Verifies that an incoming webhook genuinely originates from Campay.
     */
    verifyWebhookKey(providedKey) {
        if (!this.webhookKey)
            return true; // development fallback
        return providedKey === this.webhookKey;
    }
}
exports.campayService = new CampayService();
exports.default = exports.campayService;
