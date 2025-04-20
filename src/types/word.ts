export interface Word {
  id: string;
  english: string;
  turkish: string;
  example: string;
  level: number;
  lastReviewed?: Date;
  nextReview?: Date;
  isLearned?: boolean;
} 