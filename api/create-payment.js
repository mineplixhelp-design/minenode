const midtransClient = require('midtrans-client');

module.exports = async (req, res) => {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { username, packageId, amount, itemTitle } = req.body;

    if (!username || !amount) {
      return res.status(400).json({ success: false, message: 'Username dan Amount wajib diisi!' });
    }

    // Inisialisasi Midtrans Snap Client
    const snap = new midtransClient.Snap({
      isProduction: false, // Ubah ke true jika sudah live production
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number(amount),
      },
      customer_details: {
        first_name: username,
      },
      item_details: [
        {
          id: packageId || 'DEFAULT-ITEM',
          price: Number(amount),
          quantity: 1,
          name: itemTitle || 'Rank Minecraft',
        },
      ],
    };

    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: orderId,
    });
  } catch (err) {
    console.error('Error Create Payment:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
