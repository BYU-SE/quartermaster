import { Queue, Worker, Event } from "../";

export class NoQueue implements Queue {

  enqueue(event: Event): Promise<Worker> {
    return Promise.resolve(new Worker(this));
  }
  work(): void { }
  isFull(): boolean {
    return false;
  }
  hasFreeWorker(): Boolean {
    return true;
  }

  setCapacity(capacity: number): void { }
  getCapacity(): number { return Infinity }
  setNumWorkers(num: number): void { }
  getNumWorkers(): number { return Infinity; }
}