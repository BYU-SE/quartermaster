import { Worker, Event } from "../";

/**
 * The basic queue contract utilized by a stage, composing of 
 * 1) A queue which allows work to be deferred
 * 2) A worker pool which executes work right now
 * 
 * Less commonly, a ServiceQueue can permit work to be done but not deferred, or
 * work to be deferred but not done.
 */
export interface ServiceQueue {
  /**
   * Adds an event to the queue and promises a worker to fulfill it.
   * 
   * In more detail, it checks if a worker is free to execute the task
   * immediately, before attempting to defer it by adding it to the queue.
   * An exception may be thrown if neither of these are accomplished.
   * 
   * @param event The event to be added to the queue
   * @returns A Promise for a free worker that will serve the event
   */
  enqueue(event: Event): Promise<Worker>

  /**
   * The amount of work deferred in the queue.
   */
  length(): number

  /**
   * Sets the amount of work able to be deferred
   * @param capacity The maximum amount of work able to be deferred
   */
  setCapacity(capacity: number): void;

  /**
   * Gets the amount of work able to be deferred
   */
  getCapacity(): number;


  /**
   * The amount of work currently being executed
   */
  working(): number

  /**
   * Sets the amount of work able to be done concurrently
   * @param num The amount of work able to be done concurrently
   */
  setNumWorkers(num: number): void;

  /**
   * Sets the amount of work able to be done concurrently
   */
  getNumWorkers(): number;


  /**
   * Can the queue accept work, to be executed immediately or deferred.
   */
  isFull(): boolean;

  /**
  * Is there capacity to defer work
  */
  canEnqueue(): boolean
  /**
  * Is work able to be executed immediately
  */
  hasFreeWorker(): boolean

  /**
   * Attempts to process any deferred work, if any, and a free worker exists.
   */
  work(): void;
}