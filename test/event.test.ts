import { Event } from "../src"

describe('Event', () => {
    test('id counter at 0 before event creation', () => {
        expect(Event.getIDCounter()).toBe(0);
    })
    test('increments the id counter', () => {
        new Event('test1');
        new Event('test2');
        expect(Event.getIDCounter()).toBe(2);
    })
    test('resets the event id counter', () => {
        Event.resetIDCounter();
        expect(Event.getIDCounter()).toBe(0);
    })
})