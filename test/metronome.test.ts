import { Event, metronome, simulation, Stage } from "../src";



describe('Metronome', () => {
  test('starts and stops', async () => {
    expect(metronome.now()).toBe(0);
    metronome.start();
    await metronome.stop(true);
    expect(metronome.now()).toBeGreaterThanOrEqual(0);
  })

  test('starts, waits, and stops', async () => {
    metronome.start();
    await metronome.wait(10);
    await metronome.stop(true);
    expect(metronome.now()).toBeGreaterThanOrEqual(10);
  })

  test('starts, waits, and stops multiple times without breaks', async () => {
    metronome.resetCurrentTime();
    expect(metronome.now()).toBe(0);

    metronome.start();
    await metronome.wait(10);
    await metronome.stop(true);
    expect(metronome.now()).toBeGreaterThanOrEqual(10);

    metronome.start();
    await metronome.wait(10);
    await metronome.stop(true);
    expect(metronome.now()).toBeGreaterThanOrEqual(20);
  });


  test('starts, waits, and stops multiple times with breaks', async () => {
    metronome.resetCurrentTime();
    expect(metronome.now()).toBe(0);

    metronome.start();
    await metronome.wait(10);
    await metronome.stop(true);
    expect(metronome.now()).toBeGreaterThanOrEqual(10);

    metronome.start();
    await metronome.wait(10);
    await metronome.stop(true);
    expect(metronome.now()).toBeGreaterThanOrEqual(20);
  })
})

