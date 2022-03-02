import { metronome, LRUCache, AvailableDependency } from "../../src";


describe('LRUCache', () => {
  let cache: LRUCache;

  beforeEach(async () => {
    metronome.resetCurrentTime();
    cache = new LRUCache(new AvailableDependency());
    cache.ttl = 10;
    cache.capacity = 4;
  })

  describe('evicts', () => {
    test('few items past the ttl', async () => {
      cache.set("expired", { time: -100 });
      cache.set("expired2", { time: -100 });
      const store = cache.getStore();
      expect(Object.keys(store)).toStrictEqual([]);
    })
    test('many items past the ttl', async () => {
      cache.set("expired", { time: -50 });
      cache.set("expired2", { time: -20 });
      cache.set("almost", { time: -10 });
      cache.set("not", { time: -2 });
      cache.set("impossible", { time: 2 });

      const store = cache.getStore();
      expect(Object.keys(store)).toStrictEqual(["almost", "not", "impossible"]);
    })
    test('the oldest inserted', async () => {
      cache.set("1", { time: 0 });
      cache.set("2", { time: 0 });
      cache.set("3", { time: 0 });
      cache.set("4", { time: 0 });
      cache.set("5", { time: 0 });

      const store = cache.getStore();
      expect(Object.keys(store).sort()).toStrictEqual(["2", "3", "4", "5"]);
    })
    test('the least recently used', async () => {
      cache.set("1", { time: 0 });
      cache.set("2", { time: 0 });
      cache.set("3", { time: 0 });
      cache.set("4", { time: 0 });
      cache.get("1");
      cache.set("5", { time: 0 });

      const store = cache.getStore();
      expect(Object.keys(store).sort()).toStrictEqual(["1", "3", "4", "5"]);
    })
  });

  test('has a fixed capacity', async () => {
    cache.set("1", { time: 0 });
    cache.set("2", { time: 0 });
    cache.set("3", { time: 0 });
    cache.set("4", { time: 0 });
    cache.set("5", { time: 0 });

    const store = cache.getStore();
    const size = Object.keys(store).length;
    expect(size).toBe(cache.capacity);
  })

  test("clears order and cache items", async () => {
    cache.set("1", {time:0});
    cache.clear();
    
    const store = cache.getStore();
    const size = Object.keys(store).length;
    expect(size).toBe(0);
    expect(cache["order"].length).toBe(0);
  });
})