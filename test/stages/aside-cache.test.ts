import { metronome, AsideCache, Event } from "../../src";
import { ReplayDependency } from "./util";


describe('AsideCache', () => {
  let cache: AsideCache;
  let dependency:ReplayDependency;

  beforeEach(async () => {
    metronome.resetCurrentTime();
    dependency = new ReplayDependency();
    cache = new AsideCache(dependency);

    metronome.resetCurrentTime();
    metronome.start();
  })

  afterEach(() => {
    metronome.stop(true);
  })

  test("throws a failure if not in cache", async () => {
    dependency.createReplays([true], "custom-success");

    // the first call will always fail
    const res = await cache.workOn(new Event("first")).catch(e=>e);
    expect(res).toBe("fail");
    
  });

  test('preserves cached payload', async () => {
    dependency.createReplays([true, true], "custom-success");
    const res = await cache.workOn(new Event("first")).catch(e=>e);
    
    // block to let the dependency fulfill the original request
    await metronome.wait(2);

    const res2 = await cache.workOn(new Event("first")).catch(e=>e);
    expect(res).toBe("fail");
    expect(res2).toBe("custom-success");
  })

  
})