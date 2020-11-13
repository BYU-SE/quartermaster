import { Event, Queue, stats } from "../";
import { CircuitBreaker } from "./circuit-breaker";
import { Stage } from "./stage";
/**
 * Wraps a stage and prevents it from being called if its error rate
 * crosses a threshold. This ensures that time isn't being spent
 * waiting for a response that has a non-zero change of a failure.
 * 
 * Slow to scale up, quick to scale down.
 */

export class AdaptiveCircuitBreaker extends CircuitBreaker {
  public errorThreshold = 0.3;
  public capacity: number = 10;
  public timeInOpenState: number = 0;


  private _queue: Queue | null = null;
  private _queueMax: number = 0;
  private _scale: number = 1;


  constructor(protected wrapped: Stage) {
    super(wrapped);
  }

  async workOn(event: Event): Promise<void> {
    await this.wrapped.accept(event);
  }

  public decideState(): void {
    if (this._ring.length >= this.capacity) {
      const sum = this._ring.reduce((a, c) => a + c, 0);
      const avg = sum / this.capacity;

      if (this._queue) {
        if (avg > this.errorThreshold) {
          this._scale = Math.max(0.000001, this._scale - 0.005);
        }
        else {
          this._scale = Math.min(1, this._scale + 0.001);
        }

        const workers = this._queue.getNumWorkers();
        this._queue.setNumWorkers(Math.ceil(this._queueMax * this._scale))

        if (this._queue.getNumWorkers() < workers)
          stats.add("acb.decrease", 1)
        else
          stats.add("acb.increase", 1)
      }

    }
  }

  public setQueueToAlterNumWorkers(queue: Queue) {
    this._queueMax = queue.getNumWorkers();
    this._scale = 1;
    this._queue = queue;
  }
}
