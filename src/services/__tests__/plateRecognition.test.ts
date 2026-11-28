import {
  isPlausiblePlate,
  looksLikeNigerianPlate,
  normalisePlate,
  pickPlateCandidate,
  recognisePlate,
  registerTextRecognizer,
} from '../plateRecognition';

describe('normalisePlate', () => {
  it('upper-cases and joins groups with hyphens', () => {
    expect(normalisePlate(' abc 123 de ')).toBe('ABC-123-DE');
    expect(normalisePlate('kja.482_kj')).toBe('KJA-482-KJ');
    expect(normalisePlate('MNA--123--XY')).toBe('MNA-123-XY');
    expect(normalisePlate('ABC/123*DE')).toBe('ABC123DE');
  });
});

describe('looksLikeNigerianPlate', () => {
  it('accepts current and legacy layouts', () => {
    expect(looksLikeNigerianPlate('ABC-123DE')).toBe(true);
    expect(looksLikeNigerianPlate('abc 123 de')).toBe(true);
    expect(looksLikeNigerianPlate('AB-123-KJA')).toBe(true);
  });

  it('rejects other text', () => {
    expect(looksLikeNigerianPlate('NIGER')).toBe(false);
    expect(looksLikeNigerianPlate('POWER STATE')).toBe(false);
    expect(looksLikeNigerianPlate('1234567')).toBe(false);
  });
});

describe('isPlausiblePlate', () => {
  it('needs letters and digits of a sensible length', () => {
    expect(isPlausiblePlate('MN123')).toBe(true);
    expect(isPlausiblePlate('ABCDE')).toBe(false);
    expect(isPlausiblePlate('A1')).toBe(false);
  });
});

describe('pickPlateCandidate', () => {
  it('skips the state name and slogan', () => {
    expect(pickPlateCandidate(['NIGER', 'MNA 482 KJ', 'POWER STATE'])).toBe('MNA-482-KJ');
  });

  it('joins a number split across two lines', () => {
    expect(pickPlateCandidate(['NIGER', 'MNA 482', 'KJ'])).toBe('MNA-482-KJ');
  });

  it('returns null when nothing looks like a plate', () => {
    expect(pickPlateCandidate(['NIGER', 'POWER STATE'])).toBeNull();
  });
});

describe('recognisePlate', () => {
  afterEach(() => registerTextRecognizer(null));

  it('resolves null without an OCR engine', async () => {
    await expect(recognisePlate('file:///plate.jpg')).resolves.toBeNull();
  });

  it('uses a registered engine and survives its failures', async () => {
    registerTextRecognizer(async () => ['LAGOS', 'KJA 482 KJ']);
    await expect(recognisePlate('file:///plate.jpg')).resolves.toBe('KJA-482-KJ');

    registerTextRecognizer(async () => {
      throw new Error('engine crashed');
    });
    await expect(recognisePlate('file:///plate.jpg')).resolves.toBeNull();
  });
});
