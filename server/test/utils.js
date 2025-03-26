const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;

const login = async (request) => {
    const user = new User({
        username: 'adminuser',
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpass', 10),
        name: 'Admin User',
        role: 'Admin',
        isAvailable: true,
        retailId: new ObjectId(),
    });
    await user.save();

    const login = await request.post('/auth/login').send({
        username: 'adminuser',
        password: Buffer.from('adminpass').toString('base64'),
    });
    return login.headers['set-cookie'];
}

module.exports = {
    login,
}