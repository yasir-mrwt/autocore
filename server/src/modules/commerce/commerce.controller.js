const { getPrisma } = require("../../config/prisma");
const crypto = require("crypto");
const { formatCart, formatOrder, formatWishlistItem } = require("./commerce.formatters");
const { sendMail } = require("../../../Utils/mailer");
const { getStripeInstance } = require("../../../Utils/stripe");

const productInclude = {
  category: true,
  images: true,
  inventory: true,
};

const cartInclude = {
  product: {
    include: productInclude,
  },
};

const orderInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        include: productInclude,
      },
    },
  },
  payments: {
    orderBy: { createdAt: "desc" },
  },
  timeline: {
    orderBy: { createdAt: "asc" },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

const adminOrderInclude = {
  ...orderInclude,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
};

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );

const productIdentityWhere = (value) => ({
  OR: [
    ...(isUuid(value) ? [{ id: value }] : []),
    { slug: value },
    { sku: value },
    { partNumber: value },
  ],
});

const getAvailableStock = (inventory) =>
  Math.max(
    Number(inventory?.stockQuantity || 0) - Number(inventory?.reservedQuantity || 0),
    0
  );

const getUserCartItems = (prisma, userId) =>
  prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: cartInclude,
  });

const findActiveProduct = async (prisma, productId) =>
  prisma.product.findFirst({
    where: {
      status: "ACTIVE",
      ...productIdentityWhere(productId),
    },
    include: productInclude,
  });

const validateProductStock = (product, quantity) => {
  const availableStock = getAvailableStock(product.inventory);
  if (availableStock < quantity) {
    return `Only ${availableStock} item(s) available for ${product.name}.`;
  }

  return null;
};

const getCart = async (req, res, next) => {
  try {
    const items = await getUserCartItems(getPrisma(), req.user.id);
    return res.status(200).json({ cart: formatCart(items) });
  } catch (error) {
    return next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const quantity = Number(req.body.quantity || 1);
    const product = await findActiveProduct(prisma, req.body.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: product.id,
        },
      },
    });
    const nextQuantity = Number(existing?.quantity || 0) + quantity;
    const stockError = validateProductStock(product, nextQuantity);

    if (stockError) {
      return res.status(409).json({ message: stockError });
    }

    await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: product.id,
        },
      },
      update: { quantity: nextQuantity },
      create: {
        userId: req.user.id,
        productId: product.id,
        quantity,
      },
    });

    const items = await getUserCartItems(prisma, req.user.id);
    return res.status(existing ? 200 : 201).json({
      message: "Cart updated.",
      cart: formatCart(items),
    });
  } catch (error) {
    return next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const quantity = Number(req.body.quantity);
    const existing = await prisma.cartItem.findFirst({
      where: {
        id: req.params.itemId,
        userId: req.user.id,
      },
      include: cartInclude,
    });

    if (!existing) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    const stockError = validateProductStock(existing.product, quantity);
    if (stockError) {
      return res.status(409).json({ message: stockError });
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    const items = await getUserCartItems(prisma, req.user.id);
    return res.status(200).json({
      message: "Cart item updated.",
      cart: formatCart(items),
    });
  } catch (error) {
    return next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const value = req.params.itemId;
    const product = await findActiveProduct(prisma, value);
    const filters = [
      ...(isUuid(value) ? [{ id: value }] : []),
      ...(product ? [{ productId: product.id }] : []),
    ];

    if (filters.length) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: req.user.id,
          OR: filters,
        },
      });
    }

    const items = await getUserCartItems(prisma, req.user.id);
    return res.status(200).json({
      message: "Cart item removed.",
      cart: formatCart(items),
    });
  } catch (error) {
    return next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    return res.status(200).json({
      message: "Cart cleared.",
      cart: formatCart([]),
    });
  } catch (error) {
    return next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const items = await getPrisma().wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: cartInclude,
    });

    return res.status(200).json({
      wishlist: {
        items: items.map(formatWishlistItem),
        count: items.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const addWishlistItem = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const product = await findActiveProduct(prisma, req.body.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        productId: product.id,
      },
    });

    return getWishlist(req, res, next);
  } catch (error) {
    return next(error);
  }
};

const removeWishlistItem = async (req, res, next) => {
  try {
    const value = req.params.itemIdOrProductId;
    const prisma = getPrisma();
    const product = await findActiveProduct(prisma, value);
    const filters = [
      ...(isUuid(value) ? [{ id: value }] : []),
      ...(product ? [{ productId: product.id }] : []),
    ];

    if (!filters.length) {
      return getWishlist(req, res, next);
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user.id,
        OR: filters,
      },
    });

    return getWishlist(req, res, next);
  } catch (error) {
    return next(error);
  }
};

