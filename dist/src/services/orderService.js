"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseEscrowFunds = exports.getFarmerOrders = exports.getBuyerOrders = exports.createEscrowOrder = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createEscrowOrder = async (buyerId, data) => {
    if (!data.items || data.items.length === 0) {
        throw new Error('Cannot checkout an empty basket');
    }
    // Calculate items subtotal and verify stock
    let subtotal = 0;
    const orderItemsData = [];
    for (const item of data.items) {
        const yieldItem = await prisma.agroYield.findUnique({
            where: { id: item.yieldId },
        });
        if (!yieldItem)
            throw new Error(`Product ${item.yieldId} not found`);
        if (yieldItem.stockQuantity < item.quantity) {
            throw new Error(`Insufficient harvest stock for ${yieldItem.title}. Available: ${yieldItem.stockQuantity} ${yieldItem.unit}`);
        }
        const price = Number(yieldItem.pricePerUnit);
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        orderItemsData.push({
            yieldId: yieldItem.id,
            farmerId: yieldItem.farmerId || yieldItem.farmId || '',
            quantity: item.quantity,
            unitPrice: price,
            totalPrice: itemTotal,
        });
    }
    // Delivery fee calculation (Cameroon local shipping: 1000 FCFA base, free if 10+ items)
    const totalItemCount = data.items.reduce((sum, i) => sum + i.quantity, 0);
    const deliveryFee = totalItemCount >= 10 ? 0 : 1000;
    const totalAmount = subtotal + deliveryFee;
    // Platform fee (5%) and Farmer Payout calculation
    const platformFee = Math.round(subtotal * 0.05);
    const transporterFee = deliveryFee;
    const farmerPayout = subtotal - platformFee;
    const order = await prisma.order.create({
        data: {
            buyerId,
            status: client_1.OrderStatus.ESCROW_LOCKED,
            paymentMethod: data.paymentMethod,
            subtotal,
            deliveryFee,
            totalAmount,
            deliveryAddress: data.deliveryAddress,
            deliveryCity: data.deliveryCity,
            deliveryPhone: data.deliveryPhone,
            deliveryNotes: data.deliveryNotes,
            paymentReference: `${data.paymentMethod}-${Date.now()}`,
            items: {
                create: orderItemsData,
            },
            escrow: {
                create: {
                    amountHeld: totalAmount,
                    farmerPayout,
                    transporterFee,
                    platformFee,
                },
            },
        },
        include: {
            items: {
                include: { yield: true, farmer: true },
            },
            escrow: true,
        },
    });
    // Decrement stock
    for (const item of data.items) {
        await prisma.agroYield.update({
            where: { id: item.yieldId },
            data: { stockQuantity: { decrement: item.quantity } },
        });
    }
    // Clear user cart
    await prisma.cartItem.deleteMany({
        where: { userId: buyerId },
    });
    return order;
};
exports.createEscrowOrder = createEscrowOrder;
const getBuyerOrders = async (buyerId) => {
    return prisma.order.findMany({
        where: { buyerId },
        include: {
            items: {
                include: { yield: true, farmer: true },
            },
            escrow: true,
            deliveryTrip: {
                include: { transporter: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getBuyerOrders = getBuyerOrders;
const getFarmerOrders = async (userId) => {
    const farmer = await prisma.farmerProfile.findUnique({
        where: { userId },
    });
    if (!farmer)
        throw new Error('Farmer profile not found');
    return prisma.orderItem.findMany({
        where: { farmerId: farmer.id },
        include: {
            order: {
                include: { buyer: { select: { id: true, name: true, phone: true } } },
            },
            yield: true,
        },
        orderBy: { order: { createdAt: 'desc' } },
    });
};
exports.getFarmerOrders = getFarmerOrders;
const releaseEscrowFunds = async (orderId, buyerId) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { escrow: true },
    });
    if (!order || order.buyerId !== buyerId) {
        throw new Error('Unauthorized or order not found');
    }
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: client_1.OrderStatus.COMPLETED,
            isEscrowReleased: true,
        },
    });
    await prisma.escrowRecord.update({
        where: { orderId },
        data: { releasedAt: new Date() },
    });
    return { success: true, message: 'Escrow funds successfully released to farmer & transporter!' };
};
exports.releaseEscrowFunds = releaseEscrowFunds;
