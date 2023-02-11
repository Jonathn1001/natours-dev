/* eslint-disable */
import { showAlert } from './alerts.js';

export const signup = async (name, email, password, confirmPassword) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/sign-up',
      data: {
        name,
        email,
        password,
        confirmPassword,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Signed up successfully!!');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
