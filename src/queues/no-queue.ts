import { Queue, Worker, Event } from "../";

export class NoQueue implements Queue {

  /**
   * Returns a promise for a worker assigned to service the event.
   * @param event 
   */
  enqueue(event: Event): Promise<Worker> {
    return Promise.resolve(new Worker(this));
  }

  /**
   * Sets the number of workers, but there are no workers.
   */
  work(): void { }

  /**
   * Is the queue full? There is no queue, so return false.
   */
  isFull(): boolean {
    return false;
  }
  
  /**
   * Is there a free worker that is not processing any events? There are no workers,
   * so return true.
   */
  hasFreeWorker(): Boolean {
    return true;
  }

  /**
   * Sets the max length of the queue, but there is no queue to set.
   * @param capacity 
   */
  setCapacity(capacity: number): void { }

  /**
   * Gets the max length of the queue, which is infinite.
   */
  getCapacity(): number { return Infinity }

  /**
   * Sets the number of workers, but there is no queue to add workers to.
   * @param num 
   */
  setNumWorkers(num: number): void { }

  /**
   * Gets the number of workers, which is infinite.
   */
  getNumWorkers(): number { return Infinity; }
}