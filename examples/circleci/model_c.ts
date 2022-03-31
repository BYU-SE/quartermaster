/**
 * An exploration which demonstrates the queue growing and processing halting
 * after traffic exceeds 1900 events / 1000 ticks.
 * 
 * This exploration exists to prove the design of the Database and Build
 * Service appropriately mock the architecture and problems listed in the 
 * incident report.
 * 
 */

import { Retry, simulation,MathFunctions, SeededMath} from "../../src";
import { Database } from "./database"
import { BuildService } from "./build-service"
import { summarize } from "./util";

const db = new Database();
const service = new BuildService(db);
//retry.attempts = 1;

// scenario
simulation.keyspaceMean = 1000;
simulation.keyspaceStd = 200;
simulation.eventsPer1000Ticks = 4500;

async function work() {
  const events = await simulation.run(service, 50000);
  summarize(events, [service, db]);
}
work();