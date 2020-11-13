import { WrappedStage } from "./wrapped-stage";
import { Event, Response, metronome } from "../";

/**
 * The binary circuit breaker has 3 states.
 * Closed = allow requests through
 * Open = do not allow requests through
 * half-open = allow requests through for some time, before deciding which
 *             state to transition to next
 */
type CircuitBreakerState = "closed" | "open" | "half-open"


/**
 * Wraps a stage and prevents it from being called if its error rate
 * crosses a threshold. This ensures that time isn't being spent
 * waiting for a response that has a non-zero change of a failure.
 */

export class CircuitBreaker extends WrappedStage {
  public errorThreshold = 0.3;
  public capacity: number = 10;
  public timeInOpenState: number = 3000;


  protected _state: CircuitBreakerState = "closed";
  protected _ring: number[] = [];
  protected _openTime = 0;
  async workOn(event: Event): Promise<void> {
    if (this._state == "open")
      throw "fail";
    await this.wrapped.accept(event);
  }


  protected success(event: Event): Response {
    this.record(0);
    return super.success(event);
  }


  protected fail(event: Event): Response {
    this.record(1);
    return super.fail(event);
  }


  protected record(status: number): void {
    this._ring.push(status);
    if (this._ring.length > this.capacity) {
      this._ring.shift();
    }

    this.decideState();
  }

  // We have 0, 0, 0, 0, 0, 0, 0, 1, 1, 1
  // avg = 0.3. avg >= threshold ? 
  /**
   * A side effect is that after going into the OPEN state, if requests
   * stop for > TimeInOpenState, it doesn't matter since the ring has
   * to fill up first
   */
  public decideState(): void {
    if (this._ring.length >= this.capacity) {
      const sum = this._ring.reduce((a, c) => a + c, 0);
      const avg = sum / this.capacity;
      switch (this._state) {
        case "closed":
          if (avg > this.errorThreshold)
            this.open();
          break;
        case "open":
          const diff: number = metronome.now() - this._openTime;
          if (diff > this.timeInOpenState)
            this.halfOpen();
          break;
        case "half-open":
          if (avg > this.errorThreshold)
            this.open();
          else
            this.close();
          break;
      }
    }
  }


  public open(): void {
    if (this.state == "open")
      return;

    this._state = "open";
    this._ring = [];
    this._openTime = metronome.now();
  }
  protected close(): void {
    if (this.state == "closed")
      return;

    this._state = "closed";
    this._ring = [];
  }
  protected halfOpen(): void {
    if (this.state == "half-open")
      return;

    this._state = "half-open";
    this._ring = []
  }

  get state(): CircuitBreakerState {
    return this._state;
  }
  get ring(): number[] {
    return this._ring;
  }
}
