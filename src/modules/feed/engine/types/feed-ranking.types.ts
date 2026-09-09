export interface CandidatePost {
  id: string;
  farmerId?: string | null;
  farmId?: string | null;
  userId?: string | null;
  content: string;
  mediaUrl: string;
  isVideo: boolean;
  linkedYieldId?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt?: Date;

  // Optional telemetry and geographical metadata
  impressionsCount?: number;
  sharesCount?: number;
  videoCompletionCount?: number;
  farmLatitude?: number | null;
  farmLongitude?: number | null;
  farmerCreditScore?: number | null;
  farmerCreditTier?: string | null;

  // Joined relations if available
  farm?: any;
  user?: any;
  farmer?: any;
  likes?: any[];
  comments?: any[];
}

export interface UserContext {
  userId?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  partnerFarmerIds?: string[]; // IDs of farmers who are Mutual AgroPartners with this user
  categoryAffinity?: string[];
}

export interface PostRankingScore {
  postId: string;
  totalRankScore: number;
  affinityScore: number;
  engagementRate: number;
  geoProximityScore: number;
  freshnessDecay: number;
  isPartnerBoosted: boolean;
  post: CandidatePost;
}
