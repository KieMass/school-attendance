export type Role = 'STUDENT' | 'PARENT' | 'SECURITY' | 'STAFF' | 'ADMIN';

export type LeaveType =
  | 'DAY_PASS'
  | 'WEEKEND'
  | 'MEDICAL'
  | 'FAMILY_EMERGENCY'
  | 'OFFICIAL_SCHOOL_ACTIVITY'
  | 'OTHER';

export type LeaveRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ExitStatus = 'EXITED' | 'RETURNED' | 'OVERDUE';

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  profileId?: string;
  mustChangePassword?: boolean;
}

export interface Student {
  id: string;
  studentIdCode: string;
  firstName: string;
  lastName: string;
  dormitory?: string | null;
  gradeLevel?: string | null;
  photoUrl?: string | null;
  user?: { email: string | null };
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  relationship?: string | null;
  user?: { email: string | null };
}

export interface LeaveApproval {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  comments?: string | null;
  decidedAt: string;
  parent: Parent;
}

export interface ExitLog {
  id: string;
  exitAt: string;
  gateLocation?: string | null;
  status: ExitStatus;
  securityOfficer?: { firstName: string; lastName: string };
}

export interface ReturnLog {
  id: string;
  returnAt: string;
  wasLate: boolean;
  minutesLate?: number | null;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  leaveType: LeaveType;
  reason: string;
  destination: string;
  leaveDate: string;
  departureTime: string;
  expectedReturnTime: string;
  additionalNotes?: string | null;
  status: LeaveRequestStatus;
  createdAt: string;
  resolvedAt?: string | null;
  student: Student;
  approvals: LeaveApproval[];
  qrTokens?: { id: string; status: string; expiresAt: string }[];
  exitLog?: ExitLog | null;
  returnLog?: ReturnLog | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardCounts {
  pending: number;
  approved: number;
  offCampus: number;
  overdue: number;
  returnedToday: number;
}
