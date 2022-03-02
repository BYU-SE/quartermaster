import { Event, Response, metronome, CircuitBreaker, Response3, ResponsePayload } from "../../src";
import { ReplayDependency } from "./util";

describe('Circuit-breaker', () => {
  let dependency: ReplayDependency;
  let breaker: CircuitBreaker;
  const nofails = [true, true, true, true];
  const someFails = [false, false, true, true];
  const allFails = [false, false, false, false];

  async function runExperiment(errorThreshold: number, replay: boolean[], expectedState: string): Promise<void> {
    breaker.errorThreshold = errorThreshold;
    dependency.createReplays(replay);

    await sendTraffic(replay.length);

    expect(breaker.state).toBe(expectedState)
  }
  function sendTraffic(num: number): Promise<ResponsePayload[]> {
    const responses: Promise<ResponsePayload>[] = [];
    for (let i = 0; i < num; i++) {
      responses.push(breaker.accept(new Event("first")).catch(e => e))
    }
    return Promise.all(responses);
  }





  beforeEach(async () => {
    dependency = new ReplayDependency();
    breaker = new CircuitBreaker(dependency)
    breaker.capacity = 4;

    metronome.resetCurrentTime();
    metronome.start();
    metronome.realSleepTime = 0;
  })
  afterEach(() => {
    metronome.stop(true);
  })

  test('starts closed', async () => {
    expect(breaker.state).toBe("closed")
  })
  test('does not decide state until at least capacity requests have been accepted', async () => {
    dependency.createReplays(allFails);
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

  describe("closed", () => {
    test('preserves payload', async () => {
      // don't allow it to open
      breaker.errorThreshold = 0.75;
      dependency.createReplays(someFails.concat(someFails), "custom-success", "custom-failure");
      const res2 = await sendTraffic(4);
      expect(breaker.state).toBe("closed")
      expect(res2).toStrictEqual(["custom-failure", "custom-failure", "custom-success", "custom-success"])
    });
  })
  


  describe('half-open', () => {
    test('moves in to half-open after being open for some time', async () => {
      breaker.errorThreshold = 0.1;
      dependency.createReplays(allFails.concat(allFails));
      await sendTraffic(4);
      expect(breaker.state).toBe("open");
      expect(breaker.ring).toStrictEqual([])

      await metronome.wait(breaker.timeInOpenState + 5);
      const res = await sendTraffic(4);
      expect(breaker.state).toBe("half-open")
    })

    test('preserves payload', async () => {
      // force it into the half-open state
      breaker.errorThreshold = 0.1;
      dependency.createReplays(allFails.concat(allFails));
      await sendTraffic(4);
      await metronome.wait(breaker.timeInOpenState + 5);
      const res = await sendTraffic(4);
      expect(breaker.state).toBe("half-open")

      // which permits requests to be send to the dependency, whose payload should be preserved
      dependency.createReplays(nofails, "custom-success");
      const [res2] = await sendTraffic(1);
      expect(res2).toBe("custom-success")
    });
  });

  describe("open", () => {
    test('throws a custom failure payload indicating open breaker', async () => {
      breaker.errorThreshold = 0.1;
      dependency.createReplays(allFails, "custom-success", "custom-failure");
      await sendTraffic(4);

      // now circuit breaker is open, send the next set of traffic.
      const res = await sendTraffic(4);
      expect(breaker.state).toBe("open")
      expect(res).toStrictEqual(["circuit-breaker-open", "circuit-breaker-open", "circuit-breaker-open", "circuit-breaker-open"])
    });
  })

})

