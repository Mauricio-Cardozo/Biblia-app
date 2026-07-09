const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => { mockStore[key] = val; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete mockStore[key]; return Promise.resolve(); }),
}));

import { calcularRacha, obtenerStats } from '@/data/streaks';

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
});

describe('calcularRacha', () => {
  it('returns 0 when no stored date', async () => {
    expect(await calcularRacha('racha_rosario_ultima')).toBe(0);
  });

  it('returns count when practice done today', async () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    mockStore['racha_rosario_ultima'] = iso;
    mockStore['racha_rosario_count'] = '5';
    expect(await calcularRacha('racha_rosario_ultima')).toBe(5);
  });
});

describe('obtenerStats', () => {
  it('returns zeros when empty', async () => {
    const stats = await obtenerStats();
    expect(stats.rosario_total).toBe(0);
    expect(stats.coronilla_total).toBe(0);
    expect(stats.rosario_ultima).toBeNull();
  });

  it('returns stored values', async () => {
    mockStore['racha_rosario_ultima'] = '2026-07-09';
    mockStore['stats_rosario_total'] = '42';
    mockStore['racha_coronilla_ultima'] = '2026-07-08';
    mockStore['stats_coronilla_total'] = '7';
    const stats = await obtenerStats();
    expect(stats.rosario_ultima).toBe('2026-07-09');
    expect(stats.rosario_total).toBe(42);
    expect(stats.coronilla_ultima).toBe('2026-07-08');
    expect(stats.coronilla_total).toBe(7);
  });
});
