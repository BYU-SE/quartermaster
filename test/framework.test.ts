import { Event, eventSummary, EventSummary, metronome, simulation, Stage, stageSummary } from "../src";

class SuccessStage extends Stage {
  workOn(e: Event): Promise<void> {
    return Promise.resolve();
  }
}

describe('Framework', () => {
  let stage: SuccessStage;
  let stageWorkSpy: jest.SpyInstance;

  beforeEach(async () => {
    stage = new SuccessStage();
    stageWorkSpy = jest.spyOn(stage, 'workOn');

    metronome.resetCurrentTime();
    simulation.reset();
    metronome.realSleepTime = 0;
    simulation.eventsPer1000Ticks = 200;
  })

  describe("#reset", () => {
    beforeEach(async () => {
      await simulation.run(stage, 2);
    })

    test('resets the arrival rate', () => {
      simulation.reset();
      expect(simulation.getArrivalRate()).toBe(0);
    })
    test('resets the events sent counter', () => {
      simulation.reset();
      expect(simulation.getEventsSent()).toBe(0);
    })
    test('resets the event id counter', () => {
      expect(Event.getIDCounter()).toBe(2);
      simulation.reset();
      expect(Event.getIDCounter()).toBe(0);
    })
  })



  describe("#run", () => {
    test('sends the correct number of events to the first stage', async () => {
      await simulation.run(stage, 1000);
      expect(stageWorkSpy).toHaveBeenCalledTimes(1000);
    })


    describe("correctly dispatches events at a rate of eventsPer1000Ticks", () => {
      test('200', async () => {
        await verifySimulationRate(200);
      }, 1000)
      test('300', async () => {
        await verifySimulationRate(300)
      }, 1000)
      test('700', async () => {
        await verifySimulationRate(700);
      }, 1000)
      test('1000', async () => {
        await verifySimulationRate(1000);
      }, 1000)
      test('1250', async () => {
        await verifySimulationRate(1250);
      }, 1000)
      test('1500', async () => {
        await verifySimulationRate(1500);
      }, 1000)
      test('2000', async () => {
        await verifySimulationRate(2000);
      }, 1000)
    })
  })
  describe.skip("#runForNumTicks", () => {
    test('runs for the specified number of ticks', async () => {
      await simulation.runForNumTicks(stage, 1000);
      expect(metronome.now()).toBe(1000);
      expect(simulation.getEventsSent()).toBe(simulation.eventsPer1000Ticks);
    })
  })

  describe('#eventSummary', () => {
    test('returns an object of type event summary', () => {
      let eventArray: Event[] = [new Event('test1'), new Event('test2'), new Event('test3')];
      let summary: EventSummary = eventSummary(eventArray);
      expect(summary.length).toBe(3);
      expect(summary[2].count).toBe(3);
    })
  })
  describe('#stageSummary', () => {
    test('returns an object of type stage summary', () => {
      let stageArray: Stage[] = [new SuccessStage(), new SuccessStage()];
      let summary = stageSummary(stageArray);
      expect(summary.length).toBe(2);
    })
  })

  async function verifySimulationRate(rate: number): Promise<void> {
    const numEvents = Math.max(1000, rate * 2)
    metronome.resetCurrentTime();
    simulation.eventsPer1000Ticks = rate;
    metronome.setTimeout(() => {
      expect(simulation.getEventsSent()).toBeGreaterThanOrEqual(rate / 2 - 1);
      expect(simulation.getEventsSent()).toBeLessThanOrEqual(rate / 2 + 1);
    }, 500);
    await simulation.run(stage, numEvents);
    expect(stageWorkSpy).toHaveBeenCalledTimes(numEvents);
  }


})

