import { Response, TimeStats, ResponseStats } from ".";

/**
 * An event goes through a stage. In web systems, it could be a web request.
 * Two events with the same key are identical, but could have originated from
 * two separate sources.
 * Each event has a unique id.
 * 
 * An event keeps track of time spent in various stages.
 */
export class Event {
  private static idCounter: number = 0;

  public stageTimes: TimeStats[] = [];
  public response: Response | null = null;
  public responseTime: ResponseStats = new ResponseStats();
  public readonly id: number;
  
  constructor(public key: string) { this.id = ++Event.idCounter; }

  addStageTime(t: TimeStats): void {
    this.stageTimes.push(t);
  }

  public static resetIDCounter(): void {
    this.idCounter = 0;
  }

}