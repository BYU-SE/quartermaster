type DelayedCall = {
  tickToExecute: number;
  callback: Function;
};

import "colors";

class Metronome {
  // don't do work when there is nothing to do
  _sleepResolve: Function | null;
  // need an interval since node can exit early if no work is being done
  _keepAlive: any;
  _keepAliveLastTick: number;

  _callbacks: DelayedCall[];
  _currentTick: number;

  private _stopResolve: Function | null;

  constructor() {
    this._keepAlive = null;
    this._keepAliveLastTick = 0;
    this._currentTick = 0;
    this._callbacks = [];
    this._sleepResolve = null;
    this._stopResolve = null;
  }

  now() {
    return this._currentTick;
  }

  async start(ticksToExecute: number = Infinity): Promise<void> {
    const id = Math.floor(Math.random() * 9999);
    this._keepAlive = setInterval(() => {
      console.log("timer keep-alive");
      if (this.now() == this._keepAliveLastTick) {
        console.log("Warning! The metronome hasn't advanced in 5 seconds, despite some process keeping this alive.")
        metronome.debug(true)
      }

      this._keepAliveLastTick = this.now();
    }, 5000);
    return new Promise(async (resolve) => {
      this._stopResolve = resolve;
      while (ticksToExecute--) {
        if (!this._keepAlive)
          break;

        await this.tick();
      }
      resolve();
    });
  }

  async tick(): Promise<void> {
    await this.sleep();
    for (let i = 0; i < this._callbacks.length; i++) {
      const call = this._callbacks[i];
      if (call.tickToExecute == this._currentTick) {
        await call.callback();
        this._callbacks.splice(i, 1);
        i--;
      }
    }

    this._currentTick++;
  }

  // halt until resolved
  private async sleep() {
    // In Node 14- promise rejections are handled nextTick. The simulation
    // usually generates thousands of unhandled promises, which will cause
    // a long delay after the simulation. We need to wait real time for a
    // bit just to be sure we can handle rejections.
    // https://github.com/nodejs/node/issues/34851
    waitRealTime(1);

    if (this._callbacks.length == 0) {
      await new Promise((resolve) => {
        this._sleepResolve = resolve;
      });
    }
  }

  private awake() {
    // don't awake if the metronome has not been started yet
    if (!this._keepAlive) {
      return;
    }

    // if there is something to awake to, then awake
    if (this._sleepResolve) {
      this._sleepResolve();
      this._sleepResolve = null;
    }
  }

  setTimeout(callback: Function, ticks: number) {
    ticks = Math.max(1, Math.floor(ticks));
    this._callbacks.push({
      callback,
      tickToExecute: this._currentTick + ticks,
    });
    this.awake();
  }

  setInterval(callback: Function, ticks: number) {
    this.setTimeout(() => {
      callback();
      // schedule next call
      this.setInterval(callback, ticks);
    }, ticks);
  }

  async stop(clear: Boolean = true): Promise<void> {
    // remove callbacks that haven't been reached
    if (clear)
      this._callbacks.length = 0;

    // remove the keep alive
    if (this._keepAlive) {
      clearInterval(this._keepAlive);
      this._keepAlive = null
    }
    // remove helper for keep alive
    this._keepAliveLastTick = 0;

    // stop the loop
    if (this._stopResolve) {
      this._stopResolve();
      this._stopResolve = null
    }

    // wake up if needed, to stop the loop
    if (this._sleepResolve) {
      this._sleepResolve();
      this._sleepResolve = null;
    }

    await waitRealTime(1);
  }

  wait(ticks: number): Promise<void> {
    if (!Number.isInteger(ticks)) {
      console.log(`Warning: Calling metronome.wait with a non-integer will result in rounding. \n\t metronome.wait(${ticks}) will be rounded down to metronome.wait(${Math.floor(ticks)})`)
    }
    // use a named function to debug functions in _callbacks
    return new Promise((resolve) => this.setTimeout(function _wait() { resolve() }, ticks));
  }

  resetCurrentTime(): void {
    this._currentTick = 0;
  }

  debug(detail: boolean = false): void {
    console.log("Metronome Debug".green.bold);
    console.log("Keep-Alive:", this._keepAlive ? "running".green : "stopped".yellow)
    console.log("Tasks Scheduled:", this._callbacks.length)
    if (detail) {
      this._callbacks.forEach(x => console.log(`\tTask scheduled for tick ${x.tickToExecute}:`, x.callback.toString()))
    }
    console.log("Current Tick:", this.now())
  }

}

function waitRealTime(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const metronome = new Metronome();