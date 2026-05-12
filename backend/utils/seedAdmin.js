const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@smartagri.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@smartagri.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin user seeded: admin@smartagri.com / admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = { seedAdmin };
