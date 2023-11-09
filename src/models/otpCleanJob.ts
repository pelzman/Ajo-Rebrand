import * as cron from 'node-cron';
import Users from './users'; // Import your User model
import { Op } from 'sequelize';

// Schedule a job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    // Calculate the time threshold for deleting expired OTPs (e.g., 5 minutes ago)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Find and delete users with expired OTPs
    await Users.update({ otp: null }, {
      where: {
        otp: {
          [Op.ne]: null,
        },
        created_at: {
          [Op.lt]: fiveMinutesAgo,
        },
      },
    });
  } catch (error) {
    console.error('Error deleting users with expired OTPs:', error);
  }
});
