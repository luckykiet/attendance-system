const { describe, it, expect } = require('@jest/globals');
const { isBreakWithinShift, getStartEndTime } = require("../../utils");
const dayjs = require('dayjs');

dayjs.extend(require('dayjs/plugin/customParseFormat'));

describe('isBreakWithinShift', () => {
    const testCases = [
        {
            shift: ['00:00', '23:59'],
            breaks: [
                ['00:00', '23:59', true],       // full overlap
                ['08:00', '23:59', true],       // partial overlap
                ['09:00', '12:00', true],       // inside
                ['08:00', '00:00', true],       // overnight ending at 00:00 next day
                ['23:59', '00:00', false],      // starts at end, ends at start — no real overlap
                ['23:58', '00:01', true],       // overlaps last and first minute
                ['00:00', '00:00', false],      // empty break
                ['01:00', '01:00', false],      // empty break
                ['02:00', '02:00', false],      // empty break
            ],
        },
        {
            shift: ['08:00', '10:00'],
            breaks: [
                ['02:00', '10:00', true],       // overlap ends at 10:00
                ['00:00', '23:59', true],       // spans entire shift
                ['08:00', '23:59', true],       // starts at shift start
                ['07:00', '07:59', false],      // ends before shift starts
                ['00:00', '07:59', false],      // completely before
                ['07:00', '08:00', false],      // ends exactly at shift start = not overlapping
                ['07:59', '08:01', true],       // 1 min overlap
                ['10:00', '11:00', false],      // after shift
                ['00:00', '00:00', false],      // empty break
            ],
        },
        {
            shift: ['08:00', '07:00'], // overnight shift
            breaks: [
                ['02:00', '10:00', true],       // inside overnight
                ['00:00', '23:59', true],       // spans all
                ['08:00', '23:59', true],       // starts at shift start
                ['08:00', '07:00', true],       // exact match
                ['07:00', '08:00', false],      // non-overlapping
                ['06:59', '08:01', true],       // edges around overnight range
                ['07:00', '07:01', false],      // starts at shift end
                ['07:59', '08:01', true],       // starts before, ends inside
                ['00:00', '00:00', false],      // empty break
                ['01:00', '01:00', false],      // empty break
                ['02:00', '02:00', false],      // empty break
            ],
        },
        {
            shift: ['22:00', '02:00'], // overnight shift
            breaks: [
                ['21:00', '22:00', false],      // ends exactly at shift start
                ['22:00', '23:00', true],       // starts with shift
                ['01:00', '03:00', true],       // ends after shift ends
                ['23:59', '00:30', true],       // inside shift
                ['00:00', '02:00', true],       // second half of overnight shift
                ['23:00', '01:00', true],       // perfect inside
                ['02:00', '03:00', false],      // starts exactly at shift end
                ['00:00', '00:00', false],      // empty break
                ['02:00', '22:00', false],      // inverted around
                ['21:59', '02:01', true],       // 1 minute outside on both sides
            ],
        },
        {
            shift: ['23:30', '01:30'], // tight overnight shift
            breaks: [
                ['23:29', '23:30', false],  // ends at shift start
                ['23:30', '23:45', true],   // starts with shift
                ['01:00', '01:30', true],   // ends with shift
                ['01:30', '01:31', false],  // starts at shift end
                ['23:00', '02:00', true],   // big overlap
                ['23:59', '00:01', true],   // tiny overlap in middle
                ['00:00', '01:00', true],   // second part of shift
                ['00:00', '00:00', false],  // empty break
                ['25:00', '02:00', false],  // invalid time
                ['23:30', '25:00', false],  // invalid time
                ['random', '01:00', false], // invalid format
                ['01:00', '01:00', false],  // exact same time (empty)
                ['01:29', '01:31', true],   // overlaps end
            ],
        }
    ];

    testCases.forEach(({ shift, breaks }, i) => {
        const shiftStart = shift[0];
        const shiftEnd = shift[1];
        describe(`Test Case Group ${i + 1} (Shift: ${shiftStart} - ${shiftEnd})`, () => {
            breaks.forEach(([breakStart, breakEnd, expected]) => {
                it(`Break ${breakStart} - ${breakEnd} should return ${expected}`, () => {
                    const result = isBreakWithinShift({
                        breakStart,
                        breakEnd,
                        shiftStart,
                        shiftEnd,
                    });
                    expect(result).toBe(expected);
                });
            });
        });
    });
});

