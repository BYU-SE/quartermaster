import { Event, Response, metronome, Stage } from "../../src";


/**
 * Helper class to just make methods public, doesn't do any work.
 */
class DummyStage extends Stage {
  async workOn(event: Event): Promise<void> { }
  public success(event: Event): Response {
    return super.success(event);
  }
  public fail(event: Event): Response {
    return super.fail(event);
  }
  public add(event: Event): Promise<void> {
    return super.add(event);
  }
}



describe('Stage', () => {
  let stage: DummyStage;
  let accept: jest.SpyInstance;
  let add: jest.SpyInstance;
  let workOn: jest.SpyInstance;
  let success: jest.SpyInstance;
  let fail: jest.SpyInstance;

  function createEvent(): Promise<Response> {
    return stage.accept(new Event("e")).catch(e => "fail");
  }

  beforeEach(() => {
    stage = new DummyStage();
    accept = jest.spyOn(stage, 'accept');
    add = jest.spyOn(stage, 'add');
    workOn = jest.spyOn(stage, 'workOn');
    success = jest.spyOn(stage, 'success');
    fail = jest.spyOn(stage, 'fail');


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
    test('calls success() when no error is thrown and no rejected promise is returned', async () => {
      await createEvent();

      expect(success).toHaveBeenCalledTimes(1);
    })
    test('calls fail() when error thrown', async () => {
      workOn.mockImplementation(() => { throw "fail" })
      await createEvent();

      expect(fail).toHaveBeenCalledTimes(1);
      expect(success).not.toHaveBeenCalled();
    })
    test('calls fail() when rejected Promise is returned', async () => {
      workOn.mockImplementation(() => Promise.reject("fail"))
      await createEvent();

      expect(fail).toHaveBeenCalledTimes(1);
      expect(success).not.toHaveBeenCalled();
    })
  })



})

