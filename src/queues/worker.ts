import { Event } from "../";
import { Queue } from "./queue";

/**
 * A worker of the pool, which processes the individual events. A worker
 * can only do one work at a time. It is reserved by setting the `event` 
 * property and unsetting it when the work is done.
 */
export class Worker {
  public event: Event | null = null;
  constructor(private queue: Queue | null) { }

  /**
   * Unlocks the worker to be freed, so it can process another event on the
   * queue, if it is still attached to one.
   */
  public free() {
    this.event = null;
    if (this.queue)
      this.queue.work();
  }

  /**
   * Detaches the worker from the queue, so it no longer notifies the queue
   * that it can do work when it frees up.
   */
  public destroy() {
    this.queue = null;
  }
}
