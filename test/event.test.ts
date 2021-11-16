import { Event } from "../src"

describe('correctly increments and resets the ID counter', () => {
    //todo: test that it starts at 0
    beforeEach(() => {
        new Event('test1')
        new Event('test2')
    })
    test('resets the event id counter', () => {
        expect(Event.getIDCounter()).toBe(2);
        Event.resetIDCounter();
        expect(Event.getIDCounter()).toBe(0);
    })
})