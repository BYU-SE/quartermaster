import { Event, Queue, Worker } from "..";


type Item = { callback: Function, event: Event };

/**
 * A FIFO queue implementation.
 */
export class LIFOQueue implements Queue {
  private items: Item[] = [];
  private workers: Worker[] = [];
  private capacity: number = 0;

  constructor(capacity: number, numWorkers: number) {
    this.setCapacity(capacity);
    this.setNumWorkers(numWorkers);
  }

  /**
   * Returns a promise for a worker assigned to service the event.
   * @param event 
   */
  async enqueue(event: Event): Promise<Worker> {
    return new Promise<Worker>((resolve, reject) => {
      const callback = (err: any, data: Worker) => {
        if (err)
          reject(err);
        else
          resolve(data);
      }
      this.add({ event, callback });
    })
  }

  /**
   * Is the queue full?
   */  
  isFull(): boolean {
    return this.items.length == this.capacity
  }

  /**
   * Is there a free worker that is not processing any events?
   */
  hasFreeWorker(): boolean {
    return this.workers.some(w => w.event == null);
  }

  /**
   * Indicates whether the queue has any queued events left to process.
   */
  hasWorkToDo(): boolean {
    return this.items.length > 0;
  }

  /**
   * Adds work to the queue.
   * @param item 
   */
  add(item: Item): void {
    this.items.push(item);
    this.work();
  }

  /**
   * A worker processes an event off the queue if there is an event in the queue
   * and if there is a free worker.
   */
  work(): void {
    if (!this.hasFreeWorker())
      return;

    if (!this.hasWorkToDo())
      return;


    const nextUp: Item = this.items.pop() as Item
    const worker = this.workers.find(w => w.event == null) as Worker;
    worker.event = nextUp.event;
    nextUp.callback(null, worker);
  }

  /**
   * Returns current length of queue.
   */
   length(): number {
    return this.items.length;
  }

  /**
   * Sets the max length of the queue.
   * @param capacity 
   */
  setCapacity(capacity: number): void {
    this.capacity = capacity;
  }
  
  /**
   * Gets the max length of the queue.
   */  
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Sets the number of workers. If more than there are currently, add new 
   * Workers. If less than there are currently, just drop some from the pool,
   * while allowing those workers to process whatever work they have remaining
   * @param num Then new amount of workers
   */
  setNumWorkers(num: number): void {
    if (num > this.workers.length) {
      while (this.workers.length < num)
        this.workers.push(new Worker(this));
    } else {
      // This really just depends on garbage collection implementation. For
      // some gc, we have to explicitly destroy reference to the queue in the
      // worker
      for (let i = num; i < this.workers.length; i++) {
        this.workers[i].destroy();
      }
      this.workers.length = num;
    }
  }

  /**
   * Gets the number of workers.
   */
  getNumWorkers(): number {
    return this.workers.length
  }
}