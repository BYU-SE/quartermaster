import { Event, Response, metronome, CircuitBreaker } from "../../src";
import { ReplayDependency } from "./util";

describe('Circuit-breaker', () => {
  let dependency: ReplayDependency;
  let breaker: CircuitBreaker;
  const nofails = [true, true, true, true];
  const someFails = [false, false, true, true];
  const allFails = [false, false, false, false];

  async function runExperiment(errorThreshold: number, replay: boolean[], expectedState: string): Promise<void> {
    breaker.errorThreshold = errorThreshold;
    dependency.replay = replay

    await sendTraffic(replay.length);

    expect(breaker.state).toBe(expectedState)
  }
  function sendTraffic(num: number): Promise<Response[]> {
    const responses: Promise<Response>[] = [];
    for (let i = 0; i < num; i++) {
      responses.push(breaker.accept(new Event("first")).catch(e => "fail"))
    }
    return Promise.all(responses);
  }





  beforeEach(async () => {
    dependency = new ReplayDependency();
    breaker = new CircuitBreaker(dependency)
    breaker.capacity = 4;

    metronome.resetCurrentTime();
    metronome.start();
  })
  afterEach(() => {
    metronome.stop(true);
  })


  test('starts closed', async () => {
    expect(breaker.state).toBe("closed")
  })
  test('does not decide state until at least capacity requests have been accepted', async () => {
    dependency.replay = allFails
    await sendTraffic(3);
    expect(breaker.state).toBe("closed")
  })

  describe('threshold boundaries', () => {
    test('no fails, equal to threshold', async () => {
      await runExperiment(0, nofails, "closed");
    })
    test('no fails, under threshold', async () => {
      await runExperiment(0.1, nofails, "closed");
    })
    test('some fails, equal to threshold', async () => {
      await runExperiment(0.5, someFails, "closed");
    })
    test('some fails, under threshold', async () => {
      await runExperiment(0.6, someFails, "closed");
    })
    test('some fails, over threshold', async () => {
      await runExperiment(0.4, someFails, "open");
    })
  })

  describe('half-open', () => {
    test('moves in to half-open after being open for some time', async () => {
      breaker.errorThreshold = 0.1;
      dependency.replay = allFails.concat(allFails);
      await sendTraffic(4);
      expect(breaker.state).toBe("open");
      expect(breaker.ring).toStrictEqual([])

      await metronome.wait(breaker.timeInOpenState + 5);
      const res = await sendTraffic(4);
      expect(breaker.state).toBe("half-open")
    })
  });
})

