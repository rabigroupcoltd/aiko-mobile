import { decideUpdate, type PlayUpdateInfo } from '../appUpdate';

jest.mock('expo-in-app-updates', () => ({ checkForUpdate: jest.fn(), startUpdate: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));

const play = (patch: Partial<PlayUpdateInfo> = {}): PlayUpdateInfo => ({
  updateAvailable: true,
  updateInProgress: false,
  immediateAllowed: true,
  storeVersion: '12',
  priority: 0,
  ...patch,
});

describe('decideUpdate', () => {
  it('does nothing when Play has no update', () => {
    expect(decideUpdate(play({ updateAvailable: false }))).toEqual({ kind: 'none' });
  });

  it('does nothing when Play cannot be reached or the app is not from Play', () => {
    expect(decideUpdate(null)).toEqual({ kind: 'none' });
  });

  it('offers a normal release', () => {
    expect(decideUpdate(play())).toEqual({ kind: 'offer', storeVersion: '12' });
  });

  it('does not offer when Play will not allow the update flow', () => {
    expect(decideUpdate(play({ immediateAllowed: false }))).toEqual({ kind: 'none' });
  });

  it('resumes an interrupted update', () => {
    expect(decideUpdate(play({ updateAvailable: false, updateInProgress: true }))).toEqual({ kind: 'resume' });
  });

  it('requires a release published with priority 4 or 5', () => {
    expect(decideUpdate(play({ priority: 4 }))).toEqual({ kind: 'require' });
    expect(decideUpdate(play({ priority: 5 }))).toEqual({ kind: 'require' });
    expect(decideUpdate(play({ priority: 3 }))).toEqual({ kind: 'offer', storeVersion: '12' });
  });
});
