import { Stage, Event, metronome } from "../../src";


/**
 * A utility stage to replay a predetermined sequence of success or failure.
 */
export class ReplayDependency extends Stage {
  /**
   * The amount of time to wait for each response
   */
  public latency: number = 0;

  /**
   * The sequence of success or failure to respond with.
   */
  public replay: boolean[] = []

  /**
   * The current index in the replay
   */
  private index: number = -1;
  async workOn(event: Event): Promise<void> {
    await metronome.wait(this.latency);
    this.index++;
    if (this.replay[this.index])
      return Promise.resolve();
    else
      throw "fail"
  }
}
