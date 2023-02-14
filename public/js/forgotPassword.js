/* eslint-disable */
import { showAlert } from './alerts.js';

export const forgotPassword = async (email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgot-password',
      data: {
        email,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Please check your email to reset password!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
