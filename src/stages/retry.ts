import { WrappedStage } from "./wrapped-stage";
import { Event } from "../";
import { ResponsePayload } from "../response";


/**
 * Retry a wrapped stage more than once.
 * 
 * `stage.attempts` should be >=2 for at least one retry.
 */
export class Retry extends WrappedStage {

  /**
   * The number of attempts to call the wrapped stage.
   * @defaultvalue 2
   */
  public attempts: number = 2;
  async workOn(event: Event): Promise<ResponsePayload> {
    let attempt: number = 1;
    while (attempt <= this.attempts) {
      try {
        const payload = await this.wrapped.accept(event);
        return payload;
      }
      catch {
        attempt++;
      }
    }
    throw "fail"
  }
}
