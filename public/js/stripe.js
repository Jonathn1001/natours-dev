/* eslint-disable */

import { showAlert } from './alerts.js';

const stripe = Stripe(
  'pk_test_51MZB5uKt6WDH0mQk7GCztriPycVvRdqfAaIlVtjBByoaWwU2u98ga67t2pNTSXI6uRkMaNGFgLPtih5ejCW2tlF0004jNahg4s'
);

export const bookTour = async (tourId) => {
  try {
    // 1. Get checkout session from server
    const response = await axios(
      `http://127.0.0.1:5000/api/v1/bookings/checkout-session/${tourId}`
    );

    console.log(response);

    await stripe.redirectToCheckout({
      sessionId: response.data.session.id,
    });

    // 2. Create checkout form + charge credit card
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};
