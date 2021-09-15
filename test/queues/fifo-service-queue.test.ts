import { Event, metronome, FIFOServiceQueue } from "../../src";
import { testSequence } from "./util";


describe('FIFOServiceQueue', () => {
  let queue: FIFOServiceQueue;

  afterEach(() => {
    metronome.stop(true);
  })

  describe('typical', () => {
    beforeEach(() => {
      queue = new FIFOServiceQueue(3, 1);
      metronome.resetCurrentTime();
      metronome.start();
    })

    test('accepts requests', async () => {
      const time = metronome.now();
      const event = new Event("a");
      const worker = await queue.enqueue(event).catch(err => console.error(err));
      expect(worker).toBeDefined;
      expect(metronome.now() - time).toBe(0);
    })

    describe('with 1 worker', () => {
      test('processes events in order', async () => {
        return testSequence(queue,
          [{ key: "a", time: 20 }, { key: "b", time: 20 }, { key: "c", time: 20 }],
          [{ key: "a" }, { key: "b" }, { key: "c" }]
        );
      })

      test('processes events with identical work time', async () => {
        return testSequence(queue,
          [{ key: "a", time: 20 }, { key: "b", time: 20 }, { key: "c", time: 20 }],
          [{ key: "a", time: 20 }, { key: "b", time: 41 }, { key: "c", time: 62 }]
        );
      })
      test('processes events with varying work time', async () => {
        return testSequence(queue,
          [{ key: "a", time: 1 }, { key: "b", time: 5 }, { key: "c", time: 1 }],
          [{ key: "a", time: 1 }, { key: "b", time: 7 }, { key: "c", time: 9 }]
        );
      })
    });
    describe('with 2 workers', () => {
      beforeEach(() => {
        queue.setNumWorkers(2);
      })

      test('has 2 workers', () => {
        expect(queue.getNumWorkers()).toBe(2);
      });

      test('processes events in order', async () => {
        return testSequence(queue,
          [{ key: "a", time: 20 }, { key: "b", time: 20 }, { key: "c", time: 20 }],
          [{ key: "a" }, { key: "b" }, { key: "c" }]
        );
      })

      test('processes events with identical work time', async () => {
        return testSequence(queue,
          [{ key: "a", time: 20 }, { key: "b", time: 20 }, { key: "c", time: 20 }],
          [{ key: "a", time: 20 }, { key: "b", time: 20 }, { key: "c", time: 41 }]
        );
      })
      test('processes events with varying work time', async () => {
        // expected c to complete before b since a will finish fast, then start
        // work on c and finish before b's work time is done
        return testSequence(queue,
          [{ key: "a", time: 2 }, { key: "b", time: 5 }, { key: "c", time: 1 }],
          [{ key: "a", time: 2 }, { key: "c", time: 4 }, { key: "b", time: 5 }]
        );
      })
    })
  });

  describe('0-queue, 1-worker', () => {
    beforeEach(() => {
      queue = new FIFOServiceQueue(0, 1);
      metronome.resetCurrentTime();
      metronome.start();
    })
    test('accepts', async () => {
      const time = metronome.now();
      const event = new Event("a");
      const worker = await queue.enqueue(event);
      expect(worker).toBeDefined;
      expect(metronome.now() - time).toBe(0);
    })
    test('rejects a second', async () => {
      expect.assertions(1);
      const event = new Event("a");
      const worker = await queue.enqueue(event);

      // worker2 should get a fail since no workers available and can't queue
      const worker2 = await queue.enqueue(event).catch(e => {
        expect(e).toBe("fail")
      });
    })
  });
})

