import { TimedDependency, stageSummary, simulation, eventSummary, LIFOQueue } from "../src";


/**
 * A variation on the timed example, using a dependency that has a queue
 * and is overcapacity.
 * 
 * eps = events per 1000 ticks, which is comparable to rps, requests per
 * second.
 * 
 * The rate of events (40 eps), is faster than the expected eps of the
 * dependency (4 workers * 1000 / 150 = ~27 eps). Thus, the dependency
 * should reject around 33% of traffic since it cannot fulfill that much.
 * The exact percent of rejected requests is depends on queue length (> 1
 * results in a small buffer), the actual distribution of response times,
 * etc.
 */

const live = new TimedDependency();
live.inQueue = new LIFOQueue(10, 4);
live.availability = 1;
live.mean = 150;
live.std = 20;

simulation.keyspaceMean = 999;
simulation.keyspaceStd = 90;
simulation.eventsPer1000Ticks = 40;

work();
async function work() {
  const events = await simulation.run(live, 200);
  eventSummary(events);
  stageSummary([live])
}


