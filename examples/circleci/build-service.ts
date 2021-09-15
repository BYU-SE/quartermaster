import { Stage, FIFOServiceQueue, Event, metronome, normal, stats } from "../../src";

export class BuildService extends Stage {
  constructor(protected wrapped: Stage) {
    super();
    this.inQueue = new FIFOServiceQueue(Infinity, 220);
  }


  /**
   * Admission control before an event reaches the queue.
   * @param event The event that is seeking entry into the stage
   */
  protected async add(event: Event): Promise<void> {
    if (this.inQueue.isFull()) {
      stats.add('rejected-queue-events', 1);
      return Promise.reject("fail");
    }
  }

  async workOn(event: Event): Promise<void> {

    stats.max("max-queue-size", this.inQueue.length());
    // do some work
    const latency = normal(8, 2);
    await metronome.wait(latency);
    await this.wrapped.accept(event);
  }
}