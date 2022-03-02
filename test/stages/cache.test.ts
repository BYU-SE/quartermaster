import { Event, metronome, Cache } from "../../src";
import { ReplayDependency } from "./util";


describe('Cache', () => {
  let dependency: ReplayDependency;
  let cache: Cache;

  beforeEach(async () => {
    dependency = new ReplayDependency();
    cache = new Cache(dependency)

    metronome.resetCurrentTime();
    metronome.start();
  })
  afterEach(() => {
    metronome.stop(true);
  })

  test('stores previous results if successful', async () => {
    dependency.createReplays([true]);

    const res = await cache.accept(new Event("first"));

    const store = cache.getStore();
    const size = Object.keys(store).length;
    expect(size).toBe(1);
  })
  test('does not store result on fail', async () => {
    dependency.createReplays([false]);

    const res = await cache.accept(new Event("first")).catch(e => "fail");

    const store = cache.getStore();
    const size = Object.keys(store).length;
    expect(size).toBe(0);
  })


  describe('#setCapacity()', () => {
    test('removes all data in the cache', async () => {
      dependency.createReplays([true, true]);

      await cache.accept(new Event("first"));
      await cache.accept(new Event("second"));

      const originalSize = Object.keys(cache.getStore()).length;
      expect(originalSize).toBe(2);

      cache.clear();

      const clearedSize = Object.keys(cache.getStore()).length;
      expect(clearedSize).toBe(0);
    })
  });

  describe('#remove()', () => {
    test('removes the specified key when found', async () => {
      dependency.createReplays([true]);

      await cache.accept(new Event("first"));

      cache.remove("first");
      
      expect(cache.get("first")).toBeUndefined();
    })
    test('does not remove other keys', async () => {
      dependency.createReplays([true, true]);

      await cache.accept(new Event("first"));
      await cache.accept(new Event("second"));

      cache.remove("second");

      expect(cache.get("first")).toBeDefined();
      expect(cache.get("second")).toBeUndefined();
      const clearedSize = Object.keys(cache.getStore()).length;
      expect(clearedSize).toBe(1);
    })
    test('silent when the key is not found', async () => {
      dependency.createReplays([true, true]);

      await cache.accept(new Event("first"));
      await cache.accept(new Event("second"));

      cache.remove("third");

      expect(cache.get("first")).toBeDefined();
      expect(cache.get("second")).toBeDefined();
      const clearedSize = Object.keys(cache.getStore()).length;
      expect(clearedSize).toBe(2);
    })
  });

  test('preserves the wrapped stage\'s success payload', async () => {
    dependency.createReplays([true], "custom-success");

    const res = await cache.accept(new Event("first"));

    expect(res).toBe("custom-success");
  });

  test('returns cached payload when already in cache', async () => {
    dependency.createReplays([true, false], "custom-success", "custom-fail");

    const res1 = await cache.accept(new Event("first"));
    const res2 = await cache.accept(new Event("first"));

    expect(res1).toBe("custom-success");
    expect(res2).toBe("custom-success");
  });

  test('preserves the wrapped stage\'s fail payload', async () => {
    dependency.createReplays([false], "custom-success", "custom-fail");
    
    const res = await cache.accept(new Event("first")).catch(e => e);
    
    expect(res).toBe("custom-fail");
  });

  test('preserves wrapped stage\'s success payload; failed event not stored in cache', async () => {
    dependency.createReplays([false, true], "custom-success", "custom-fail");

    const res1 = await cache.accept(new Event("first")).catch(e => e);
    const res2 = await cache.accept(new Event("second")).catch(e => e);

    expect(res2).toBe("custom-success");
    expect(Object.keys(cache.getStore).length).toBe(0);
  }) 

})

