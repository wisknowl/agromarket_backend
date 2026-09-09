"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodResolver = void 0;
const stripe_adapter_1 = require("./adapters/stripe.adapter");
const paystack_adapter_1 = require("./adapters/paystack.adapter");
const flutterwave_adapter_1 = require("./adapters/flutterwave.adapter");
const momo_adapter_1 = require("./adapters/momo.adapter");
class PaymentMethodResolver {
    /**
     * Register or override a payment gateway adapter
     */
    static registerAdapter(adapter) {
        this.adapters.set(adapter.providerId, adapter);
    }
    /**
     * Resolves the optimal gateway adapter based on Geo-Location, ISO-4217 Currency, and provider availability.
     */
    static resolve(context) {
        const { countryCode = '', currency, preferredProvider } = context;
        const country = countryCode.toUpperCase();
        const cur = currency.toUpperCase();
        // Explicit override if specified and registered
        if (preferredProvider && this.adapters.has(preferredProvider)) {
            const adapter = this.adapters.get(preferredProvider);
            if (adapter.supportedCurrencies.includes(cur)) {
                return adapter;
            }
        }
        // Rule 1: International North America / Europe (US, UK, EU, CA) or major reserve currencies
        const internationalCountries = ['US', 'GB', 'UK', 'CA', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH'];
        const internationalCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
        if (internationalCountries.includes(country) || (internationalCurrencies.includes(cur) && !country)) {
            return this.adapters.get('stripe');
        }
        // Rule 2: Central & West African Mobile Money zones (CEMAC / UEMOA)
        const momoCountries = ['CM', 'CI', 'SN', 'GA', 'CG', 'BF', 'ML', 'BJ', 'TG'];
        const momoCurrencies = ['XAF', 'XOF'];
        if (momoCountries.includes(country) || momoCurrencies.includes(cur)) {
            return this.adapters.get('momo_orange');
        }
        // Rule 3: Anglophone & East/Southern Africa (Nigeria, Ghana, Kenya, South Africa)
        const paystackCountries = ['NG', 'GH', 'ZA', 'KE'];
        const paystackCurrencies = ['NGN', 'GHS', 'KES', 'ZAR'];
        if (paystackCountries.includes(country) || paystackCurrencies.includes(cur)) {
            return this.adapters.get('paystack');
        }
        // Rule 4: Pan-African Multi-Rail Fallback
        const flutterwave = this.adapters.get('flutterwave');
        if (flutterwave && flutterwave.supportedCurrencies.includes(cur)) {
            return flutterwave;
        }
        // Final default fallback
        return this.adapters.get('stripe') || this.adapters.get('flutterwave');
    }
    /**
     * Retrieves an adapter directly by provider ID
     */
    static getAdapter(providerId) {
        return this.adapters.get(providerId);
    }
    /**
     * Returns all available adapters and supported currencies
     */
    static listAvailableAdapters() {
        return Array.from(this.adapters.values()).map((a) => ({
            providerId: a.providerId,
            currencies: a.supportedCurrencies,
        }));
    }
}
exports.PaymentMethodResolver = PaymentMethodResolver;
PaymentMethodResolver.adapters = new Map([
    ['stripe', new stripe_adapter_1.StripeAdapter()],
    ['paystack', new paystack_adapter_1.PaystackAdapter()],
    ['flutterwave', new flutterwave_adapter_1.FlutterwaveAdapter()],
    ['momo_orange', new momo_adapter_1.MtnOrangeMoMoAdapter()],
]);
