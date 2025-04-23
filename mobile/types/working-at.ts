import { Weekday } from "./day";
import { Shift } from "./shift";

export type MyWorkingAt = {
    _id: string;
    registerId: string;
    employeeId: string;
    position?: string;
    shifts: Record<Weekday, Shift[]>;
}