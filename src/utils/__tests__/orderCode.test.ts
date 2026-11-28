import { orderReference, spellCode } from '../orderCode';

describe('orderReference', () => {
  it('uses the pickup code when there is one', () => {
    expect(orderReference({ id: 'f3a9c2e1-0000', code: 'KMX-472' })).toBe('KMX-472');
  });

  it('falls back to a short id for older orders', () => {
    expect(orderReference({ id: 'f3a9c2e1-1234-5678', code: null })).toBe('#F3A9C2E1');
    expect(orderReference({ orderId: 'abcd1234ef' })).toBe('#ABCD1234');
  });
});

describe('spellCode', () => {
  it('spells each character for screen readers', () => {
    expect(spellCode('KMX-472')).toBe('K M X, 4 7 2');
  });
});
