/**
 * AgroMarket Engines & Algorithms Verification Test Suite
 * Validates all 5 engines, payment resolution, and event pipeline against AGROMARKET_ENGINES_SPECIFICATION.md
 */

import { PaymentMethodResolver } from '../src/core/payment';
import { telemetryService } from '../src/core/telemetry/telemetry.service';
import { CreditScoringEngine, CreditEngineConfig } from '../src/modules/fintech/engine';
import { FeedRankingEngine, FeedEngineConfig } from '../src/modules/feed/engine';
import { EscrowMachine, SettlementLedger } from '../src/modules/orders/engine';
import { SocialGraphEngine } from '../src/modules/farms/engine';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details ? details : '');
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('🌱 AGROMARKET MASTER ENGINES & ALGORITHMS ARCHITECTURE TEST SUITE');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // TEST 1: CORE PAYMENT RESOLVER & GATEWAY STRATEGY (SECTIONS 2 & 3)
  // -------------------------------------------------------------
  console.log('▶ [TEST 1] Core Payment Gateway Resolution (Geo-Location & Currency)');
  {
    // US / North America -> Stripe
    const stripeAdapter = PaymentMethodResolver.resolve({ countryCode: 'US', currency: 'USD' });
    assert(stripeAdapter.providerId === 'stripe', 'Resolves US buyer in USD to Stripe adapter');

    // Cameroon / CEMAC -> MoMo / Orange Money
    const momoAdapter = PaymentMethodResolver.resolve({ countryCode: 'CM', currency: 'XAF' });
    assert(momoAdapter.providerId === 'momo_orange', 'Resolves Cameroon buyer in XAF to MoMo adapter');

    // Nigeria -> Paystack
    const paystackAdapter = PaymentMethodResolver.resolve({ countryCode: 'NG', currency: 'NGN' });
    assert(paystackAdapter.providerId === 'paystack', 'Resolves Nigeria buyer in NGN to Paystack adapter');

    // Kenya -> Paystack
    const kenyaAdapter = PaymentMethodResolver.resolve({ countryCode: 'KE', currency: 'KES' });
    assert(kenyaAdapter.providerId === 'paystack', 'Resolves Kenya buyer in KES to Paystack adapter');

    // Pan-African Multi-Country Fallback (e.g. Uganda in UGX)
    const ugxAdapter = PaymentMethodResolver.resolve({ countryCode: 'UG', currency: 'UGX' });
    assert(ugxAdapter.providerId === 'flutterwave', 'Resolves Uganda buyer in UGX to Flutterwave adapter');

    // Test Escrow init contract
    const initResult = await stripeAdapter.initializeEscrow({
      orderId: 'order_test_1',
      amount: 50,
      currency: 'USD',
      payerReference: 'buyer@example.com',
    });
    assert(initResult.provider === 'stripe' && Boolean(initResult.transactionReference), 'Stripe initializes escrow transaction reference');
  }

  // -------------------------------------------------------------
  // TEST 2: ENGINE 1 - FARMER CREDIT SCORING (VICTORY EYONG TABI MODEL)
  // -------------------------------------------------------------
  console.log('\n▶ [TEST 2] Engine 1: Farmer Credit Scoring & Risk Underwriting');
  {
    // Scenario A: Brand New Cold-Start Farmer (< 3 completed orders)
    const coldStartRaw = {
      salesFulfillment: 1,
      listingFrequency: 12,
      reviewBayesian: 4.0,
      deliveryReliability: 1.0,
      networkReach: 40,
      engagementVelocity: 150,
      repaymentIntegrity: 1.0,
      kycCompliance: 100, // Fully verified ID + GPS + Coop
    };

    const coldDecision = CreditScoringEngine.computePure(coldStartRaw, 'cold-start-farmer-1');
    assert(coldDecision.isColdStart === true, 'Correctly flags new farmer under Cold-Start progressive weighting');
    assert(coldDecision.weightsApplied.salesFulfillment === 0.0, 'Cold-start farmers are not penalized with 0% weight on completed sales');
    assert(coldDecision.weightsApplied.kycCompliance === 0.40, 'Cold-start farmers receive 40% weight on verified identity & farm GPS');
    assert(coldDecision.ficoScore >= 500, `Cold-start verified farmer reaches FICO >= 500 (Actual: ${coldDecision.ficoScore})`);

    // Scenario B: Mature Top-Tier Farmer (Gold Tier >= 750)
    const topFarmerRaw = {
      salesFulfillment: 45,       // High sales volume
      listingFrequency: 18,       // Regular variety listings
      reviewBayesian: 4.8,        // Excellent Bayesian rating
      deliveryReliability: 0.98,  // 98% flawless delivery
      networkReach: 180,          // 180 followers
      engagementVelocity: 420,    // High viral engagement
      repaymentIntegrity: 1.0,    // 100% on-time loan repayments
      kycCompliance: 100,         // Complete KYC
    };

    const goldDecision = CreditScoringEngine.computePure(topFarmerRaw, 'gold-farmer-1');
    assert(goldDecision.isColdStart === false, 'Mature farmer with >= 3 sales uses standard Victory Eyong Tabi matrix');
    assert(goldDecision.tier === 'GOLD', `Top farmer qualifies for GOLD tier (Actual: ${goldDecision.tier}, FICO: ${goldDecision.ficoScore})`);
    assert(goldDecision.maxLoanLimitUsd === 10000, 'Gold tier unlocks up to $10,000 USD loan limit');
    assert(goldDecision.autoEscrowDeductionRate === 0.10, 'Gold tier receives preferential 10% auto-escrow deduction rate');
    assert(goldDecision.normalizedRadar.repaymentIntegrity === 100, '100% repayment translates to normalized score of 100');

    // Scenario C: High-Risk Farmer (< 500 FICO - Route A)
    const lowFarmerRaw = {
      salesFulfillment: 4,
      listingFrequency: 1,
      reviewBayesian: 2.2,
      deliveryReliability: 0.40, // High dispute rate
      networkReach: 5,
      engagementVelocity: 10,
      repaymentIntegrity: 0.20, // Defaulted loans
      kycCompliance: 0,
    };

    const lowDecision = CreditScoringEngine.computePure(lowFarmerRaw, 'low-farmer-1');
    assert(lowDecision.route === 'ROUTE_A_PENDING', 'Low score farmer routes to Route A (Locked)');
    assert(lowDecision.maxLoanLimitUsd === 0, 'Route A locks loan features ($0 limit)');
    assert(Boolean(lowDecision.educationalFeedback && lowDecision.educationalFeedback.length > 0), 'Route A generates actionable coaching feedback');
    assert(Boolean(lowDecision.roadmapToNextTier), 'Provides actionable roadmap to reach Bronze tier');
  }

  // -------------------------------------------------------------
  // TEST 3: ENGINE 2 - TIKTOK ALGORITHMIC FEED RANKING ENGINE
  // -------------------------------------------------------------
  console.log('\n▶ [TEST 3] Engine 2: Algorithmic Feed Ranking (TikTok Model)');
  {
    const buyerContext = {
      userId: 'buyer_buea_1',
      deliveryLatitude: 4.1534, // Buea, Cameroon
      deliveryLongitude: 9.2415,
      partnerFarmerIds: ['farmer_partner_foumbot'],
    };

    const now = new Date();
    const candidatePosts = [
      // Post 1: Fresh morning harvest from Mutual AgroPartner, nearby
      {
        id: 'post_partner_near',
        farmerId: 'farmer_partner_foumbot',
        content: 'Fresh morning tomatoes picked at sunrise!',
        mediaUrl: 'https://example.com/tomatoes.mp4',
        isVideo: true,
        likesCount: 50,
        commentsCount: 15,
        sharesCount: 10,
        videoCompletionCount: 25,
        impressionsCount: 80,
        createdAt: now, // 0 hours old
        farmLatitude: 4.1600, // Near Buea (~1 km)
        farmLongitude: 9.2450,
        farmerCreditTier: 'GOLD',
      },
      // Post 2: 3-day old post from unknown farmer far away
      {
        id: 'post_unknown_far_old',
        farmerId: 'farmer_stranger_maroua',
        content: 'Old onion sacks',
        mediaUrl: 'https://example.com/onions.jpg',
        isVideo: false,
        likesCount: 2,
        commentsCount: 0,
        sharesCount: 0,
        videoCompletionCount: 0,
        impressionsCount: 100,
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 72 hours old
        farmLatitude: 10.5973, // Maroua (Far North Cameroon, ~800 km)
        farmLongitude: 14.3159,
        farmerCreditTier: 'BRONZE',
      },
    ];

    const ranked = FeedRankingEngine.rankPosts(candidatePosts, buyerContext);
    assert(ranked[0].postId === 'post_partner_near', 'Fresh Mutual AgroPartner post ranks at top of feed');
    assert(ranked[0].isPartnerBoosted === true, 'Mutual AgroPartner post receives partner affinity boost');
    assert(ranked[0].affinityScore >= 2.5, `Affinity score reflects +2.5x boost (Actual: ${ranked[0].affinityScore})`);
    assert(ranked[0].totalRankScore > ranked[1].totalRankScore * 5, 'Fresh nearby partner post score vastly outperforms old remote post');
    assert(ranked[1].freshnessDecay < 0.1, `72-hour old post suffers significant exponential decay (Actual: ${ranked[1].freshnessDecay})`);
  }

  // -------------------------------------------------------------
  // TEST 4: ENGINE 3 - MULTI-PARTY ESCROW & LEDGER STATE MACHINE
  // -------------------------------------------------------------
  console.log('\n▶ [TEST 4] Engine 3: Escrow FSM & Multi-Party Settlement Ledger');
  {
    // FSM State Transition checks
    assert(EscrowMachine.canTransition('ORDER_CREATED', 'ESCROW_LOCKED') === true, 'FSM permits ORDER_CREATED -> ESCROW_LOCKED');
    assert(EscrowMachine.canTransition('ESCROW_LOCKED', 'IN_TRANSIT') === true, 'FSM permits ESCROW_LOCKED -> IN_TRANSIT');
    assert(EscrowMachine.canTransition('IN_TRANSIT', 'DELIVERED') === true, 'FSM permits IN_TRANSIT -> DELIVERED');
    assert(EscrowMachine.canTransition('DELIVERED', 'ESCROW_RELEASED') === true, 'FSM permits DELIVERED -> ESCROW_RELEASED');

    // Illegal transitions rejection
    assert(EscrowMachine.canTransition('ORDER_CREATED', 'ESCROW_RELEASED') === false, 'FSM strictly blocks illegal jump from ORDER_CREATED to ESCROW_RELEASED');
    assert(EscrowMachine.canTransition('ESCROW_RELEASED', 'DISPUTED') === false, 'FSM strictly blocks transition out of terminal state ESCROW_RELEASED');

    // Dispute path
    assert(EscrowMachine.canTransition('ESCROW_LOCKED', 'DISPUTED') === true, 'FSM permits dispute from ESCROW_LOCKED');
    assert(EscrowMachine.canTransition('DISPUTED', 'ARBITRATION') === true, 'FSM routes dispute to ARBITRATION');
    assert(EscrowMachine.canTransition('ARBITRATION', 'REFUNDED') === true, 'Arbitration can refund buyer');

    // Multi-Party Atomic Ledger Calculation (Section 9.2)
    // Order: Subtotal = 100,000 FCFA, Delivery = 5,000 FCFA, Platform fee = 3.5%, Loan Deduction = 20%
    const settlement = SettlementLedger.computePure(100000, 5000, 0.20, 0.035, 'XAF');
    assert(settlement.grossAmount === 105000, 'Gross amount equals subtotal + delivery (105,000 FCFA)');
    assert(settlement.platformCommission === 3500, '3.5% Platform commission correctly calculated (3,500 FCFA)');
    assert(settlement.transporterFee === 5000, 'Transporter receives 100% of freight fee (5,000 FCFA)');
    assert(settlement.farmerGross === 96500, 'Farmer gross equals subtotal - platform fee (96,500 FCFA)');
    assert(settlement.loanRepaymentDeduction === 19300, '20% loan repayment withheld for microfinance balance (19,300 FCFA)');
    assert(settlement.farmerNetPayout === 77200, 'Farmer net disbursement equals 77,200 FCFA');
    assert(
      settlement.platformCommission + settlement.transporterFee + settlement.loanRepaymentDeduction + settlement.farmerNetPayout === 105000,
      'Multi-party ledger balances perfectly to zero cents loss: Total Outflows == Gross Amount'
    );
  }

  // -------------------------------------------------------------
  // TEST 5: ENGINE 4 - SOCIAL & MUTUAL TRADE GRAPH PRIVILEGES
  // -------------------------------------------------------------
  console.log('\n▶ [TEST 5] Engine 4: Social & Mutual Trade Graph Privileges');
  {
    const mutualPrivileges = SocialGraphEngine.resolvePrivileges(true);
    assert(mutualPrivileges.wholesaleDiscountEligible === true, 'Mutual AgroPartners unlock wholesale pricing gate');
    assert(mutualPrivileges.canDispatchOfferCards === true, 'Mutual AgroPartners unlock direct P2P offer cards');
    assert(mutualPrivileges.storyStreamPriority === true, 'Mutual AgroPartners receive story stream priority');

    const nonPartnerPrivileges = SocialGraphEngine.resolvePrivileges(false);
    assert(nonPartnerPrivileges.wholesaleDiscountEligible === false, 'One-way followers do not unlock wholesale discount');

    // Wholesale Price Calculation (20% partner discount on 50,000 FCFA crate)
    const partnerPrice = SocialGraphEngine.calculatePartnerPrice(50000, true, 0.20);
    assert(partnerPrice.isDiscounted === true, 'Partner price is marked as discounted');
    assert(partnerPrice.price === 40000, '20% discount on 50,000 FCFA crate yields 40,000 FCFA');

    const regularPrice = SocialGraphEngine.calculatePartnerPrice(50000, false);
    assert(regularPrice.price === 50000 && regularPrice.isDiscounted === false, 'Non-partner pays standard retail price 50,000 FCFA');
  }

  // -------------------------------------------------------------
  // TEST 6: ENGINE 5 - TELEMETRY & EVENT INGESTION PIPELINE
  // -------------------------------------------------------------
  console.log('\n▶ [TEST 6] Engine 5: Telemetry Event Ingestion & Aggregation');
  {
    telemetryService.flush();

    // Ingest 4 video watch events
    telemetryService.recordEvent({
      eventType: 'VIDEO_WATCH',
      entityType: 'POST',
      entityId: 'test_post_video_1',
      metadata: { watchDurationSeconds: 28, videoTotalSeconds: 30 }, // 93% completion
    });

    telemetryService.recordEvent({
      eventType: 'VIDEO_WATCH',
      entityType: 'POST',
      entityId: 'test_post_video_1',
      metadata: { watchDurationSeconds: 10, videoTotalSeconds: 30 }, // 33% completion
    });

    telemetryService.recordEvent({
      eventType: 'LIKE',
      entityType: 'POST',
      entityId: 'test_post_video_1',
    });

    telemetryService.recordEvent({
      eventType: 'SHARE',
      entityType: 'POST',
      entityId: 'test_post_video_1',
    });

    const metrics = telemetryService.getEntityMetrics('POST', 'test_post_video_1');
    assert(metrics.likes === 1, 'Telemetry records like count');
    assert(metrics.shares === 1, 'Telemetry records share count');
    assert(metrics.completionCount === 1, 'Telemetry tracks completion count (>=80% watched)');
    assert(metrics.views === 2, 'Telemetry tracks total video view count');
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 ALL 5 ENGINES & CORE INFRASTRUCTURE VALIDATED WITH 100% SUCCESS!');
  } else {
    console.error(`⚠️  ${totalTests - passedTests} TESTS FAILED.`);
    process.exit(1);
  }
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('Unhandled error during test execution:', err);
  process.exit(1);
});
