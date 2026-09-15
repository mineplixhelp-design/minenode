const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const callbackData = req.body;

  if (callbackData && callbackData.status === 'PAID') {
    const username = callbackData.customer_name;
    const item = callbackData.order_items[0];

    try {
      await axios.post(
        'https://api.craftingstore.net/v1/payments',
        {
          packageName: item.name,
          username: username,
          price: item.price,
          status: 'PAID'
        },
        {
          headers: {
            'token': process.env.CRAFTINGSTORE_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.status(200).json({ success: true, message: 'Payment sent to CraftingStore' });
    } catch (err) {
      console.error('CraftingStore Error:', err?.response?.data || err.message);
      return res.status(500).json({ success: false, message: 'Failed to notify CraftingStore' });
    }
  }

  return res.status(200).json({ success: true });
};
