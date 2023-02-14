/* eslint-disable */
// import 'node_modules/@babel/polyfill';
import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';
import { forgotPassword } from './forgotPassword.js';
import { resetPassword } from './resetPassword.js';
import { signup } from './signup.js';
import { updateSettings } from './updateSettings.js';
import { bookTour } from './stripe.js';
import { showAlert } from './alerts.js';

//  DOM element
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--sign-up');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form--user-data');
const userPasswordForm = document.querySelector('.form--user-password');
const bookingTourBtn = document.getElementById('book-tour');
const forgotPasswordForm = document.querySelector('.form--forgot-password');
const resetPasswordForm = document.querySelector('.form--reset-password');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    await signup(name, email, password, confirmPassword);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('uploadPhoto').files[0];

    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);

    await updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').innerHTML = 'Updating...';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    await updateSettings(
      { currentPassword, password, confirmPassword },
      'password'
    );

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    document.querySelector('.btn--save-password').innerHTML = 'Save password';
  });

if (bookingTourBtn) {
  bookingTourBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
  });
}

if (forgotPasswordForm)
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    await forgotPassword(email);
  });

if (resetPasswordForm)
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const token = window.location.pathname.split('/')[2];
    await resetPassword(password, confirmPassword, token);
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 10);
