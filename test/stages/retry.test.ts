import { Event, metronome, Retry } from "../../src";
import { ReplayDependency } from "./util";

describe('Retry', () => {
  let dependency: ReplayDependency;
  let replayWorkSpy: jest.SpyInstance;
  let retry: Retry;

  beforeEach(async () => {
    dependency = new ReplayDependency();
    replayWorkSpy = jest.spyOn(dependency, 'workOn');
    retry = new Retry(dependency);

    metronome.resetCurrentTime();
    metronome.start();
  })
  afterEach(() => {
    metronome.stop(true);
  })

  test('does not retry on success', async () => {
    dependency.replay = [true, true]
    retry.attempts = 2;

    await retry.accept(new Event("first"));

    expect(replayWorkSpy).toHaveBeenCalledTimes(1);
  })
  test('retries on fail', async () => {
    dependency.replay = [false, true]
    retry.attempts = 2;

    await retry.accept(new Event("first"));

    expect(replayWorkSpy).toHaveBeenCalledTimes(2);
  })
  test('does not retry more than count', async () => {
    dependency.replay = [false, false, false]
    retry.attempts = 2;

    await retry.accept(new Event("first")).catch(e => "fail");

    expect(replayWorkSpy).toHaveBeenCalledTimes(2);
  })
  test('returns the latest attempt\'s result', async () => {
    dependency.replay = [false, false, true]
    retry.attempts = 3;

    const res = await retry.accept(new Event("first"));

    expect(res).toBe("success")
  })
  test('fails if all attempts fail', async () => {
    dependency.replay = [false, false, false, false]
    retry.attempts = 2;

    const res = await retry.accept(new Event("first")).catch(e => "fail");

    expect(res).toBe("fail")
  })
})

