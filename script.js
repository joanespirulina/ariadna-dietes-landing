// script.js
// Gestiona la integració amb Stripe i els botons de compra.

// Introduïm la clau pública proporcionada pel client. És segur exposar aquesta clau en el front-end.
const stripePublishableKey = 'pk_live_51RqhSQKfjYCNB70MlatIdrp7cjwluORKq6WW1jUHcTuKePPtKHdEHQl57FCkOvkVZRxPBFAJQoN6SoOqR22dPlIl00O7mDze6j';

// Inicialitza Stripe
const stripe = Stripe(stripePublishableKey);

/**
 * Crea una sessió de compra a través de la funció de Netlify.
 * @param {string} product - 'plan', 'coach' o 'both'
 */
async function createCheckout(product) {
  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }
    const data = await response.json();
    const sessionId = data.id;
    // Redirigeix l'usuari a Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      alert(error.message);
    }
  } catch (err) {
    console.error('Error en crear la sessió de pagament:', err);
    alert('S\'ha produït un error en processar la teva comanda. Torna-ho a intentar.');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Botó principal de compra del pla de 35 €
  const btnPlan = document.getElementById('checkout-button');
  if (btnPlan) {
    btnPlan.addEventListener('click', function () {
      createCheckout('plan');
    });
  }
  // Botó de compra amb o sense upsell
  const btnCoach = document.getElementById('checkout-button-coach');
  if (btnCoach) {
    btnCoach.addEventListener('click', function () {
      const addCoach = document.getElementById('add-coach');
      if (addCoach && addCoach.checked) {
        // Compra amb l'upsell inclòs
        createCheckout('both');
      } else {
        // Compra del pla sense upsell (mateix que botó principal)
        createCheckout('plan');
      }
    });
  }
});