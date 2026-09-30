// Pure price formatter mirroring useCurrency().formatPrice so server components
// render the same "Rs. 1,500" / "$1,500" strings without needing the settings
// context/hook. Pass the currency symbol from server-fetched settings.
export function formatPrice(amount, symbol = '$') {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString()}`;
}
