import { IPaymentGatewayAdapter } from './payment-gateway.interface';
import { StripeAdapter } from './adapters/stripe.adapter';
import { PaystackAdapter } from './adapters/paystack.adapter';
import { FlutterwaveAdapter } from './adapters/flutterwave.adapter';
import { MtnOrangeMoMoAdapter } from './adapters/momo.adapter';

export interface ResolutionContext {
  countryCode?: string; // ISO 3166-1 alpha-2 (e.g., 'CM', 'NG', 'US', 'FR')
  currency: string;      // ISO 4217 (e.g., 'XAF', 'USD', 'NGN')
  preferredProvider?: string;
}

export class PaymentMethodResolver {
  private static adapters: Map<string, IPaymentGatewayAdapter> = new Map<string, IPaymentGatewayAdapter>([
    ['stripe', new StripeAdapter()],
    ['paystack', new PaystackAdapter()],
    ['flutterwave', new FlutterwaveAdapter()],
    ['momo_orange', new MtnOrangeMoMoAdapter()],
  ]);

  /**
   * Register or override a payment gateway adapter
   */
  public static registerAdapter(adapter: IPaymentGatewayAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  /**
   * Resolves the optimal gateway adapter based on Geo-Location, ISO-4217 Currency, and provider availability.
   */
  public static resolve(context: ResolutionContext): IPaymentGatewayAdapter {
    const { countryCode = '', currency, preferredProvider } = context;
    const country = countryCode.toUpperCase();
    const cur = currency.toUpperCase();

    // Explicit override if specified and registered
    if (preferredProvider && this.adapters.has(preferredProvider)) {
      const adapter = this.adapters.get(preferredProvider)!;
      if (adapter.supportedCurrencies.includes(cur)) {
        return adapter;
      }
    }

    // Rule 1: International North America / Europe (US, UK, EU, CA) or major reserve currencies
    const internationalCountries = ['US', 'GB', 'UK', 'CA', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH'];
    const internationalCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
    if (internationalCountries.includes(country) || (internationalCurrencies.includes(cur) && !country)) {
      return this.adapters.get('stripe')!;
    }

    // Rule 2: Central & West African Mobile Money zones (CEMAC / UEMOA)
    const momoCountries = ['CM', 'CI', 'SN', 'GA', 'CG', 'BF', 'ML', 'BJ', 'TG'];
    const momoCurrencies = ['XAF', 'XOF'];
    if (momoCountries.includes(country) || momoCurrencies.includes(cur)) {
      return this.adapters.get('momo_orange')!;
    }

    // Rule 3: Anglophone & East/Southern Africa (Nigeria, Ghana, Kenya, South Africa)
    const paystackCountries = ['NG', 'GH', 'ZA', 'KE'];
    const paystackCurrencies = ['NGN', 'GHS', 'KES', 'ZAR'];
    if (paystackCountries.includes(country) || paystackCurrencies.includes(cur)) {
      return this.adapters.get('paystack')!;
    }

    // Rule 4: Pan-African Multi-Rail Fallback
    const flutterwave = this.adapters.get('flutterwave');
    if (flutterwave && flutterwave.supportedCurrencies.includes(cur)) {
      return flutterwave;
    }

    // Final default fallback
    return this.adapters.get('stripe') || this.adapters.get('flutterwave')!;
  }

  /**
   * Retrieves an adapter directly by provider ID
   */
  public static getAdapter(providerId: string): IPaymentGatewayAdapter | undefined {
    return this.adapters.get(providerId);
  }

  /**
   * Returns all available adapters and supported currencies
   */
  public static listAvailableAdapters(): Array<{ providerId: string; currencies: string[] }> {
    return Array.from(this.adapters.values()).map((a) => ({
      providerId: a.providerId,
      currencies: a.supportedCurrencies,
    }));
  }
}
