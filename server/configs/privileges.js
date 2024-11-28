const PRIVILEGES = {
    addEmployee: ['Admin', 'Manager'],
    addRegister: ['Admin'],
    assignEmployees: ['Admin'],
    createUser: ['Admin'],
    deleteEmployee: ['Admin'],
    deleteUser: ['Admin'],
    editEmployee: ['Admin', 'Manager'],
    editRegister: ['Admin'],
    editRetail: ['Admin'],
    employeeRegistration: ['Admin', 'Manager'],
    getEmployees: ['Admin', 'Manager'],
    getUsers: ['Admin'],
}

module.exports = { PRIVILEGES };