import {
  TimedDependency,
  simulation,
  eventSummary,
  Retry,
  Timeout,
  eventCompare
} from "../src";


/**
 * A variation on the timed example, where the dependency has a different 
 * success and fail latency distribtion. That is, failures take longer than
 * a large proportion of successes.
 * 
 * This also demonstrates the `eventCompare` method to examine the differences
 * between some current setup (with no techniques) and using the timeout and
 * retry technique.
 */

// Without retrying or timing out
const normal = new TimedDependency();
normal.availability = 0.995;
normal.mean = 40;
normal.std = 3;
normal.errorMean = 60;
normal.errorStd = 5;


// The dependency which has different success and fail distributions
const live = new TimedDependency();
live.availability = 0.995;
live.mean = 40;
live.std = 3;
live.errorMean = 60;
live.errorStd = 5;

const timeout = new Timeout(live);
// >99th percentile for success
// <2.5th percentile for failure
timeout.timeout = 50;

const retry = new Retry(timeout);
retry.attempts = 2;




simulation.keyspaceMean = 999;
simulation.keyspaceStd = 90;
simulation.eventsPer1000Ticks = 40;

work();
async function work() {
  const normalEvents = await simulation.run(normal, 20000);
  const aggressiveEvents = await simulation.run(retry, 20000);
  console.log("\nNormal:")
  eventSummary(normalEvents);

  console.log("\nWith Retry and Timeouts:");
  eventSummary(aggressiveEvents);

  eventCompare(normalEvents, aggressiveEvents);
}

