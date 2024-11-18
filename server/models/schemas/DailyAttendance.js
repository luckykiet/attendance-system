const mongoose = require('mongoose');
const WorkingHourSchema = require('./WorkingHour');
const Schema = mongoose.Schema;

const DailyAttendanceSchema = new Schema(
    {
        date: { type: Number, required: true }, // Date in YYYYMMDD
        workingHour: { type: WorkingHourSchema, required: true },
        registerId: { type: Schema.Types.ObjectId, required: true },
        employeeIds: { type: [Schema.Types.ObjectId], default: [], required: true }, // Array of employee IDs expected to work on this day
        checkIns: { type: [Schema.Types.ObjectId], default: [] },
        checkOuts: { type: [Schema.Types.ObjectId], default: [] },
        checkInsLate: { type: [Schema.Types.ObjectId], default: [] }, // Array of Attendance IDs who checked in late
        checkInsLateByEmployee: { type: [Schema.Types.ObjectId], default: [] }, // Array of Employee IDs who checked in late
        checkOutsEarly: { type: [Schema.Types.ObjectId], default: [] }, // Array of Attendance IDs who checked out early
        checkOutsEarlyByEmployee: { type: [Schema.Types.ObjectId], default: [] }, // Array of Employee IDs who checked out early
    },
    {
        timestamps: true,
    }
);

DailyAttendanceSchema.index({ date: 1, registerId: 1 }, { unique: true });

module.exports = DailyAttendanceSchema
