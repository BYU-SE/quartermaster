import { Stage, Event, metronome } from "../../src";

export class ReplayDependency extends Stage {
  public latency: number = 0;
  public replay: boolean[] = []
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
