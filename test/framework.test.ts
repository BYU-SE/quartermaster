import { Event, metronome, simulation, Stage } from "../src";

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

    simulation.eventsPer1000Ticks = 200;
  })

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






  async function verifySimulationRate(rate: number): Promise<void> {
    const numEvents = Math.max(1000, rate * 2)
    metronome.resetCurrentTime();
    simulation.eventsPer1000Ticks = rate;
    metronome.setTimeout(() => {
      expect(simulation.getEventsSent()).toBeGreaterThanOrEqual(rate / 2 - 1);
      expect(simulation.getEventsSent()).toBeLessThanOrEqual(rate / 2 + 1);
    }, 500);
    //metronome.debug();
    await simulation.run(stage, numEvents);
    expect(stageWorkSpy).toHaveBeenCalledTimes(numEvents);
  }

})

