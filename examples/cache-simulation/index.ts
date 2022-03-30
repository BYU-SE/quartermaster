
import {eventSummary, simulation, stageSummary, metronome, stats, LRUCache, AvailableDependency} from "../../src";
import {ApiStage} from "./api-stage";


const database = new AvailableDependency();
database.availability = 0.995;

const cache = new LRUCache(database);
cache.ttl = 30000;
cache.capacity = 500

const api = new ApiStage(cache);

simulation.keyspaceMean = 1000;
simulation.keyspaceStd = 100;
simulation.eventsPer1000Ticks = 100;


const period = 2 * Math.PI / 60_000; // 60 seconds
const amplitude = 0.5;
const average = 0.5;

work();
async function work() {
    metronome.setInterval(() => {
        database.availability = average + amplitude * Math.sin(period * metronome.now());
        stats.record("db.avail", database.availability );
    }, 2_000);

    const events = await simulation.run(api, 2_000); // 200ish seconds of execution time
    eventSummary(events);
    stageSummary([api, cache, database])
}
