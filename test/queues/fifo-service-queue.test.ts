import { Event, metronome, FIFOServiceQueue } from "../../src";
import { testSequence } from "./util";


describe('FIFOServiceQueue', () => {
  let queue: FIFOServiceQueue;

  afterEach(() => {
    metronome.stop(true);
  })


  describe('#setCapacity()', () => {
    beforeEach(() => {
      queue = new FIFOServiceQueue(3, 1);
    });
    test('sets the value', async () => {
      queue.setCapacity(10);
      expect(queue.getCapacity()).toBe(10);
    })
    test('floors decimal values', async () => {
      queue.setCapacity(0.5);
      expect(queue.getCapacity()).toBe(0);
      queue.setCapacity(1.999);
      expect(queue.getCapacity()).toBe(1);
      queue.setCapacity(-0.5);
      expect(queue.getCapacity()).toBe(-1);
    })
  });
  describe('#setNumWorkers()', () => {
    beforeEach(() => {
      queue = new FIFOServiceQueue(3, 1);
    });
    test('sets the value', async () => {
      queue.setNumWorkers(10);
      expect(queue.getNumWorkers()).toBe(10);
    })
    test('floors decimal values', async () => {
      queue.setNumWorkers(0.5);
      expect(queue.getNumWorkers()).toBe(0);
      queue.setNumWorkers(1.999);
      expect(queue.getNumWorkers()).toBe(1);
      queue.setNumWorkers(-0.5);
      expect(queue.getNumWorkers()).toBe(0);
    })
    test('has lower bound of 0', async () => {
      queue.setNumWorkers(-0.5);
      expect(queue.getNumWorkers()).toBe(0);
      queue.setNumWorkers(-10);
      expect(queue.getNumWorkers()).toBe(0);
    });
  });

  describe('#hasFreeWorker()', () => {
    beforeEach(() => {
      queue = new FIFOServiceQueue(3, 3);
    });
    test('is true when empty', async () => {
      expect(queue.items.length).toBe(0);
      expect(queue.getNumWorkers()).toBeGreaterThan(0);
      expect(queue.hasFreeWorker()).toBe(true);
    })
    test('false when 0 workers', async () => {
      queue.setNumWorkers(0);
      expect(queue.hasFreeWorker()).toBe(false);
    })
    test('true when not workers are all busy', async () => {
      queue.enqueue(new Event("a"));
      queue.enqueue(new Event("b"));
      expect(queue.getNumWorkers()).toBe(3);
      expect(queue.hasFreeWorker()).toBe(true);
    })
    test('false when workers are all busy', async () => {
      queue.enqueue(new Event("a"));
      queue.enqueue(new Event("b"));
      queue.enqueue(new Event("c"));
      expect(queue.getNumWorkers()).toBe(3);
      expect(queue.hasFreeWorker()).toBe(false);
    })
  });

  describe('#working()', () => {
    beforeEach(() => {
      queue = new FIFOServiceQueue(3, 3);
    });
    test('0 when empty', async () => {
      expect(queue.working()).toBe(0);
    })
    test('increases when given work', async () => {
      queue.enqueue(new Event("a"));
      expect(queue.working()).toBe(1);
    })
  });

  describe('#canEnqueue()', () => {
    beforeEach(() => {
      queue = new FIFOServiceQueue(2, 2);
    });
    test('true when empty', async () => {
      expect(queue.canEnqueue()).toBe(true);
    })
    test('true when no capacity used', async () => {
      queue.enqueue(new Event("a"));
      expect(queue.canEnqueue()).toBe(true);
      queue.enqueue(new Event("b"));
      expect(queue.canEnqueue()).toBe(true);
    })
    test('true when partial capacity used', async () => {
      queue.enqueue(new Event("a"));
      queue.enqueue(new Event("b"));
      queue.enqueue(new Event("c"));
      expect(queue.canEnqueue()).toBe(true);
    })
    test('false when full capacity used', async () => {
      queue.enqueue(new Event("a"));
      queue.enqueue(new Event("b"));
      queue.enqueue(new Event("c"));
      queue.enqueue(new Event("d"));
      expect(queue.canEnqueue()).toBe(false);
    })
  });


  /* Behavioral tests */
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

