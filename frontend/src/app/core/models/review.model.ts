export interface ReviewCustomerSummary {
  id: string;
  name: string;
}

export interface ReviewShopSummary {
  id: string;
  shopName: string;
}

export interface Review {
  id: string;
  serviceRequestId: string;
  customer: ReviewCustomerSummary | null;
  shop: ReviewShopSummary | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  review: Review;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}
