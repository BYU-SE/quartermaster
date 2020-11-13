import { Event, metronome, Timeout } from "../../src";
import { ReplayDependency } from "./util";


describe('Timeout', () => {
  let dependency: ReplayDependency;
  let dependencyWorkSpy: jest.SpyInstance;
  let timeout: Timeout;

  beforeEach(async () => {
    dependency = new ReplayDependency();
    dependencyWorkSpy = jest.spyOn(dependency, 'workOn');
    timeout = new Timeout(dependency)
    timeout.timeout = 10;

    metronome.resetCurrentTime();
    metronome.start();
  })
  afterEach(() => {
    metronome.stop(true);
  })

  test('allows quick dependency responses', async () => {
    dependency.replay = [true]
    dependency.latency = 5;

    const res = await timeout.accept(new Event("first"));

    expect(dependencyWorkSpy).toHaveBeenCalledTimes(1);
    expect(res).toBe("success")
  })

  test('doesn\'t wait for slow dependency responses', async () => {
    dependency.replay = [true]
    dependency.latency = 15;

    const response = await timeout.accept(new Event("first")).catch(e => "fail");
    expect(response).toBe("fail")
  })
})

