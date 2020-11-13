import { Event, metronome, LRUCache, AvailableDependency } from "../../src";




async function createCache(): Promise<LRUCache> {
  const dependency = new AvailableDependency();
  dependency.availability = 1;

  const cache = new LRUCache(dependency);
  cache.capacity = 4;
  cache.ttl = 10;

  await cache.accept(new Event("hit-1"));
  await metronome.wait(1);
  await cache.accept(new Event("hit-2"));
  await metronome.wait(1);
  await cache.accept(new Event("hit-3"));
  return cache;
}


describe('LRUCache', () => {
  let cache: LRUCache;

  beforeEach(async () => {
    metronome.resetCurrentTime();
    metronome.start();
    cache = await createCache();
  })
  afterEach(() => {
    metronome.stop(true);
  })

  test('has a fixed capacity', async () => {
    await cache.accept(new Event("hit-4"));
    await cache.accept(new Event("hit-5"));

    const store = cache.getStore();
    const size = Object.keys(store).length;
    expect(size).toBe(cache.capacity);
  })

  test('evicts the oldest inserted objects first', async () => {
    await metronome.wait(1);
    await cache.accept(new Event("hit-4"));
    await metronome.wait(1);
    await cache.accept(new Event("hit-5"));

    const store = cache.getStore();
    const size = Object.keys(store);
    expect(Object.keys(store)).toStrictEqual(["hit-2", "hit-3", "hit-4", "hit-5",]);
  })
  test('evicts the least-recently-used', async () => {
    await metronome.wait(1);
    await cache.accept(new Event("hit-4"));
    await metronome.wait(1);
    await cache.accept(new Event("hit-5"));
    await metronome.wait(1);
    await cache.accept(new Event("hit-1"));

    const store = cache.getStore();
    const size = Object.keys(store);
    expect(Object.keys(store)).toStrictEqual(["hit-3", "hit-4", "hit-5", "hit-1"]);
  })
  test('evicts items past the ttl', async () => {
    await metronome.wait(9);

    const store = cache.getStore();
    const size = Object.keys(store);
    expect(Object.keys(store)).toStrictEqual(["hit-2", "hit-3"]);
  })
})

