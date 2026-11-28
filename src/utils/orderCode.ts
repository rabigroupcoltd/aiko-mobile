/**
 * How an order is named on screen: its pickup code ("KMX-472") when it has
 * one, otherwise a short form of its id for orders made before codes existed.
 */
export function orderReference(order: { id?: string; orderId?: string; code?: string | null }): string {
  if (order.code) return order.code;
  const id = order.id ?? order.orderId ?? '';
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** Spoken form for screen readers: "K M X, 4 7 2". */
export function spellCode(code: string): string {
  return code
    .split('-')
    .map((part) => part.split('').join(' '))
    .join(', ');
}