const createOrderNumber = () =>
  `AC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const calculateShippingFee = (subtotal) => (subtotal >= 7000 ? 0 : 350);

const getOrderIdentityFilters = (value) => [
  { orderNumber: value },
  ...(isUuid(value) ? [{ id: value }] : []),
];

const findOrderForUser = async (prisma, userId, orderId, include = undefined) => {
  const order = await prisma.order.findFirst({
    where: {
      OR: getOrderIdentityFilters(orderId),
    },
    include,
  });

  if (!order || order.userId !== userId) return null;
  return order;
};

const findOrderByIdentity = (prisma, orderId, include = undefined) =>
  prisma.order.findFirst({
    where: {
      OR: getOrderIdentityFilters(orderId),
    },
    include,
  });

const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const toStripeAmount = (amount) => Math.max(Math.round(Number(amount || 0) * 100), 0);

const getConfirmationSecret = () =>
  process.env.DELIVERY_CONFIRMATION_SECRET ||
  process.env.ACCESS_TOKEN_SECRET ||
  process.env.REFRESH_TOKEN_SECRET;

const base64UrlJson = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const createDeliveryConfirmationToken = (order) => {
  const secret = getConfirmationSecret();
  if (!secret) {
    throw new Error("DELIVERY_CONFIRMATION_SECRET or ACCESS_TOKEN_SECRET is required.");
  }

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };
  const encodedPayload = base64UrlJson(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

const verifyDeliveryConfirmationToken = (token) => {
  const secret = getConfirmationSecret();
  if (!secret) {
    throw new Error("DELIVERY_CONFIRMATION_SECRET or ACCESS_TOKEN_SECRET is required.");
  }

  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Invalid confirmation token.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid confirmation token.");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (!payload.orderId || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Expired confirmation token.");
  }

  return payload;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

const getEstimatedDeliveryAt = ({ estimatedDeliveryAt, deliveryDays, fallbackDays }) => {
  if (estimatedDeliveryAt) return new Date(estimatedDeliveryAt);
  const days = deliveryDays === undefined || deliveryDays === null ? fallbackDays : Number(deliveryDays);
  return days ? addDays(new Date(), days) : null;
};

const addOrderTimelineEvent = (tx, { orderId, adminId, status, label, message, metadata }) =>
  tx.orderStatusEvent.create({
    data: {
      orderId,
      adminId: adminId || null,
      status,
      label,
      message,
      metadata,
    },
  });

const createAdminAuditLog = (tx, { adminId, action, order, metadata }) =>
  tx.adminAuditLog.create({
    data: {
      adminId,
      action,
      entityType: "Order",
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        status: order.status,
        ...metadata,
      },
    },
  });

const getOrderUrl = () => `${getClientUrl()}/buyer/watch-list`;

const getConfirmationUrl = (order) =>
  `${getClientUrl()}/delivery-confirmation?token=${encodeURIComponent(
    createDeliveryConfirmationToken(order)
  )}`;

const buildDispatchEmail = (order) => ({
  subject: `Your AutoCore order ${order.orderNumber} is ready for dispatch`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
      <div style="padding:24px;border-bottom:1px solid #e2e8f0">
        <h1 style="margin:0;color:#1572D3">AutoCore</h1>
        <p style="margin:8px 0 0;color:#64748b">Dispatch update</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px">Your parcel is ready for dispatch</h2>
        <p style="line-height:1.6;color:#475569">Order <strong>${order.orderNumber}</strong> has been packed and is ready for courier pickup.</p>
        <p style="line-height:1.6;color:#475569">Estimated delivery: <strong>${order.estimatedDeliveryAt ? new Date(order.estimatedDeliveryAt).toLocaleDateString("en-PK") : "Not set yet"}</strong></p>
        <a href="${getOrderUrl()}" style="display:inline-block;background:#1572D3;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">View order</a>
      </div>
    </div>
  `,
  text: `AutoCore order ${order.orderNumber} is ready for dispatch. View it here: ${getOrderUrl()}`,
});

