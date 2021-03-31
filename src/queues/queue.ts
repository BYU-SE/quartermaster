import { Worker, Event } from "../";

/**
 * The basic queue contract utilized by a stage.
 */
export interface Queue {
  /**
   * Adds an event to the queue and promises a worker to fulfill it
   * @param event The event to be added to the queue
   * @returns A Promise for a free worker that will serve the event
   */
  enqueue(event: Event): Promise<Worker>

  /**
   * Is the queue full?
   */
  isFull(): boolean;
  
  /**
   * Sets the max length of the queue.
   * @param capacity 
   */
  setCapacity(capacity: number): void;

  /**
   * Gets the max length of the queue.
   */
  getCapacity(): number;

  /**
   * Is there a free worker?
   */
  hasFreeWorker(): Boolean

  /**
   * Sets the number of workers.
   * @param num 
   */
  setNumWorkers(num: number): void;

  /**
   * Gets the number of workers.
   */
  getNumWorkers(): number;

  /**
   * Attempts to process an element from the queue if there is something in 
   * the queue and if there is a free worker.
   */
  work(): void;
}