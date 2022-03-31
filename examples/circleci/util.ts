import { Event, metronome, stats, eventSummary, stageSummary, Stage } from "../../src";
import { BuildService } from "./build-service";

export function summarize(events:Event[], stages:Stage[]) {
  eventSummary(events);
  stageSummary(stages);

  const accepted = events.filter(x => x.response?.responseType === "success")
  const rejected = events.filter(x => x.response?.responseType != "success")

  const queueTimeCounter = (acc: number, curr: Event) => {
    const stage = curr.stageTimes.find(x => x.stage == 'BuildService');
    return acc + (stage?.queueTime || 0);
  };

  const service = stages.find(x => x instanceof BuildService)!;
  const meanQueueTime = service.time.queueTime / events.length;
  const meanQueueTimeSuccess = accepted.reduce(queueTimeCounter, 0) / accepted.length || 0; // or'd with 0 to prevent NaN from divide by 0
  const meanQueueTimeFailed = rejected.reduce(queueTimeCounter, 0) / rejected.length || 0; // or'd with 0 to prevent NaN from divide by 0
  stats.max('mean-time-in-queue', meanQueueTime);
  stats.max('mean-time-in-queue-success', meanQueueTimeSuccess); 
  stats.max('mean-time-in-queue-failed', meanQueueTimeFailed); 

  stats.max('throughput', events.length / metronome.now());
  stats.max('recovery-time', metronome.now());

  stats.summary();
}