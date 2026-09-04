export type Role = 'A' | 'B';

export interface Profile {
  id: string;
  display_name: string;
}

export type CoupleStatus = 'waiting' | 'paired' | 'disbanded';

export interface Couple {
  id: string;
  status: CoupleStatus;
  created_at: string;
  paired_at: string | null;
  updated_at: string;
}

export interface CoupleMember {
  couple_id: string;
  user_id: string;
  role: Role;
}
