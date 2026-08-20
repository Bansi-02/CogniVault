const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');
const Workspace = require('./models/Workspace');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const email = 'admin@cognivault.com';
  const password = 'Password123!';
  
  let user = await User.findOne({ email });
  if (!user) {
    const newWorkspace = new Workspace({
      name: "Acme Corp Workspace",
      subscription_tier: 'advanced'
    });
    await newWorkspace.save();

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name: 'Admin User',
      email: email,
      password: hashedPassword,
      isTemporaryPassword: false,
      role: 'admin',
      tier: 'advanced',
      workspace: newWorkspace._id,
      documentsUploaded: 0
    });
    await user.save();
    console.log('User created: admin@cognivault.com / Password123!');
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    console.log('User password reset: admin@cognivault.com / Password123!');
  }
  process.exit(0);
});
