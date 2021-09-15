import { Event, ServiceQueue, Worker } from "..";

/**
 * Represents a ServiceQueue that has no queue or pool.
 * This means, that work can always be done, but not deferred.
 * This means there are an infinite number of workers available.
 */
export class NoServiceQueue implements ServiceQueue {
  constructor() { }

  async enqueue(event: Event): Promise<Worker> {
    return new Worker(this);
  }

  length(): number {
    return 0;
  }

  setCapacity(capacity: number): void { }
  getCapacity(): number {
    return Infinity
  }

  /**
   * There is no queue or pool, so there are no working.
   * TODO: Consider actually implementing in the future.
   */
  working(): number {
    return 0;
  }

  setNumWorkers(num: number): void { }
  getNumWorkers(): number { return Infinity }


  isFull(): boolean { return false; }
  canEnqueue(): boolean { return false; }
  hasFreeWorker(): boolean { return true; }


  work(): void { }
}