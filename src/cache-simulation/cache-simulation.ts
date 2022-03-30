
import {LRUCache, TimedDependency} from "../stages";
import {eventSummary, simulation, stageSummary} from "../framework";
import {metronome} from "../metronome";
import {stats} from "../stats";
import {CacheStage} from "./cache-stage";
import {DbStage} from "./db-stage";
import {ApiStage} from "./api-stage";


// const database = new TimedDependency();
let availability = 0.995;
// database.mean = 150;
// database.std = 20;
const database = new DbStage();

const cache = new CacheStage(database);
cache.ttl = 30000;
cache.capacity = 500

const api = new ApiStage(cache);

simulation.keyspaceMean = 999;
simulation.keyspaceStd = 90;
simulation.eventsPer1000Ticks = 40;


const period = 2 * Math.PI / 60_000; // 60 seconds
const amplitude = 0.5;
const average = 0.5;

work();
async function work() {
    metronome.setInterval(() => {
        availability = average + amplitude * Math.sin(period * metronome.now());
        stats.record("db.avail", availability);
    }, 2_000);

    const events = await simulation.run(api, 20000);

    eventSummary(events);
    stageSummary([api, cache, database])

}
