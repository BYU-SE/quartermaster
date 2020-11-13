import { Stage } from "..";

/**
 * Stats used to report time spent by events in the queue and working
 */
export class TimeStats {
  public queueTime: number = 0;
  public workTime: number = 0;
  public stage: string = "";
  constructor() { }
  // public totalTime ? (this also includes add(), success(), fail())

  static fromStage(stage: Stage): TimeStats {
    const t = new TimeStats();
    t.stage = stage.constructor.name;
    return t;
  }
}