const buildShippedEmail = (order) => ({
  subject: `Your AutoCore order ${order.orderNumber} has shipped`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
      <div style="padding:24px;border-bottom:1px solid #e2e8f0">
        <h1 style="margin:0;color:#1572D3">AutoCore</h1>
        <p style="margin:8px 0 0;color:#64748b">Shipping update</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px">Your parcel has shipped</h2>
        <p style="line-height:1.6;color:#475569">Order <strong>${order.orderNumber}</strong> is now with ${order.courierName || "the courier"}.</p>
        <p style="line-height:1.6;color:#475569">Tracking number: <strong>${order.trackingNumber || "Not provided"}</strong></p>
        <p style="line-height:1.6;color:#475569">Estimated delivery: <strong>${order.estimatedDeliveryAt ? new Date(order.estimatedDeliveryAt).toLocaleDateString("en-PK") : "Not set"}</strong></p>
        <a href="${getOrderUrl()}" style="display:inline-block;background:#1572D3;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Track order</a>
      </div>
    </div>
  `,
  text: `AutoCore order ${order.orderNumber} has shipped with ${order.courierName || "the courier"}. Tracking: ${order.trackingNumber || "Not provided"}.`,
});

const buildDeliveryConfirmationEmail = (order) => ({
  subject: `Confirm delivery for ${order.orderNumber}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
      <div style="padding:24px;border-bottom:1px solid #e2e8f0">
        <h1 style="margin:0;color:#1572D3">AutoCore</h1>
        <p style="margin:8px 0 0;color:#64748b">Delivery confirmation</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px">Did your package arrive?</h2>
        <p style="line-height:1.6;color:#475569">
          Your order ${order.orderNumber} was shipped with ${order.courierName || "our courier partner"}.
          Please confirm receipt so we can close the delivery safely.
        </p>
        <p style="line-height:1.6;color:#475569">
          Tracking number: <strong>${order.trackingNumber || "Not provided"}</strong>
        </p>
        <a href="${getConfirmationUrl(order)}" style="display:inline-block;background:#1572D3;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
          Confirm Received
        </a>
      </div>
    </div>
  `,
  text: `AutoCore delivery confirmation for ${order.orderNumber}. Confirm receipt here: ${getConfirmationUrl(order)}`,
  ctaUrl: getConfirmationUrl(order),
});

const buildPaymentReceiptEmail = (order) => ({
  subject: `Payment received for ${order.orderNumber}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
      <div style="padding:24px;border-bottom:1px solid #e2e8f0">
        <h1 style="margin:0;color:#1572D3">AutoCore</h1>
        <p style="margin:8px 0 0;color:#64748b">Payment confirmation</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px">Your payment was received</h2>
        <p style="line-height:1.6;color:#475569">
          We received payment for order <strong>${order.orderNumber}</strong>.
          Our team will prepare your auto parts for dispatch.
        </p>
        <p style="line-height:1.6;color:#475569">
          Order total: <strong>${order.currency || "PKR"} ${Number(order.total || 0).toLocaleString()}</strong>
        </p>
        <a href="${getClientUrl()}/buyer/watch-list" style="display:inline-block;background:#1572D3;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
          View order
        </a>
      </div>
    </div>
  `,
  text: `AutoCore received payment for ${order.orderNumber}. Total ${order.currency || "PKR"} ${Number(order.total || 0).toLocaleString()}. View order: ${getClientUrl()}/buyer/watch-list`,
});

const sendPaymentReceiptSafely = async (order) => {
  const recipient = order?.user?.email;
  if (!recipient) return null;

  try {
    const email = buildPaymentReceiptEmail(order);
    return await sendMail({
      to: recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error(`Could not send payment email for ${order.orderNumber}:`, error.message);
    return null;
  }
};

const sendOrderEmailSafely = async (order, buildEmail, label) => {
  const recipient = order?.user?.email;
  if (!recipient) {
    return { sent: false, error: "Order customer email is missing." };
  }

  try {
    const email = buildEmail(order);
    const result = await sendMail({
      to: recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Could not send ${label} email for ${order.orderNumber}:`, error.message);
    return { sent: false, error: error.message };
  }
};

const normalizeShippingAddress = (shippingAddress = {}) => ({
  fullName: String(shippingAddress.fullName || "").trim(),
  phone: String(shippingAddress.phone || "").trim(),
  line1: String(shippingAddress.line1 || "").trim(),
  line2: shippingAddress.line2 ? String(shippingAddress.line2).trim() : null,
  city: String(shippingAddress.city || "").trim(),
  state: shippingAddress.state ? String(shippingAddress.state).trim() : null,
  postalCode: shippingAddress.postalCode
    ? String(shippingAddress.postalCode).trim()
    : null,
  country: String(shippingAddress.country || "Pakistan").trim() || "Pakistan",
});

const formatSavedShippingAddress = (address) =>
  address
    ? {
        id: address.id,
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
      }
    : null;

const saveDefaultShippingAddress = async (tx, userId, shippingAddress) => {
  const existingDefault = await tx.address.findFirst({
    where: {
      userId,
      isDefault: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existingDefault) {
    await tx.address.updateMany({
      where: {
        userId,
        isDefault: true,
        id: { not: existingDefault.id },
      },
      data: { isDefault: false },
    });

    return tx.address.update({
      where: { id: existingDefault.id },
      data: {
        ...shippingAddress,
        label: "Checkout",
        isDefault: true,
      },
    });
  }

  await tx.address.updateMany({
    where: {
      userId,
      isDefault: true,
    },
    data: { isDefault: false },
  });

  return tx.address.create({
    data: {
      userId,
      ...shippingAddress,
      label: "Checkout",
      isDefault: true,
    },
  });
};

const createOrderFromCart = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const cartItems = await getUserCartItems(prisma, req.user.id);

    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    for (const item of cartItems) {
      if (!item.product || item.product.status !== "ACTIVE") {
        return res.status(409).json({
          message: "One or more cart products are no longer available.",
        });
      }

      const stockError = validateProductStock(item.product, item.quantity);
      if (stockError) {
        return res.status(409).json({ message: stockError });
      }
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const shippingFee = calculateShippingFee(subtotal);
    const tax = 0;
    const discount = 0;
    const total = subtotal + shippingFee + tax - discount;
    const shippingAddress = normalizeShippingAddress(req.body.shippingAddress);

    const { order, savedShippingAddress } = await prisma.$transaction(async (tx) => {
      const savedAddress = await saveDefaultShippingAddress(
        tx,
        req.user.id,
        shippingAddress
      );

      if (shippingAddress.phone && shippingAddress.phone !== req.user.phone) {
        await tx.user.update({
          where: { id: req.user.id },
          data: { phone: shippingAddress.phone },
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          orderNumber: createOrderNumber(),
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          subtotal,
          shippingFee,
          tax,
          discount,
          total,
          currency: "PKR",
          shippingAddressSnapshot: shippingAddress,
          notes: req.body.notes || null,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              sku: item.product.sku,
              partNumber: item.product.partNumber,
              price: item.product.price,
              quantity: item.quantity,
              lineTotal: Number(item.product.price) * item.quantity,
            })),
          },
          timeline: {
            create: {
              status: "PENDING_PAYMENT",
              label: "Order created",
              message: "Your order was created and is waiting for payment.",
            },
          },
        },
        include: orderInclude,
      });

      return {
        order: createdOrder,
        savedShippingAddress: savedAddress,
      };
    });

    return res.status(201).json({
      message: "Order created. Stripe payment will be attached in the checkout step.",
      order: formatOrder(order),
      cart: formatCart(cartItems),
      defaultShippingAddress: formatSavedShippingAddress(savedShippingAddress),
    });
  } catch (error) {
    return next(error);
  }
};

