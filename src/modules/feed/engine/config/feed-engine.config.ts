export const FeedEngineConfig = {
  version: 'v1.0.0-tiktok-model',

  // Master Equation Weights: PostRank = (alpha * Affinity + beta * Engagement + gamma * Proximity) * Decay
  alpha: 0.35, // Affinity weight
  beta: 0.40,  // Engagement rate weight
  gamma: 0.25, // Geo-Proximity weight

  // Freshness Exponential Decay: e^(-lambda * t_hours)
  // lambda = 0.05 yields a half-life of ~13.8 hours
  lambda: 0.05,

  // Mutual AgroPartner Affinity Multiplier (Section 8.1)
  partnerAffinityMultiplier: 2.5,

  // Engagement Rate Interaction Weights (Section 8.1)
  engagementWeights: {
    videoCompletion: 5.0, // Video watched >= 80%
    shares: 4.0,
    comments: 3.0,
    likes: 1.0,
  },

  // Proximity reference distance scaling (km)
  // Distance at which proximity score drops to 0.5
  proximityHalfLifeKm: 50,
};
