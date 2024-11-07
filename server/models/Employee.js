const mongoose = require('mongoose')
const EmployeeSchema = require('./schemas/Employee')

const EmployeeModel = mongoose.model('employees', EmployeeSchema)

module.exports = EmployeeModel