const listOrders = async (req, res, next) => {
  try {
    const orders = await getPrisma().order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    });

    return res.status(200).json({ orders: orders.map(formatOrder) });
  } catch (error) {
    return next(error);
  }
};

const listAdminOrders = async (req, res, next) => {
  try {
    const statuses = String(req.query.status || "")
      .split(",")
      .map((status) => status.trim())
      .filter(Boolean);
    const orders = await getPrisma().order.findMany({
      where: statuses.length ? { status: { in: statuses } } : undefined,
      orderBy: { createdAt: "desc" },
      include: adminOrderInclude,
    });

    return res.status(200).json({ orders: orders.map(formatOrder) });
  } catch (error) {
    return next(error);
  }
};

const listAdminCustomers = async (req, res, next) => {
  try {
    const customers = await getPrisma().user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    return res.status(200).json({
      customers: customers.map((customer) => {
        const paidOrders = customer.orders.filter(
          (order) => order.paymentStatus === "SUCCEEDED"
        );
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          status: customer.status,
          createdAt: customer.createdAt,
          orderCount: customer.orders.length,
          totalSpent: paidOrders.reduce(
            (sum, order) => sum + Number(order.total || 0),
            0
          ),
          latestOrder: customer.orders[0] || null,
        };
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminAnalytics = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: adminOrderInclude,
    });

    const paidOrders = orders.filter((order) => order.paymentStatus === "SUCCEEDED");
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const statusCounts = orders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    }, {});

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });

    const revenueByDay = last7Days.map((date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dayOrders = paidOrders.filter((order) => {
        const placedAt = new Date(order.placedAt || order.createdAt);
        return placedAt >= date && placedAt < nextDate;
      });

      return {
        label: date.toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
        orders: dayOrders.length,
      };
    });

    const productMap = new Map();
    for (const order of paidOrders) {
      for (const item of order.items || []) {
        const key = item.productId || item.sku;
        const current = productMap.get(key) || {
          productId: item.productId,
          name: item.productName,
          sku: item.sku,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.lineTotal || 0);
        productMap.set(key, current);
      }
    }

    return res.status(200).json({
      summary: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        revenue,
        pendingDispatch: orders.filter((order) => order.status === "PAID").length,
        readyToDispatch: orders.filter((order) => order.status === "READY_TO_DISPATCH").length,
        shipped: orders.filter((order) => order.status === "SHIPPED").length,
        delivered: orders.filter((order) => order.status === "DELIVERED").length,
      },
      statusCounts,
      revenueByDay,
      topProducts: Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      recentOrders: orders.slice(0, 6).map(formatOrder),
    });
  } catch (error) {
    return next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await findOrderForUser(
      getPrisma(),
      req.user.id,
      req.params.orderId,
      orderInclude
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({ order: formatOrder(order) });
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await findOrderForUser(prisma, req.user.id, req.params.orderId);

    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!["PENDING_PAYMENT", "PROCESSING"].includes(existing.status)) {
      return res.status(409).json({ message: "This order cannot be cancelled." });
    }

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: "CANCELLED",
        paymentStatus:
          existing.paymentStatus === "SUCCEEDED" ? "REFUNDED" : "CANCELLED",
      },
      include: orderInclude,
    });

    return res.status(200).json({
      message: "Order cancelled.",
      order: formatOrder(order),
    });
  } catch (error) {
    return next(error);
  }
};

