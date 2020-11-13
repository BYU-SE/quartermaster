import { Response, TimeStats, ResponseStats } from ".";

/**
 * An event goes through a stage. In web systems, it could be a web request.
 * Two events with the same key are identical, but could have originated from
 * two separate sources.
 * 
 * An event keeps track of time spent in various stages.
 */
export class Event {
  public stageTimes: TimeStats[] = [];
  public response: Response | null = null;
  public responseTime: ResponseStats = new ResponseStats();
  constructor(public key: string) { }

  addStageTime(t: TimeStats): void {
    this.stageTimes.push(t);
  }

}