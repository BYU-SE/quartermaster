import { WrappedStage } from "./wrapped-stage";
import { Event } from "../";


/**
 * Retry a wrapped stage more than once.
 * 
 * `stage.attempts` should be >=2 for at least one retry.
 */
export class Retry extends WrappedStage {
  public attempts: number = 2;
  async workOn(event: Event): Promise<void> {
    let attempt: number = 1;
    while (attempt <= this.attempts) {
      try {
        await this.wrapped.accept(event);
        return;
      }
      catch {
        attempt++;
      }
    }
    throw "fail"
  }
}
