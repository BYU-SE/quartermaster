import { Stage } from "./stage";
import { Event, normal, metronome, MathFunctions, ResponsePayload } from "../";


/**
 * A stage with a fixed availability and a normally distributed latency.
 * Probably could be refactored to extend AvailableStage
 */
export class TimedDependency extends Stage {
  /**
   * @defaultvalue 150
   */
  public mean: number = 150;

  /**
   * @defaultvalue 150
   */
  public errorMean: number = 150;

  /**
   * @defaultvalue 25
   */
  public std: number = 25;

  /**
   * @defaultvalue 25
   */
  public errorStd: number = 25;


  /**
   * @defaultvalue 0.9995
   */
  public availability = 0.9995;

  /**
   * @defaultvalue 0
   */
  private _concurrent: number = 0;
  async workOn(event: Event): Promise<ResponsePayload> {
    this._concurrent++;
    const available = MathFunctions.random() < this.availability;
    if (available) {
      const latency = normal(this.mean, this.std);
      await metronome.wait(latency);
      this._concurrent--;
      return;
    }

    const latency = normal(this.errorMean, this.errorStd);
    await metronome.wait(latency);
    this._concurrent--;
    return Promise.reject("fail");
  }

  public get concurrent(): number {
    return this._concurrent;
  }
}
