export interface TradePrivileges {
  wholesaleDiscountEligible: boolean;
  recommendedDiscountPct: number; // e.g. 0.15 - 0.25 (15% - 25%)
  canDispatchOfferCards: boolean;
  storyStreamPriority: boolean;
  activePresenceVisible: boolean;
}

export interface AgroPartnerStatus {
  userId: string;
  targetUserId: string;
  isMutualPartner: boolean;
  userFollowsTarget: boolean;
  targetFollowsUser: boolean;
  privileges: TradePrivileges;
}

export interface P2POfferCard {
  offerId: string;
  buyerId: string;
  farmerId: string;
  yieldId: string;
  proposedQuantity: number;
  proposedUnitPrice: number;
  currency: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED';
  createdAt: Date;
}
