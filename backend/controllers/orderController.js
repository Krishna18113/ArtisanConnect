const { Product, DirectOrder, ArtisanUser } = require('../models/model');
const mongoose = require('mongoose');

exports.createDirectOrder = async (req, res) => {
  const { productId, quantity } = req.body;
  const { id: userId } = req.user;
  const orderQuantity = Number(quantity);

  if (!productId || !Number.isFinite(orderQuantity) || orderQuantity <= 0) {
    return res.status(400).json({ msg: 'Missing required fields for creating an order.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error('Product not found');
    if (orderQuantity < product.minOrderQty) {
      const error = new Error(`Minimum order quantity is ${product.minOrderQty} ${product.unit}.`);
      error.statusCode = 400;
      throw error;
    }
    if (product.availableQty < orderQuantity) {
      const error = new Error(`Only ${product.availableQty} ${product.unit} available.`);
      error.statusCode = 400;
      throw error;
    }

    const newDirectOrder = new DirectOrder({
      productId,
      quantity: orderQuantity,
      buyer: userId,
      deliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default delivery 7 days from now
    });
    await newDirectOrder.save({ session });
    
    await session.commitTransaction();
    res.status(201).json(newDirectOrder);
  } catch (err) {
    await session.abortTransaction();
    res.status(err.statusCode || 500).json({ msg: err.message });
  } finally {
    session.endSession();
  }
};

exports.getMyDirectOrders = async (req, res) => {
  try {
    const orders = await DirectOrder.find({ buyer: req.user.id })
      .populate({ path: 'productId', populate: { path: 'artisan', select: 'name' } })
      .populate('buyer', 'name');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getArtisanDirectOrders = async (req, res) => {
  try {
    const products = await Product.find({ artisan: req.user.id }).select('_id');
    const productIds = products.map(p => p._id);
    const orders = await DirectOrder.find({ productId: { $in: productIds } })
      .populate('productId', 'name unit')
      .populate('buyer', 'name address');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Artisan approves an order: set artisanLocation (from artisan's address.coords) and mark approved
exports.approveDirectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await DirectOrder.findById(orderId).populate('productId');
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // verify artisan owns the product
    if (!order.productId) return res.status(404).json({ msg: 'Product associated with this order not found' });
    const product = await Product.findById(order.productId._id).select('artisan');
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.artisan.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const artisan = await ArtisanUser.findById(req.user.id).select('address');
    const coords = artisan?.address?.coords;
    if (!coords) return res.status(400).json({ msg: 'Artisan location not set. Please set your location first.' });

    order.artisanLocation = { lat: coords.lat, lng: coords.lng };
    order.artisanApproved = true;
    order.status = 'approved';
    await order.save();
    res.json({ msg: 'Order approved', order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Artisan rejects an order
exports.rejectDirectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await DirectOrder.findById(orderId).populate('productId');
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    const product = await Product.findById(order.productId._id).select('artisan');
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.artisan.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    order.status = 'rejected';
    order.artisanApproved = false;
    await order.save();
    res.json({ msg: 'Order rejected', order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.markOrderAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await DirectOrder.findById(orderId).populate('productId');
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Verify artisan owns the product associated with the order
    if (!order.productId) {
      return res.status(404).json({ msg: 'Product not found for this order.' });
    }
    if (order.productId.artisan.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: You do not own this product.' });
    }

    // Only mark as delivered if the status is 'approved'
    if (order.status !== 'approved') {
      return res.status(400).json({ msg: 'Order must be in "approved" status to be marked as delivered.' });
    }

    // Update order status to 'delivered' and set the delivered date
    order.status = 'delivered';
    order.deliveryDate = new Date(); // Set current date and time as delivered date
    await order.save();

    // Calculate order total and update artisan revenue
    const orderTotal = order.quantity * (order.productId?.pricePerKg || 0);

    await ArtisanUser.findByIdAndUpdate(req.user.id, { $inc: { revenue: orderTotal } });

    res.json({ msg: 'Order marked as delivered and revenue updated.', order });

  } catch (err) {
    console.error('Error marking order as delivered:', err);
    res.status(500).json({ msg: err.message });
  }
};

// Provide order summary used by buyer tracking UI (includes artisan coords if approved)
exports.getOrderSummary = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await DirectOrder.findById(orderId).populate({ path: 'productId', populate: { path: 'artisan', select: 'name address' } });
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    res.json({
      orderId: order._id,
      status: order.status,
      artisanLocation: order.artisanLocation || order.productId.artisan.address?.coords || null,
      product: { id: order.productId._id, name: order.productId.name }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await DirectOrder.findById(orderId).populate('productId', 'name');
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    const events = [{ status: 'Order Placed', timestamp: order.createdAt }];
    if (order.status === 'completed') {
      events.push({ status: 'Order Confirmed & Processing', timestamp: new Date() });
    } else if (order.status === 'delivered') {
      events.push({ status: 'Order Confirmed & Processing', timestamp: new Date(order.updatedAt - 86400000) });
      events.push({ status: 'Delivered', timestamp: order.deliveryDate });
    }

    const trackingInfo = {
      orderId: order._id,
      productName: order.productId.name,
      status: order.status,
      estimatedDelivery: order.deliveryDate,
      events: events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    };
    res.json(trackingInfo);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancellationMessage } = req.body;
    const userId = req.user.id;

    const order = await DirectOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    // Ensure the user cancelling is the buyer
    if (order.buyer.toString() !== userId) {
      return res.status(403).json({ msg: 'You are not authorized to cancel this order.' });
    }

    // Check if the order is already cancelled, completed, or delivered
    if (['cancelled', 'completed', 'delivered', 'rejected'].includes(order.status)) {
      return res.status(400).json({ msg: `Order cannot be cancelled as it is already ${order.status}.` });
    }

    // Allow cancellation if status is 'open' or 'approved'
    if (order.status === 'open' || order.status === 'approved') {
      order.status = 'cancelled';
      order.cancellationMessage = cancellationMessage || 'Cancelled by buyer.';
      await order.save();
      return res.status(200).json({ msg: 'Order cancelled successfully.', order });
    } else {
      return res.status(400).json({ msg: 'Order cannot be cancelled in its current status.' });
    }
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ msg: err.message });
  }
};
