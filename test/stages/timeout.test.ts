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
    dependency.createReplays([true]);
    dependency.latency = 5;

    const res = await timeout.accept(new Event("first"));

    expect(dependencyWorkSpy).toHaveBeenCalledTimes(1);
    expect(res).toBeUndefined;
  })

  test('doesn\'t wait for slow dependency responses', async () => {
    dependency.createReplays([true]);
    dependency.latency = 15;

    const response = await timeout.accept(new Event("first")).catch(e => "fail");
    expect(response).toBe("fail")
  })

  test('preserves the wrapped stage\'s success payload', async () => {
    dependency.createReplays([true], "custom-success");

    const res = await timeout.accept(new Event("first"));

    expect(res).toBe("custom-success");
  })

  test('preserves the wrapped stage\'s failure payload', async () => {
    dependency.createReplays([false], "custom-success", "custom-fail");

    const res = await timeout.accept(new Event("first")).catch(e => e);

    expect(res).toBe("custom-fail");
  })

  test('creates a timeout payload when the timeout is triggered', async () => {
    dependency.latency = 15;

    const res = await timeout.accept(new Event("first")).catch(e => e);

    expect(res).toBe("timeout");
  })

})

