/**
 * Campay Cameroon Payment Gateway Service
 * Handles MTN Mobile Money & Orange Money collection, status verification,
 * and automated escrow disbursements to farmers and transporters.
 */

interface CampayTokenResponse {
  token: string;
  expires_in: number;
}

interface CampayCollectRequest {
  amount: number;
  from: string; // Cameroon MSISDN e.g. "237670000000"
  description: string;
  externalReference: string;
}

export interface CampayCollectResponse {
  reference: string;
  ussd_code?: string;
  operator?: 'MTN' | 'ORANGE';
}

export interface CampayTransactionStatus {
  reference: string;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  operator: string;
  code?: string;
  operator_reference?: string;
}

export interface CampayDisburseRequest {
  amount: number;
  to: string; // Farmer or Transporter MSISDN
  description: string;
  externalReference: string;
}

class CampayService {
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  private get baseUrl(): string {
    return process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api';
  }

  private get username(): string {
    return process.env.CAMPAY_USERNAME || '';
  }

  private get password(): string {
    return process.env.CAMPAY_PASSWORD || '';
  }

  private get webhookKey(): string {
    return process.env.CAMPAY_WEBHOOK_KEY || '';
  }

  /**
   * Sanitizes phone number to standard Cameroon MSISDN format (237XXXXXXXXX)
   */
  public formatCameroonPhone(phone: string): string {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('00237')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('237')) {
      // already starts with country code
    } else if (cleaned.length === 9) {
      cleaned = `237${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Retrieves an active Bearer Token, caching until expiration.
   */
  public async getAuthToken(): Promise<string> {
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

      const data = (await response.json()) as CampayTokenResponse;
      this.cachedToken = data.token;
      this.tokenExpiresAt = now + data.expires_in * 1000;
      return this.cachedToken;
    } catch (err: any) {
      console.error('❌ [CAMPAY SERVICE] Token fetch error:', err.message);
      throw err;
    }
  }

  /**
   * Initiates an MTN MoMo or Orange Money USSD collection prompt on buyer's phone.
   */
  public async collectPayment(params: CampayCollectRequest): Promise<CampayCollectResponse> {
    const token = await this.getAuthToken();
    const formattedPhone = this.formatCameroonPhone(params.from);

    const isDemo =
      this.baseUrl.includes('demo') ||
      this.baseUrl.includes('sandbox') ||
      process.env.CAMPAY_ENV === 'demo';

    // Campay sandbox demo environment strictly limits test transactions to 25.00 XAF (ER201)
    const collectAmount = isDemo ? Math.min(Math.round(params.amount), 25) : Math.round(params.amount);

    if (isDemo && params.amount > 25) {
      console.log(
        `ℹ️ [CAMPAY DEMO] Transaction is ${params.amount} XAF. Clamping to ${collectAmount} XAF for Campay sandbox limits so USSD push succeeds on device.`
      );
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

    const data = (await response.json()) as CampayCollectResponse;
    console.log(`✅ [CAMPAY COLLECT INITIATED] Reference: ${data.reference}, USSD: ${data.ussd_code || 'N/A'}`);
    return data;
  }

  /**
   * Queries real-time transaction status from Campay.
   */
  public async checkTransactionStatus(reference: string): Promise<CampayTransactionStatus> {
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

    const data = (await response.json()) as CampayTransactionStatus;
    return data;
  }

  /**
   * Disburses escrow payouts to a farmer or transporter wallet upon delivery confirmation.
   */
  public async disburseEscrowPayout(params: CampayDisburseRequest): Promise<{ reference: string }> {
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

    return (await response.json()) as { reference: string };
  }

  /**
   * Verifies that an incoming webhook genuinely originates from Campay.
   */
  public verifyWebhookKey(providedKey?: string): boolean {
    if (!this.webhookKey) return true; // development fallback
    return providedKey === this.webhookKey;
  }
}

export const campayService = new CampayService();
export default campayService;
