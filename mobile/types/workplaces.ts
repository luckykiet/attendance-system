import { Address } from "./address";
import { Weekday } from "./day";
import { MyEmployee } from "./employee";
import { MyRetail } from "./retail";
import { Shift } from "./shift";
import { MyWorkingAt } from "./working-at";
import { WorkingHour } from "./working-hour";

export type TodayWorkplace = {
    _id: string;
    name: string;
    address: Address;
    checkInTime: string;
    checkOutTime: string;
    shifts: Record<Weekday, Shift[]>;
    distanceInMeters: number | null;
    domain: string | null;
    location: {
        allowedRadius: number;
    }
}

export type MyWorkplace = {
    _id: string;
    name: string;
    workingHours: Record<Weekday, WorkingHour>;
    address: Address;
    retailId: string;
}

export type GetMyCompaniesResult = {
    registers: MyWorkplace[];
    workingAts: MyWorkingAt[];
    employees: MyEmployee[];
    retails: MyRetail[],
    domain: string;
};