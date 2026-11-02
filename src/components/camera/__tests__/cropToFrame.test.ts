jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));

import { frameToPhotoRect } from '../cropToFrame';

describe('frameToPhotoRect', () => {
  it('maps a frame on a same-aspect preview by simple scaling', () => {
    const rect = frameToPhotoRect(
      { left: 100, top: 200, width: 200, height: 100 },
      { width: 400, height: 800 },
      { width: 1000, height: 2000 },
    );
    // scale 0.4, frame padded by 6% on each side
    expect(rect.originX).toBe(Math.round((100 - 12) / 0.4));
    expect(rect.originY).toBe(Math.round((200 - 6) / 0.4));
    expect(rect.width).toBe(Math.round((200 + 24) / 0.4));
    expect(rect.height).toBe(Math.round((100 + 12) / 0.4));
  });

  it('accounts for the preview cropping the sides of a wider photo', () => {
    // 3:4 photo shown in a tall 9:19.5 view — the photo's sides fall off-screen.
    const view = { width: 360, height: 780 };
    const photo = { width: 3000, height: 4000 };
    const rect = frameToPhotoRect({ left: 0, top: 0, width: 360, height: 780 }, view, photo);
    const scale = 780 / 4000;
    const visibleWidth = 360 / scale;
    expect(rect.originX).toBeGreaterThan((3000 - visibleWidth) / 2 - 200);
    expect(rect.originX + rect.width).toBeLessThanOrEqual(3000);
  });

  it('never returns a rectangle outside the photo', () => {
    const rect = frameToPhotoRect(
      { left: -50, top: -50, width: 1000, height: 1000 },
      { width: 400, height: 400 },
      { width: 800, height: 800 },
    );
    expect(rect.originX).toBe(0);
    expect(rect.originY).toBe(0);
    expect(rect.width).toBeLessThanOrEqual(800);
    expect(rect.height).toBeLessThanOrEqual(800);
  });
});
