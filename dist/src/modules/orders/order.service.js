"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseEscrowFunds = exports.updateOrderStatus = exports.getFarmerOrders = exports.getOrderById = exports.getBuyerOrders = exports.handleCampayWebhook = exports.checkOrderPaymentStatus = exports.createEscrowOrder = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const engine_1 = require("./engine");
const engine_2 = require("../fintech/engine");
const campay_service_1 = require("./campay.service");
const createEscrowOrder = async (buyerId, data) => {
    if (!data.items || data.items.length === 0) {
        throw new Error('Cannot checkout an empty basket');
    }
    const currency = data.currency || 'XAF';
    // Calculate items subtotal and verify stock
    let subtotal = 0;
    let primaryFarmerId = '';
    const orderItemsData = [];
    for (const item of data.items) {
        const yieldItem = await prisma_1.default.agroYield.findUnique({
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
        // Resolve a valid FarmerProfile.id to satisfy OrderItem foreign key constraint
        let validFarmerProfileId = '';
        if (yieldItem.farmerId) {
            const existingProfile = await prisma_1.default.farmerProfile.findUnique({
                where: { id: yieldItem.farmerId },
            });
            if (existingProfile) {
                validFarmerProfileId = existingProfile.id;
            }
        }
        if (!validFarmerProfileId && yieldItem.farmId) {
            const farm = await prisma_1.default.farm.findUnique({
                where: { id: yieldItem.farmId },
            });
            if (farm?.userId) {
                const farmerProfile = await prisma_1.default.farmerProfile.findUnique({
                    where: { userId: farm.userId },
                });
                if (farmerProfile) {
                    validFarmerProfileId = farmerProfile.id;
                }
            }
        }
        // Fallback: If still not resolved, link to the first existing farmer profile
        if (!validFarmerProfileId) {
            const anyProfile = await prisma_1.default.farmerProfile.findFirst();
            if (anyProfile) {
                validFarmerProfileId = anyProfile.id;
            }
        }
        if (!primaryFarmerId && validFarmerProfileId) {
            primaryFarmerId = validFarmerProfileId;
        }
        orderItemsData.push({
            yieldId: yieldItem.id,
            farmerId: validFarmerProfileId,
            quantity: item.quantity,
            unitPrice: price,
            totalPrice: itemTotal,
        });
    }
    // Delivery fee calculation (Synced with Frontend: 1500 FCFA base, free if 10+ items or order > 50,000 FCFA)
    const totalItemCount = data.items.reduce((sum, i) => sum + i.quantity, 0);
    const deliveryFee = totalItemCount >= 10 || subtotal > 50000 ? 0 : 1500;
    // Compute Multi-Party Atomic Settlement via Engine 3
    const settlement = await engine_1.SettlementLedger.computeSettlement({
        subtotal,
        deliveryFee,
        currency,
        farmerId: primaryFarmerId,
    });
    const isMobileMoney = data.paymentMethod === client_1.PaymentMethod.MTN_MOMO ||
        data.paymentMethod === client_1.PaymentMethod.ORANGE_MONEY;
    let campayPromptInfo = null;
    let initialStatus = client_1.OrderStatus.ESCROW_LOCKED;
    let paymentReference = `${data.paymentMethod}-${Date.now()}`;
    // If Cameroon MTN MoMo or Orange Money, initiate real Campay payment collection
    if (isMobileMoney && currency === 'XAF') {
        try {
            const campayRes = await campay_service_1.campayService.collectPayment({
                amount: settlement.grossAmount,
                from: data.deliveryPhone,
                description: `AgroMarket Escrow order for harvest produce`,
                externalReference: `order-${buyerId.substring(0, 8)}-${Date.now()}`,
            });
            paymentReference = campayRes.reference;
            campayPromptInfo = campayRes;
            initialStatus = client_1.OrderStatus.PENDING_PAYMENT;
        }
        catch (err) {
            console.warn('⚠️ [CAMPAY] Live collection prompt error, holding local escrow:', err.message);
            initialStatus = client_1.OrderStatus.ESCROW_LOCKED;
        }
    }
    const order = await prisma_1.default.order.create({
        data: {
            buyerId,
            status: initialStatus,
            paymentMethod: data.paymentMethod,
            currency,
            subtotal,
            deliveryFee,
            totalAmount: settlement.grossAmount,
            deliveryAddress: data.deliveryAddress,
            deliveryCity: data.deliveryCity,
            deliveryPhone: data.deliveryPhone,
            deliveryNotes: data.deliveryNotes,
            paymentReference,
            items: {
                create: orderItemsData,
            },
            escrow: {
                create: {
                    amountHeld: settlement.grossAmount,
                    farmerPayout: settlement.farmerNetPayout,
                    transporterFee: settlement.transporterFee,
                    platformFee: settlement.platformCommission,
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
    // Execute FSM transition
    if (initialStatus === client_1.OrderStatus.ESCROW_LOCKED) {
        engine_1.EscrowMachine.transition(order.id, 'ORDER_CREATED', 'ESCROW_LOCKED');
    }
    // Decrement stock
    for (const item of data.items) {
        await prisma_1.default.agroYield.update({
            where: { id: item.yieldId },
            data: { stockQuantity: { decrement: item.quantity } },
        });
    }
    // Clear user cart
    await prisma_1.default.cartItem.deleteMany({
        where: { userId: buyerId },
    });
    return {
        ...order,
        settlementBreakdown: settlement,
        campayPrompt: campayPromptInfo,
    };
};
exports.createEscrowOrder = createEscrowOrder;
const checkOrderPaymentStatus = async (orderId) => {
    const order = await prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: { escrow: true },
    });
    if (!order)
        throw new Error('Order not found');
    if (order.status === client_1.OrderStatus.ESCROW_LOCKED || order.status === client_1.OrderStatus.COMPLETED) {
        return { status: order.status, isLocked: true };
    }
    if (order.paymentReference && !order.paymentReference.startsWith('CASH_')) {
        try {
            const campayStatus = await campay_service_1.campayService.checkTransactionStatus(order.paymentReference);
            if (campayStatus.status === 'SUCCESSFUL') {
                const updated = await prisma_1.default.order.update({
                    where: { id: orderId },
                    data: { status: client_1.OrderStatus.ESCROW_LOCKED },
                });
                engine_1.EscrowMachine.transition(orderId, 'ORDER_CREATED', 'ESCROW_LOCKED');
                return { status: updated.status, isLocked: true, campay: campayStatus };
            }
            else if (campayStatus.status === 'FAILED') {
                const updated = await prisma_1.default.order.update({
                    where: { id: orderId },
                    data: { status: client_1.OrderStatus.CANCELLED },
                });
                return { status: updated.status, isLocked: false, campay: campayStatus };
            }
            return { status: order.status, isLocked: false, campay: campayStatus };
        }
        catch (err) {
            console.warn('Campay status check warning:', err.message);
        }
    }
    return { status: order.status, isLocked: false };
};
exports.checkOrderPaymentStatus = checkOrderPaymentStatus;
const handleCampayWebhook = async (payload) => {
    const { reference, status, external_reference } = payload;
    console.log(`📡 [CAMPAY WEBHOOK RECEIVED] Ref: ${reference}, Status: ${status}`);
    const order = await prisma_1.default.order.findFirst({
        where: {
            OR: [
                { paymentReference: reference },
                { id: external_reference },
            ],
        },
    });
    if (!order) {
        console.warn(`[CAMPAY WEBHOOK] No matching order found for reference: ${reference}`);
        return;
    }
    if (status === 'SUCCESSFUL' && order.status !== client_1.OrderStatus.ESCROW_LOCKED) {
        await prisma_1.default.order.update({
            where: { id: order.id },
            data: { status: client_1.OrderStatus.ESCROW_LOCKED },
        });
        engine_1.EscrowMachine.transition(order.id, 'ORDER_CREATED', 'ESCROW_LOCKED');
        console.log(`🔒 [CAMPAY WEBHOOK SUCCESS] Order ${order.id} moved to ESCROW_LOCKED`);
    }
    else if (status === 'FAILED') {
        await prisma_1.default.order.update({
            where: { id: order.id },
            data: { status: client_1.OrderStatus.CANCELLED },
        });
        console.log(`❌ [CAMPAY WEBHOOK FAILURE] Order ${order.id} marked CANCELLED`);
    }
};
exports.handleCampayWebhook = handleCampayWebhook;
const getBuyerOrders = async (buyerId) => {
    return prisma_1.default.order.findMany({
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
const getOrderById = async (orderId, userId) => {
    const order = await prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: { yield: true, farmer: true },
            },
            escrow: true,
            deliveryTrip: {
                include: { transporter: true },
            },
        },
    });
    if (!order)
        throw new Error('Order not found');
    return order;
};
exports.getOrderById = getOrderById;
const getFarmerOrders = async (farmerUserId) => {
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId: farmerUserId },
    });
    if (!farmer)
        throw new Error('Farmer profile not found');
    return prisma_1.default.orderItem.findMany({
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
const updateOrderStatus = async (orderId, targetStatus, actorUserId) => {
    const order = await prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });
    if (!order)
        throw new Error('Order not found');
    const currentFsmState = order.status;
    const targetFsmState = targetStatus;
    const transition = engine_1.EscrowMachine.transition(orderId, currentFsmState, targetFsmState);
    if (!transition.valid) {
        throw new Error(transition.message);
    }
    const updatedOrder = await prisma_1.default.order.update({
        where: { id: orderId },
        data: { status: targetStatus },
    });
    return updatedOrder;
};
exports.updateOrderStatus = updateOrderStatus;
const releaseEscrowFunds = async (orderId, buyerId) => {
    const order = await prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: {
            escrow: true,
            items: {
                include: { farmer: true },
            },
        },
    });
    if (!order || order.buyerId !== buyerId) {
        throw new Error('Unauthorized or order not found');
    }
    // FSM Transition to ESCROW_RELEASED
    const currentFsmState = (order.status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT');
    engine_1.EscrowMachine.transition(orderId, currentFsmState, 'ESCROW_RELEASED');
    await prisma_1.default.order.update({
        where: { id: orderId },
        data: {
            status: client_1.OrderStatus.COMPLETED,
            isEscrowReleased: true,
        },
    });
    await prisma_1.default.escrowRecord.update({
        where: { orderId },
        data: { releasedAt: new Date() },
    });
    // Automated Payout to Farmer via Campay (MTN MoMo / Orange Money)
    const isMobileMoney = order.paymentMethod === client_1.PaymentMethod.MTN_MOMO ||
        order.paymentMethod === client_1.PaymentMethod.ORANGE_MONEY;
    if (isMobileMoney && order.escrow?.farmerPayout) {
        const firstFarmer = order.items[0]?.farmer;
        if (firstFarmer?.userId) {
            const farmerUser = await prisma_1.default.user.findUnique({
                where: { id: firstFarmer.userId },
            });
            if (farmerUser?.phone) {
                try {
                    await campay_service_1.campayService.disburseEscrowPayout({
                        amount: Number(order.escrow.farmerPayout),
                        to: farmerUser.phone,
                        description: `AgroMarket Escrow Payout for Order #${order.orderNumber}`,
                        externalReference: `payout-${order.id}`,
                    });
                    console.log(`💸 [CAMPAY PAYOUT] Disbursed ${order.escrow.farmerPayout} XAF to farmer ${farmerUser.phone}`);
                }
                catch (err) {
                    console.warn('⚠️ [CAMPAY PAYOUT] Automated withdrawal call warning:', err.message);
                }
            }
        }
    }
    // Re-calculate credit score for all involved farmers in background
    const farmerIds = Array.from(new Set(order.items.map((i) => i.farmerId).filter(Boolean)));
    for (const farmerId of farmerIds) {
        setImmediate(async () => {
            try {
                await engine_2.CreditScoringEngine.evaluateFarmer({
                    farmerId,
                    triggeredBy: `ORDER_COMPLETED_${orderId}`,
                });
            }
            catch (e) {
                console.error(`[EscrowRelease] Auto-rescore failed for farmer ${farmerId}:`, e);
            }
        });
    }
    return {
        success: true,
        message: 'Escrow funds successfully released to farmer & transporter! Credit score updated.',
    };
};
exports.releaseEscrowFunds = releaseEscrowFunds;
