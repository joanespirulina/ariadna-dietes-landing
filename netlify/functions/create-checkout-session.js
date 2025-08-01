/*
 * Netlify Function per crear una sessió de Stripe Checkout.
 * Aquesta funció utilitza l'API HTTP de Stripe per crear una sessió sense dependències externes.
 */

const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const product = body.product;
    // Configuració de les línies d'article en funció del producte seleccionat
    const lineItems = [];
    if (product === 'plan' || product === 'both') {
      lineItems.push({ price: process.env.STRIPE_DIETA_PRODUCT_ID, quantity: 1 });
    }
    if (product === 'coach' || product === 'both') {
      lineItems.push({ price: process.env.STRIPE_COACH_PRODUCT_ID, quantity: 1 });
    }
    if (lineItems.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cap producte seleccionat.' }) };
    }
    // Prepara dades del formulari x-www-form-urlencoded
    const params = new URLSearchParams();
    lineItems.forEach((item, idx) => {
      params.append(`line_items[${idx}][price]`, item.price);
      params.append(`line_items[${idx}][quantity]`, item.quantity);
    });
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    // Utilitza les URL de redirecció configurades a les variables d'entorn
    const successUrl = process.env.SUCCESS_URL || `${process.env.SITE_URL || ''}/success.html`;
    const cancelUrl = process.env.CANCEL_URL || `${process.env.SITE_URL || ''}/cancel.html`;
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);

    const options = {
      hostname: 'api.stripe.com',
      path: '/v1/checkout/sessions',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    const session = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      });
      req.on('error', (err) => reject(err));
      req.write(params.toString());
      req.end();
    });
    if (session.statusCode >= 200 && session.statusCode < 300) {
      const result = JSON.parse(session.body);
      return {
        statusCode: 200,
        body: JSON.stringify({ id: result.id }),
      };
    }
    // Si hi ha un error de Stripe, retornem el codi i cos d'error tal qual
    return { statusCode: session.statusCode, body: session.body };
  } catch (error) {
    console.error('Stripe error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};