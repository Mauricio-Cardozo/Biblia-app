const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => { mockStore[key] = val; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete mockStore[key]; return Promise.resolve(); }),
}));

import { addFavorito, removeFavorito, isFavorito, getFavoritos, Favorito } from '@/data/favoritos';

const fav1: Favorito = { id: '1', tipo: 'biblia', referencia: 'Jn 3,16', preview: 'Tanto amó Dios...', timestamp: 1 };
const fav2: Favorito = { id: '2', tipo: 'cic', referencia: 'CIC 1', preview: 'Dios...', timestamp: 2 };

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
});

describe('addFavorito', () => {
  it('adds and prepends', async () => {
    await addFavorito(fav1);
    await addFavorito(fav2);
    const favs = await getFavoritos();
    expect(favs).toHaveLength(2);
    expect(favs[0].id).toBe('2');
  });

  it('does not duplicate same id', async () => {
    await addFavorito(fav1);
    await addFavorito(fav1);
    const favs = await getFavoritos();
    expect(favs).toHaveLength(1);
  });
});

describe('removeFavorito', () => {
  it('removes by id', async () => {
    await addFavorito(fav1);
    await removeFavorito('1');
    expect(await getFavoritos()).toHaveLength(0);
  });
});

describe('isFavorito', () => {
  it('checks by id', async () => {
    expect(await isFavorito('1')).toBe(false);
    await addFavorito(fav1);
    expect(await isFavorito('1')).toBe(true);
  });
});