const updateOrderDelivery = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await findOrderByIdentity(prisma, req.params.orderId);

    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }

    const deliveryDays =
      req.body.deliveryDays === undefined ? null : Number(req.body.deliveryDays);
    const estimatedDeliveryAt = req.body.estimatedDeliveryAt
      ? new Date(req.body.estimatedDeliveryAt)
      : deliveryDays
        ? addDays(new Date(), deliveryDays)
        : undefined;
    const updateData = {};

    if (estimatedDeliveryAt !== undefined) {
      if (Number.isNaN(estimatedDeliveryAt.getTime())) {
        return res.status(400).json({ message: "Estimated delivery date is invalid." });
      }

      updateData.estimatedDeliveryAt = estimatedDeliveryAt;
    }

    const statusChanged = req.body.status && req.body.status !== existing.status;
    if (req.body.status) {
      updateData.status = req.body.status;
      if (req.body.status === "READY_TO_DISPATCH" && !existing.readyForDispatchAt) {
        updateData.readyForDispatchAt = new Date();
      }
      if (req.body.status === "SHIPPED" && !existing.shippedAt) {
        updateData.shippedAt = new Date();
        updateData.deliveryConfirmationDueAt = addDays(new Date(), 2);
      }
      if (req.body.status === "DELIVERED" && !existing.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: updateData,
        include: adminOrderInclude,
      });

      if (statusChanged) {
        await addOrderTimelineEvent(tx, {
          orderId: updatedOrder.id,
          adminId: req.user.id,
          status: updatedOrder.status,
          label: "Order status updated",
          message: `Order moved to ${updatedOrder.status.replaceAll("_", " ").toLowerCase()}.`,
          metadata: { estimatedDeliveryAt: updatedOrder.estimatedDeliveryAt },
        });
      }

      await createAdminAuditLog(tx, {
        adminId: req.user.id,
        action: "ORDER_DELIVERY_UPDATED",
        order: updatedOrder,
        metadata: {
          estimatedDeliveryAt: updatedOrder.estimatedDeliveryAt,
          status: updatedOrder.status,
        },
      });

      return updatedOrder;
    });

    return res.status(200).json({
      message: "Order delivery details updated.",
      order: formatOrder(order),
    });
  } catch (error) {
    return next(error);
  }
};

const prepareOrderDispatch = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await findOrderByIdentity(prisma, req.params.orderId);

    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (existing.paymentStatus !== "SUCCEEDED") {
      return res.status(409).json({ message: "Only paid orders can be prepared." });
    }

    if (!["PAID", "PROCESSING", "READY_TO_DISPATCH"].includes(existing.status)) {
      return res.status(409).json({ message: "This order cannot be prepared for dispatch." });
    }

    const estimatedDeliveryAt = getEstimatedDeliveryAt({
      estimatedDeliveryAt: req.body.estimatedDeliveryAt,
      deliveryDays: req.body.deliveryDays,
      fallbackDays: 4,
    });

    if (estimatedDeliveryAt && Number.isNaN(estimatedDeliveryAt.getTime())) {
      return res.status(400).json({ message: "Estimated delivery date is invalid." });
    }

    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: "READY_TO_DISPATCH",
          readyForDispatchAt: existing.readyForDispatchAt || new Date(),
          estimatedDeliveryAt: estimatedDeliveryAt || existing.estimatedDeliveryAt,
          shipmentNotes: req.body.note || existing.shipmentNotes,
        },
        include: adminOrderInclude,
      });

      await addOrderTimelineEvent(tx, {
        orderId: updatedOrder.id,
        adminId: req.user.id,
        status: "READY_TO_DISPATCH",
        label: "Ready for dispatch",
        message: req.body.note || "Your package is packed and ready for dispatch.",
        metadata: {
          estimatedDeliveryAt: updatedOrder.estimatedDeliveryAt,
        },
      });

      await createAdminAuditLog(tx, {
        adminId: req.user.id,
        action: "ORDER_READY_FOR_DISPATCH",
        order: updatedOrder,
        metadata: { estimatedDeliveryAt: updatedOrder.estimatedDeliveryAt },
      });

      return updatedOrder;
    });

    const emailResult = await sendOrderEmailSafely(
      order,
      buildDispatchEmail,
      "dispatch"
    );

    await prisma.orderStatusEvent.create({
      data: {
        orderId: order.id,
        adminId: req.user.id,
        status: order.status,
        label: emailResult.sent ? "Dispatch email sent" : "Dispatch email not sent",
        message: emailResult.sent
          ? `Dispatch email sent to ${order.user?.email}.`
          : `Dispatch email could not be sent: ${emailResult.error}`,
        metadata: emailResult,
      },
    });

    return res.status(200).json({
      message: "Order marked ready for dispatch.",
      order: formatOrder(
        await prisma.order.findUnique({
          where: { id: order.id },
          include: adminOrderInclude,
        })
      ),
    });
  } catch (error) {
    return next(error);
  }
};

