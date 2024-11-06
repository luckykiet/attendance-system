const mongoose = require('mongoose')
const EmployeeSchema = require('./schema/Employee')

const EmployeeModel = mongoose.model('employees', EmployeeSchema)

module.exports = EmployeeModel
