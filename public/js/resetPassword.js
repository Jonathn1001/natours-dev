/* eslint-disable */
import { showAlert } from './alerts.js';

export const resetPassword = async (password, confirmPassword, token) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/reset-password',
      data: {
        password,
        confirmPassword,
        token,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Your password was changed successfully!');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