describe('getStartEndTime', () => {
    const baseDay = dayjs('16/04/2025', 'DD/MM/YYYY', true);

    it('should return null for invalid time format', () => {
        expect(getStartEndTime({ start: 'invalid', end: 'invalid' })).toBeNull();
    });

    it('should return null for out-of-range time (24:00)', () => {
        expect(getStartEndTime({ start: '24:00', end: '24:00' })).toBeNull();
    });

    it('should return null for out-of-range time (08:00-24:00)', () => {
        expect(getStartEndTime({ start: '08:00', end: '24:00', baseDay })).toBeNull();
    });

    it('should return null for out-of-range time (24:00-20:00)', () => {
        expect(getStartEndTime({ start: '24:00', end: '20:00', baseDay })).toBeNull();
    });

    it('should return correct start/end for same-day range', () => {
        const result = getStartEndTime({ start: '08:00', end: '16:00', baseDay });
        const { startTime, endTime, isOverNight } = result;
        expect(startTime.format()).toBe(baseDay.hour(8).minute(0).second(0).millisecond(0).format());
        expect(endTime.format()).toBe(baseDay.hour(16).minute(0).second(0).millisecond(0).format());
        expect(isOverNight).toBe(false);
    });

    it('should return correct start/end for same-day range for same time', () => {
        const result = getStartEndTime({ start: '23:58', end: '23:58', baseDay });
        expect(result).toBeNull();
    });

    it('should return correct start/end for same-day range for same time yesterday', () => {
        const result = getStartEndTime({ start: '23:58', end: '23:58', baseDay, isToday: false });
        expect(result).toBeNull();
    });

    it('should return correct start/end for overnight', () => {
        const result = getStartEndTime({ start: '08:00', end: '07:00', baseDay });
        const { startTime, endTime, isOverNight } = result;
        expect(startTime.format()).toBe(baseDay.hour(8).minute(0).second(0).millisecond(0).format());
        expect(endTime.format()).toBe(baseDay.add(1, 'day').hour(7).minute(0).second(0).millisecond(0).format());
        expect(isOverNight).toBe(true);
    });

    it('should return correct start/end for same-day range in past', () => {
        const baseDay = dayjs('12/04/2024', 'DD/MM/YYYY', true)
        const result = getStartEndTime({ start: '08:00', end: '16:00', baseDay });
        const { startTime, endTime, isOverNight } = result;
        expect(startTime.format()).toBe(baseDay.hour(8).minute(0).second(0).millisecond(0).format());
        expect(endTime.format()).toBe(baseDay.hour(16).minute(0).second(0).millisecond(0).format());
        expect(isOverNight).toBe(false);
    });

    it('should return null for same time in past', () => {
        const baseDay = dayjs('12/04/2024', 'DD/MM/YYYY', true)
        const result = getStartEndTime({ start: '23:58', end: '23:58', baseDay });
        expect(result).toBeNull();
    });

    it('should return correct start/end for same-day range for same time yesterday in past', () => {
        const baseDay = dayjs('12/04/2024', 'DD/MM/YYYY', true)
        const result = getStartEndTime({ start: '23:58', end: '23:58', baseDay, isToday: false });
        expect(result).toBeNull();
    });

    it('should return correct start/end for overnight in past', () => {
        const baseDay = dayjs('12/04/2024', 'DD/MM/YYYY', true)
        const result = getStartEndTime({ start: '08:00', end: '07:00', baseDay });
        const { startTime, endTime, isOverNight } = result;
        expect(startTime.format()).toBe(baseDay.hour(8).minute(0).second(0).millisecond(0).format());
        expect(endTime.format()).toBe(baseDay.add(1, 'day').hour(7).minute(0).second(0).millisecond(0).format());
        expect(isOverNight).toBe(true);
    });


    it('should detect overnight range correctly (22:00 to 06:00)', () => {
        const result = getStartEndTime({ start: '22:00', end: '06:00', baseDay });
        expect(result.startTime.format()).toBe(baseDay.hour(22).minute(0).format());
        expect(result.endTime.format()).toBe(baseDay.add(1, 'day').hour(6).minute(0).format());
        expect(result.isOverNight).toBe(true);
    });

    it('should detect overnight range correctly (22:00 to 06:00) for base day in past', () => {
        const baseDay = dayjs('20/04/2024', 'DD/MM/YYYY', true);
        const result = getStartEndTime({ start: '22:00', end: '06:00', baseDay });
        expect(result.startTime.format()).toBe(baseDay.hour(22).minute(0).format());
        expect(result.endTime.format()).toBe(baseDay.add(1, 'day').hour(6).minute(0).format());
        expect(result.isOverNight).toBe(true);
    });

    it('should apply isToday: false correctly', () => {
        const result = getStartEndTime({ start: '08:30', end: '10:00', baseDay, isToday: false });
        const expectedBase = baseDay.subtract(1, 'day');
        expect(result.startTime.format()).toBe(expectedBase.hour(8).minute(30).format());
        expect(result.endTime.format()).toBe(expectedBase.hour(10).minute(0).format());
        expect(result.isOverNight).toBe(false);
    });

    it('should detect overnight with isToday: false correctly', () => {
        const result = getStartEndTime({ start: '23:00', end: '01:00', baseDay, isToday: false });
        const expectedStart = baseDay.subtract(1, 'day').hour(23).minute(0);
        const expectedEnd = baseDay.hour(1).minute(0);
        expect(result.startTime.format()).toBe(expectedStart.format());
        expect(result.endTime.format()).toBe(expectedEnd.format());
        expect(result.isOverNight).toBe(true);
    });

    it('should return null when input times match', () => {
        const result = getStartEndTime({ start: '08:00', end: '08:00', baseDay });
        expect(result).toBeNull();
    });

    it('should handle shortest valid time range (00:00 to 00:01)', () => {
        const result = getStartEndTime({ start: '00:00', end: '00:01', baseDay });
        expect(result.startTime.format()).toBe(baseDay.hour(0).minute(0).format());
        expect(result.endTime.format()).toBe(baseDay.hour(0).minute(1).format());
        expect(result.isOverNight).toBe(false);
    });

    it('should handle longest possible same-day range (00:00 to 23:59)', () => {
        const result = getStartEndTime({ start: '00:00', end: '23:59', baseDay });
        expect(result.startTime.format()).toBe(baseDay.hour(0).minute(0).format());
        expect(result.endTime.format()).toBe(baseDay.hour(23).minute(59).format());
        expect(result.isOverNight).toBe(false);
    });

    it('should return null for 00:00 to 00:00)', () => {
        const result = getStartEndTime({ start: '00:00', end: '00:00', baseDay });
        expect(result).toBeNull();
    });

    it('should handle longest valid overnight range (00:01 to 00:00)', () => {
        const result = getStartEndTime({ start: '00:01', end: '00:00', baseDay });
        expect(result.isOverNight).toBe(true);
        expect(result.startTime.format()).toBe(baseDay.hour(0).minute(1).format());
        expect(result.endTime.format()).toBe(baseDay.add(1, 'day').hour(0).minute(0).format());
    });

    it('should handle 1-minute overnight (23:59 to 00:00)', () => {
        const result = getStartEndTime({ start: '23:59', end: '00:00', baseDay });
        expect(result.isOverNight).toBe(true);
        expect(result.startTime.format()).toBe(baseDay.hour(23).minute(59).format());
        expect(result.endTime.format()).toBe(baseDay.add(1, 'day').hour(0).minute(0).format());
    });

    it('should support custom time format (HH:mm:ss)', () => {
        const result = getStartEndTime({
            start: '08:00:00',
            end: '10:00:00',
            baseDay,
            timeFormat: 'HH:mm:ss'
        });

        expect(result.startTime.format('HH:mm:ss')).toBe('08:00:00');
        expect(result.endTime.format('HH:mm:ss')).toBe('10:00:00');
        expect(result.isOverNight).toBe(false);
    });
});