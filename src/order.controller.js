
const prisma = require('./db');

async function purchaseItem(req, res) {
  try {
    const userId = Number(req.body.userId);
    const productId = Number(req.body.productId);

    // Validate input
    if (
      !Number.isInteger(userId) || userId <= 0 ||
      !Number.isInteger(productId) || productId <= 0
    ) {
      return res.status(400).json({
        error: 'Valid userId and productId are required'
      });
    }

    // Check whether the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check available inventory
    if (product.stock < 1) {
      return res.status(400).json({
        error: 'Insufficient stock'
      });
    }

    // Check whether the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Perform both database operations atomically
    const order = await prisma.$transaction(async (tx) => {

      // Decrease stock only if stock is still available
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: productId,
          stock: { gte: 1 }
        },
        data: {
          stock: { decrement: 1 }
        }
      });

      if (stockUpdate.count === 0) {
        throw new Error('Insufficient stock');
      }

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          productId,
          quantity: 1
        }
      });

      return newOrder;
    });

    return res.status(201).json({ order });

  } catch (err) {
    if (err.message === 'Insufficient stock') {
      return res.status(400).json({
        error: err.message
      });
    }

    return res.status(500).json({
      error: err.message
    });
  }
}

async function getOrdersByUser(req, res) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const orders = await prisma.order.findMany({
      where: { userId }
    });

    return res.status(200).json(orders);

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}

module.exports = { purchaseItem, getOrdersByUser };
