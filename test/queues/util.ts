import { Queue, Event, Worker, metronome } from "../../src";

export function doSomeWork(time: number, event: Event, completion: KeyTime[]): (worker: Worker) => Promise<void> {
  return async (worker: Worker) => {
    await metronome.wait(time);
    completion.push({ key: event.key, time: metronome.now() });
    worker.free();
  }
}

type KeyTime = { key: string, time: number }
export async function testSequence(queue: Queue, events: KeyTime[], order: { key: string, time?: number }[]) {
  const completion: KeyTime[] = [];
  const promises: any[] = [];

  events.forEach(keyTime => {
    const e = new Event(keyTime.key);
    const finished = queue.enqueue(e).then(doSomeWork(keyTime.time, e, completion));
    promises.push(finished);
  });

  await Promise.all(promises);

  // verify order
  for (let i = 0; i < order.length; i++) {
    expect(completion[i].key).toBe(order[i].key);
    if (order[i].time)
      expect(completion[i].time).toBe(order[i].time as number);
  }
}