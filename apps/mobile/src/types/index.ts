export type Role = 'STUDENT' | 'PARENT' | 'SECURITY' | 'STAFF' | 'ADMIN';

export type LeaveType =
  | 'DAY_PASS'
  | 'WEEKEND'
  | 'MEDICAL'
  | 'FAMILY_EMERGENCY'
  | 'OFFICIAL_SCHOOL_ACTIVITY'
  | 'OTHER';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  profileId?: string;
}

export interface Student {
  id: string;
  studentIdCode: string;
  firstName: string;
  lastName: string;
  dormitory?: string | null;
}

export interface LeaveApproval {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  comments?: string | null;
  decidedAt: string;
  parent: { firstName: string; lastName: string };
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
  student: Student;
  approvals: LeaveApproval[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}
