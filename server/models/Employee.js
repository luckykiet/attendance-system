const mongoose = require('mongoose')
const EmployeeSchema = require('./schemas/Employee')

const Employee = mongoose.model('employees', EmployeeSchema)

module.exports = Employee