const shipOrder = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await findOrderByIdentity(prisma, req.params.orderId);

    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (existing.paymentStatus !== "SUCCEEDED") {
      return res.status(409).json({ message: "Only paid orders can be shipped." });
    }

    if (!["PAID", "PROCESSING", "READY_TO_DISPATCH", "SHIPPED"].includes(existing.status)) {
      return res.status(409).json({ message: "This order cannot be shipped." });
    }

    const estimatedDeliveryAt = getEstimatedDeliveryAt({
      estimatedDeliveryAt: req.body.estimatedDeliveryAt,
      deliveryDays: req.body.deliveryDays,
      fallbackDays: 2,
    });

    if (estimatedDeliveryAt && Number.isNaN(estimatedDeliveryAt.getTime())) {
      return res.status(400).json({ message: "Estimated delivery date is invalid." });
    }

    const shippedAt = existing.shippedAt || new Date();
    const confirmationDueAt =
      estimatedDeliveryAt || addDays(shippedAt, Number(req.body.deliveryDays || 2));

    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: "SHIPPED",
          shippedAt,
          estimatedDeliveryAt: estimatedDeliveryAt || existing.estimatedDeliveryAt,
          courierName: req.body.courierName || existing.courierName,
          trackingNumber: req.body.trackingNumber || existing.trackingNumber,
          trackingUrl: req.body.trackingUrl || existing.trackingUrl,
          shipmentNotes: req.body.shipmentNotes || existing.shipmentNotes,
          deliveryConfirmationDueAt: confirmationDueAt,
        },
        include: adminOrderInclude,
      });

      await addOrderTimelineEvent(tx, {
        orderId: updatedOrder.id,
        adminId: req.user.id,
        status: "SHIPPED",
        label: "Order shipped",
        message: "Your package has been shipped. A delivery confirmation reminder is scheduled for the estimated delivery time.",
        metadata: {
          courierName: updatedOrder.courierName,
          trackingNumber: updatedOrder.trackingNumber,
          trackingUrl: updatedOrder.trackingUrl,
          deliveryConfirmationDueAt: updatedOrder.deliveryConfirmationDueAt,
        },
      });

      await createAdminAuditLog(tx, {
        adminId: req.user.id,
        action: "ORDER_SHIPPED",
        order: updatedOrder,
        metadata: {
          courierName: updatedOrder.courierName,
          trackingNumber: updatedOrder.trackingNumber,
          deliveryConfirmationDueAt: updatedOrder.deliveryConfirmationDueAt,
        },
      });

      return updatedOrder;
    });

    const emailResult = await sendOrderEmailSafely(order, buildShippedEmail, "shipping");

    await prisma.orderStatusEvent.create({
      data: {
        orderId: order.id,
        adminId: req.user.id,
        status: order.status,
        label: emailResult.sent ? "Shipping email sent" : "Shipping email not sent",
        message: emailResult.sent
          ? `Shipping email sent to ${order.user?.email}.`
          : `Shipping email could not be sent: ${emailResult.error}`,
        metadata: emailResult,
      },
    });

    return res.status(200).json({
      message: "Order shipped.",
      order: formatOrder(
        await prisma.order.findUnique({
          where: { id: order.id },
          include: adminOrderInclude,
        })
      ),
    });
  } catch (error) {
    return next(error);
  }
};

const confirmOrderDelivery = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await findOrderForUser(prisma, req.user.id, req.params.orderId);

    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!["SHIPPED", "DELIVERED"].includes(existing.status)) {
      return res.status(409).json({ message: "Only shipped orders can be confirmed." });
    }

    const confirmedAt = new Date();
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: "DELIVERED",
          deliveredAt: existing.deliveredAt || confirmedAt,
          deliveryConfirmedAt: existing.deliveryConfirmedAt || confirmedAt,
        },
        include: orderInclude,
      });

      await addOrderTimelineEvent(tx, {
        orderId: updatedOrder.id,
        status: "DELIVERED",
        label: "Delivery confirmed",
        message: "Customer confirmed that the package was received.",
        metadata: { confirmedBy: "customer" },
      });

      return updatedOrder;
    });

    return res.status(200).json({
      message: "Delivery confirmed.",
      order: formatOrder(order),
    });
  } catch (error) {
    return next(error);
  }
};

const confirmOrderDeliveryByToken = async (req, res, next) => {
  try {
    const { token } = req.body || {};
    const payload = verifyDeliveryConfirmationToken(token);
    const prisma = getPrisma();
    const existing = await prisma.order.findUnique({
      where: { id: payload.orderId },
      include: adminOrderInclude,
    });

    if (!existing || existing.orderNumber !== payload.orderNumber) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!["SHIPPED", "DELIVERED"].includes(existing.status)) {
      return res.status(409).json({ message: "Only shipped orders can be confirmed." });
    }

    if (existing.deliveryConfirmedAt && existing.status === "DELIVERED") {
      return res.status(200).json({
        message: "Delivery was already confirmed.",
        order: formatOrder(existing),
      });
    }

    const confirmedAt = new Date();
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: "DELIVERED",
          deliveredAt: existing.deliveredAt || confirmedAt,
          deliveryConfirmedAt: existing.deliveryConfirmedAt || confirmedAt,
        },
        include: adminOrderInclude,
      });

      await addOrderTimelineEvent(tx, {
        orderId: updatedOrder.id,
        status: "DELIVERED",
        label: "Delivery confirmed by customer",
        message: "Customer confirmed receipt from the delivery confirmation email.",
        metadata: { confirmedBy: "email_link", confirmedAt },
      });

      return updatedOrder;
    });

    return res.status(200).json({
      message: "Delivery confirmed. Thank you.",
      order: formatOrder(order),
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Delivery confirmation link is invalid or expired.",
    });
  }
};

