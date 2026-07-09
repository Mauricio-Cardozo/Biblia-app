import { detectSeason, parseWeekNumber, romanToInt, isSunday } from '@/utils/seasons';

describe('romanToInt', () => {
  it('converts Roman numerals', () => {
    expect(romanToInt('I')).toBe(1);
    expect(romanToInt('IV')).toBe(4);
    expect(romanToInt('X')).toBe(10);
    expect(romanToInt('XXXIV')).toBe(34);
  });
  it('returns 0 for unknown', () => {
    expect(romanToInt('')).toBe(0);
    expect(romanToInt('FOO')).toBe(0);
  });
});

describe('detectSeason', () => {
  it('detects Adviento', () => {
    expect(detectSeason('Domingo I de Adviento')).toBe('adviento');
  });
  it('detects Navidad', () => {
    expect(detectSeason('Natividad del Señor (Navidad)')).toBe('navidad');
  });
  it('detects Cuaresma', () => {
    expect(detectSeason('Domingo I de Cuaresma')).toBe('cuaresma');
  });
  it('detects Pascua', () => {
    expect(detectSeason('Domingo de Pascua')).toBe('pascua');
  });
  it('detects Ordinario', () => {
    expect(detectSeason('Domingo XII del Tiempo Ordinario')).toBe('ordinario');
  });
  it('returns null for unknown', () => {
    expect(detectSeason('Fiesta de la Sagrada Familia')).toBeNull();
  });
});

describe('parseWeekNumber', () => {
  it('extracts Roman numeral', () => {
    expect(parseWeekNumber('Domingo XII del Tiempo Ordinario')).toBe(12);
    expect(parseWeekNumber('Domingo III de Adviento')).toBe(3);
  });
  it('returns 0 if no Roman numeral', () => {
    expect(parseWeekNumber('Natividad del Señor')).toBe(0);
  });
});

describe('isSunday', () => {
  it('detects Domingo', () => {
    expect(isSunday('Domingo XII del Tiempo Ordinario')).toBe(true);
  });
  it('returns false for weekdays', () => {
    expect(isSunday('Feria IV de Tiempo Ordinario')).toBe(false);
  });
});
