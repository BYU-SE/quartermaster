import { Event, metronome, Stage } from "../../src";


/**
 * Helper class to just make methods public, doesn't do any work.
 */
class DummyStage extends Stage {
  async workOn(event: Event): Promise<void> { }
  public add(event: Event): Promise<void> {
    return super.add(event);
  }
}



describe('Stage', () => {
  let stage: DummyStage;
  let accept: jest.SpyInstance;
  let add: jest.SpyInstance;
  let workOn: jest.SpyInstance;

  async function createEvent(): Promise<void> {
    await stage.accept(new Event("e")).catch(e => null);
  }

  beforeEach(() => {
    stage = new DummyStage();
    accept = jest.spyOn(stage, 'accept');
    add = jest.spyOn(stage, 'add');
    workOn = jest.spyOn(stage, 'workOn');


    metronome.resetCurrentTime();
    metronome.start();
  })
  afterEach(() => {
    metronome.stop(true);
  })

  describe('accept()', () => {
    test('calls accept()', async () => {
      await createEvent();

      expect(accept).toHaveBeenCalledTimes(1);
    })
  })

  describe('add()', () => {
    test('calls add()', async () => {
      await createEvent();

      expect(add).toHaveBeenCalledTimes(1);
    })
    test('halts event flow when fails', async () => {
      add.mockImplementation(() => Promise.reject("fail"))
      await createEvent();

      expect(workOn).not.toHaveBeenCalled();
    })
  })

  describe('workOn()', () => {
    test('calls workOn()', async () => {
      await createEvent();

      expect(workOn).toHaveBeenCalledTimes(1);
    })
  })

})