const sendDeliveryConfirmation = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await findOrderByIdentity(
      prisma,
      req.params.orderId,
      adminOrderInclude
    );

    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!["SHIPPED", "DELIVERED"].includes(existing.status)) {
      return res.status(409).json({
        message: "Delivery confirmation can only be sent for shipped orders.",
      });
    }

    const emailPreview = buildDeliveryConfirmationEmail(existing);
    const recipient = existing.user?.email;

    if (!recipient) {
      return res.status(400).json({ message: "Order customer email is missing." });
    }

    let mailResult;
    try {
      mailResult = await sendMail({
        to: recipient,
        ...emailPreview,
      });
    } catch (mailError) {
      const isConfigError = mailError.message === "SMTP is not configured.";
      return res.status(isConfigError ? 503 : 502).json({
        message: isConfigError
          ? "SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, and EMAIL_FROM_NAME."
          : "Could not send delivery confirmation email.",
        detail: mailError.message,
      });
    }

    const sentAt = new Date();
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          deliveryConfirmationSentAt: sentAt,
        },
        include: adminOrderInclude,
      });

      await addOrderTimelineEvent(tx, {
        orderId: updatedOrder.id,
        adminId: req.user.id,
        status: updatedOrder.status,
        label: "Delivery confirmation email sent",
        message: `Delivery confirmation email sent to ${recipient}.`,
        metadata: {
          sentAt,
          confirmationUrl: `${getClientUrl()}/buyer/watch-list`,
          messageId: mailResult.messageId,
        },
      });

      await createAdminAuditLog(tx, {
        adminId: req.user.id,
        action: "ORDER_CONFIRMATION_EMAIL_SENT",
        order: updatedOrder,
        metadata: { sentAt, messageId: mailResult.messageId },
      });

      return updatedOrder;
    });

    return res.status(200).json({
      message: "Delivery confirmation email sent.",
      order: formatOrder(order),
      emailPreview,
      messageId: mailResult.messageId,
    });
  } catch (error) {
    return next(error);
  }
};

const sendDueDeliveryConfirmations = async () => {
  const prisma = getPrisma();
  const dueOrders = await prisma.order.findMany({
    where: {
      status: "SHIPPED",
      deliveryConfirmationSentAt: null,
      deliveryConfirmationDueAt: {
        lte: new Date(),
      },
    },
    include: adminOrderInclude,
    take: 25,
  });

  for (const order of dueOrders) {
    const emailResult = await sendOrderEmailSafely(
      order,
      buildDeliveryConfirmationEmail,
      "delivery confirmation"
    );

    if (!emailResult.sent) continue;

    const sentAt = new Date();
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { deliveryConfirmationSentAt: sentAt },
      }),
      prisma.orderStatusEvent.create({
        data: {
          orderId: order.id,
          status: order.status,
          label: "Delivery confirmation email sent automatically",
          message: `Delivery confirmation email sent to ${order.user?.email}.`,
          metadata: {
            sentAt,
            messageId: emailResult.messageId,
            confirmationUrl: getConfirmationUrl(order),
            automatic: true,
          },
        },
      }),
    ]);
  }

  return dueOrders.length;
};

const adminMarkDelivered = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const existing = await findOrderByIdentity(prisma, req.params.orderId);

    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }

    const deliveredAt = new Date();
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: "DELIVERED",
          deliveredAt: existing.deliveredAt || deliveredAt,
          deliveryConfirmedAt: existing.deliveryConfirmedAt || deliveredAt,
        },
        include: adminOrderInclude,
      });

      await addOrderTimelineEvent(tx, {
        orderId: updatedOrder.id,
        adminId: req.user.id,
        status: "DELIVERED",
        label: "Marked delivered by admin",
        message: req.body?.note || "Admin manually confirmed delivery.",
        metadata: { override: true },
      });

      await createAdminAuditLog(tx, {
        adminId: req.user.id,
        action: "ORDER_MARKED_DELIVERED",
        order: updatedOrder,
        metadata: { override: true },
      });

      return updatedOrder;
    });

    return res.status(200).json({
      message: "Order marked delivered.",
      order: formatOrder(order),
    });
  } catch (error) {
    return next(error);
  }
};

const createStripeCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripeInstance();

    if (!stripe) {
      return res.status(503).json({
        message:
          "Stripe is not configured. Add STRIPE_SECRET_KEY before using checkout.",
      });
    }

    const prisma = getPrisma();
    const order = await findOrderForUser(
      prisma,
      req.user.id,
      req.params.orderId,
      orderInclude
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.paymentStatus === "SUCCEEDED") {
      return res.status(409).json({ message: "Order is already paid." });
    }

    if (order.status === "CANCELLED") {
      return res.status(409).json({ message: "Cancelled orders cannot be paid." });
    }

    const currency = String(process.env.STRIPE_CURRENCY || order.currency || "PKR").toLowerCase();
    const clientUrl = getClientUrl();
    const lineItems = order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: toStripeAmount(item.price),
        product_data: {
          name: item.productName,
          description: item.partNumber,
        },
      },
    }));

    if (Number(order.shippingFee) > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toStripeAmount(order.shippingFee),
          product_data: {
            name: "Shipping",
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: req.user.email,
      line_items: lineItems,
      success_url: `${clientUrl}/shop?payment=success&order=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/shop?payment=cancelled&order=${order.orderNumber}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: req.user.id,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        providerOrderId: session.id,
        status: "PENDING",
        amount: order.total,
        currency: order.currency,
        rawResponse: {
          checkoutSessionId: session.id,
          paymentIntent: session.payment_intent,
        },
      },
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: orderInclude,
    });

    return res.status(201).json({
      checkoutUrl: session.url,
      sessionId: session.id,
      order: formatOrder(updatedOrder),
    });
  } catch (error) {
    return next(error);
  }
};

const markStripeSessionSucceeded = async (session) => {
  const prisma = getPrisma();
  const orderId = session.metadata?.orderId;

  if (!orderId) return null;
  let updatedOrderId = null;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order || order.paymentStatus === "SUCCEEDED") return;

    await tx.cartItem.deleteMany({ where: { userId: order.userId } });

    await tx.payment.updateMany({
      where: {
        provider: "STRIPE",
        providerOrderId: session.id,
      },
      data: {
        status: "SUCCEEDED",
        providerPaymentId: String(session.payment_intent || ""),
        rawResponse: {
          checkoutSessionId: session.id,
          paymentIntent: session.payment_intent,
          paymentStatus: session.payment_status,
        },
      },
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        placedAt: new Date(),
      },
    });

    await addOrderTimelineEvent(tx, {
      orderId: updatedOrder.id,
      status: "PAID",
      label: "Payment received",
      message: "Stripe payment succeeded. The order is ready for admin processing.",
      metadata: {
        checkoutSessionId: session.id,
        paymentIntent: session.payment_intent,
      },
    });

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.inventory.updateMany({
        where: { productId: item.productId },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });
    }

    updatedOrderId = updatedOrder.id;
  });

  const updatedOrder = await prisma.order.findUnique({
    where: { id: updatedOrderId || orderId },
    include: adminOrderInclude,
  });

  if (updatedOrderId) {
    await sendPaymentReceiptSafely(updatedOrder);
  }

  return updatedOrder;
};

const markStripeSessionFailed = async (session, status = "FAILED") => {
  const prisma = getPrisma();
  await prisma.payment.updateMany({
    where: {
      provider: "STRIPE",
      providerOrderId: session.id,
    },
    data: {
      status,
      rawResponse: {
        checkoutSessionId: session.id,
        paymentStatus: session.payment_status,
      },
    },
  });
};

const handleStripeWebhook = async (req, res, next) => {
  try {
    const stripe = getStripeInstance();

    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured." });
    }

    const signature = req.headers["stripe-signature"];
    let event;

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(req.body.toString("utf8"));
    }

    if (event.type === "checkout.session.completed") {
      await markStripeSessionSucceeded(event.data.object);
    }

    if (event.type === "checkout.session.expired") {
      await markStripeSessionFailed(event.data.object, "CANCELLED");
    }

    if (event.type === "checkout.session.async_payment_failed") {
      await markStripeSessionFailed(event.data.object, "FAILED");
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return next(error);
  }
};

const syncStripeCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripeInstance();

    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured." });
    }

    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ message: "Stripe session id is required." });
    }

    const prisma = getPrisma();
    const order = await findOrderForUser(
      prisma,
      req.user.id,
      req.params.orderId,
      orderInclude
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      session.metadata?.orderId !== order.id ||
      session.metadata?.userId !== req.user.id
    ) {
      return res.status(403).json({
        message: "Stripe session does not match this order.",
      });
    }

    let syncedOrder = order;
    if (session.payment_status === "paid" || session.status === "complete") {
      syncedOrder = await markStripeSessionSucceeded(session);
    } else if (["expired", "canceled"].includes(session.status)) {
      await markStripeSessionFailed(session, "CANCELLED");
      syncedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: orderInclude,
      });
    }

    const cartItems = await getUserCartItems(prisma, req.user.id);

    return res.status(200).json({
      order: formatOrder(syncedOrder),
      cart: formatCart(cartItems),
      paymentStatus: session.payment_status,
      checkoutStatus: session.status,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addCartItem,
  addWishlistItem,
  cancelOrder,
  confirmOrderDelivery,
  confirmOrderDeliveryByToken,
  adminMarkDelivered,
  clearCart,
  createStripeCheckoutSession,
  createOrderFromCart,
  getAdminAnalytics,
  listAdminCustomers,
  getCart,
  getOrder,
  getWishlist,
  handleStripeWebhook,
  listAdminOrders,
  listOrders,
  prepareOrderDispatch,
  removeCartItem,
  removeWishlistItem,
  sendDeliveryConfirmation,
  sendDueDeliveryConfirmations,
  shipOrder,
  syncStripeCheckoutSession,
  updateOrderDelivery,
  updateCartItem,
};
