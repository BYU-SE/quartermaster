import { Stage } from "./stage";
import { Event, ResponsePayload } from "../";
import { MathFunctions } from "../util";
/**
 * A stage with a fixed availability
 */

export class AvailableDependency extends Stage {
  /**
   * @defaultvalue 0.7
   */
  public availability: number = 0.7;
  async workOn(event: Event): Promise<ResponsePayload> {
    const available = MathFunctions.random() < this.availability;
    if (available)
      return;
    return Promise.reject("fail");
  }
}
