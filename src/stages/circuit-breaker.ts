import { WrappedStage } from "./wrapped-stage";
import { Event, metronome, ResponsePayload } from "../";

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
  protected static readonly SUCCESS: number = 0;
  protected static readonly FAILURE: number = 1;

  /**
   * @defaultvalue 0.3
   */
  public errorThreshold = 0.3;

  /**
   * @defaultvalue 10
   */
  public capacity: number = 10;

  /**
   * @defaultvalue 3000
   */
  public timeInOpenState: number = 3000;


  /**
   * @defaultvalue "closed"
   */
  protected _state: CircuitBreakerState = "closed";

  /**
   * @defaultvalue []
   */
  protected _ring: number[] = [];

  /**
   * @defaultvalue 0
   */
  protected _openTime = 0;

  async workOn(event: Event): Promise<ResponsePayload> { // do we still need to include this.record() for successes/fails?
    // settle the state - important to be done before any work in case open -> half-open
    this.settleState();

    if (this._state == "open") {
      throw "circuit-breaker-open";
    }

    try {
      let payload = await this.wrapped.accept(event);
      this.record(CircuitBreaker.SUCCESS);
      return payload;
    } catch (e) {
      this.record(CircuitBreaker.FAILURE);
      throw e;
    }
  }

  protected record(status: number): void {
    this._ring.push(status);
    if (this._ring.length > this.capacity) {
      this._ring.shift();
    }
  }



  /**
   * Settles the circuit breaker's state into the correct values - this is necessary
   * because we want timeInOpenState to be a "live" value. So it can be edited dynamically
   * without having to stop a metronome timer and restart to a smaller value.
   * 
   * The circuit breaker's state is evaluated on each inbound request and also whenever
   * the getState() and getRing() function are called to ensure consistency.
   */
  protected settleState(): void {
    // if open, always check if its time to half-open
    if (this._state == "open") {
      const diff: number = metronome.now() - this._openTime;
      if (diff > this.timeInOpenState)
        this.halfOpen();
    }

    // for closed and half-open, we want to wait until the ring is full.
    if (this._ring.length >= this.capacity) {
      const sum = this._ring.reduce((a, c) => a + c, 0);
      const avg = sum / this.capacity;

      if (this._state == "closed") {
        if (avg > this.errorThreshold)
          this.open();
      } else if (this._state == "half-open") {
        if (avg > this.errorThreshold)
          this.open();
        else
          this.close();
      }
    }
  }

  public observedErrorRate(): number {
    this.settleState();
    const sum = this._ring.reduce((a, c) => a + c, 0);
    return sum / this.capacity;
  }


  public open(): void {
    if (this._state == "open")
      return;

    this._state = "open";
    this._ring = [];
    this._openTime = metronome.now();
  }
  protected close(): void {
    if (this._state == "closed")
      return;

    this._state = "closed";
    this._ring = [];
  }
  protected halfOpen(): void {
    if (this._state == "half-open")
      return;

    this._state = "half-open";
    this._ring = []
  }

  public getState(): CircuitBreakerState {
    this.settleState();
    return this._state;
  }
  public getRing(): number[] {
    this.settleState();
    return this._ring;
  }
}
