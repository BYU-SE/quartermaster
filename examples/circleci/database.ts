import { Stage, FIFOQueue, Event, metronome, normal, exponential } from "../../src";
export class Database extends Stage {
  public concurrent: number = 0;
  public latencyA = 0.06;
  public latencyB = 1.06;

  public availability = 0.9995;
  public deadlockThreshold = 70;
  public deadlockAvailability = 0.7;

  constructor() {
    super();
    this.inQueue = new FIFOQueue(1, 300);
  }

  async workOn(event: Event): Promise<void> {
    this.concurrent++;
    const mean =
      30 + exponential(this.latencyA, this.latencyB, this.concurrent);
    const std = 5 + mean / 500;
    const latency = normal(mean, std);

    await metronome.wait(latency);

    if (this.concurrent >= this.deadlockThreshold) {
      if (Math.random() > this.deadlockAvailability) {
        this.concurrent--;
        throw "fail";
      }
    } else {
      if (Math.random() > this.availability) {
        this.concurrent--;
        throw "fail";
      }
    }
    this.concurrent--;
  }
}