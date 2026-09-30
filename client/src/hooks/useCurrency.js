import { useSettings } from '../context/SettingsContext';

/**
 * C3: Dynamic currency formatting hook
 * Returns a formatPrice function that uses the currency_symbol from settings
 * Usage: const { formatPrice } = useCurrency();
 *        formatPrice(1500) → "Rs. 1,500"
 */
export function useCurrency() {
    const { settings } = useSettings();
    const symbol = settings?.currency_symbol || '$';

    const formatPrice = (amount) => {
        const num = Number(amount) || 0;
        return `${symbol}${num.toLocaleString()}`;
    };

    return { formatPrice, currencySymbol: symbol };
}
