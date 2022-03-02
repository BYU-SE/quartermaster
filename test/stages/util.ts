import { Stage, Event, Response, metronome, ResponsePayload } from "../../src";


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
  public replay: Response[] = []

  /**
   * The current index in the replay
   */
  private index: number = -1;
  async workOn(event: Event): Promise<ResponsePayload> {
    await metronome.wait(this.latency);
    this.index++;
    if (this.replay[this.index].responseType == "success") {
      return this.replay[this.index].responsePayload;
    }
    else {
      throw this.replay[this.index].responsePayload;
    }
  }

  public createReplays(replays: Boolean[], successPayload: string = "success", failPayload: string = "fail"): void {
    this.index = -1;
    this.replay = replays.map(element => { 
      if (element) { 
        return {responseType: "success", responsePayload: successPayload};
      }
      else {
        return {responseType: "fail", responsePayload: failPayload};
      }
    });
  }
}
