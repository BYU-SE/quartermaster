import { WrappedStage } from "./wrapped-stage";
import { Event, metronome } from "../";
/**
 * Limit the amount of time to wait for a response from the wrapped stage.
 */
export class Timeout extends WrappedStage {

  /**
   * The time to wait before failing.
   * @defaultvalue 300
   */
  public timeout: number = 300;
  async workOn(event: Event): Promise<void> {
    const tookTooLong = metronome.wait(this.timeout).then(() => {
      throw "fail"
    });
    await Promise.race([tookTooLong, this.wrapped.accept(event)]);
  }
}
