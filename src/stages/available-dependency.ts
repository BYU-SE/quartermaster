import { Stage } from "./stage";
import { Event } from "../";
/**
 * A stage with a fixed availability
 */

export class AvailableDependency extends Stage {
  public availability: number = 0.7;
  async workOn(event: Event): Promise<void> {
    const available = Math.random() < this.availability;
    if (available)
      return;
    return Promise.reject("fail");
  }
}
