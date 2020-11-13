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
    dependency.replay = [true]

    const res = await cache.accept(new Event("first"));

    const store = cache.getStore();
    const size = Object.keys(store).length;
    expect(size).toBe(1);
  })
  test('does not store result on fail', async () => {
    dependency.replay = [false]

    const res = await cache.accept(new Event("first")).catch(e => "fail");

    const store = cache.getStore();
    const size = Object.keys(store).length;
    expect(size).toBe(0);
  })

})

