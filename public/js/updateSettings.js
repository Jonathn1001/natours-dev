/* eslint-disable */
import { showAlert } from './alerts.js';

// Type is either 'password' or 'data'
export const updateSettings = async (data, type = 'data') => {
  try {
    const endpoint = type === 'password' ? 'update-password' : 'update-me';
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${endpoint}`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
