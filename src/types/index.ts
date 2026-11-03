export type UserRole = 'student' | 'staff' | 'admin';

export type ComplaintCategory =
  | 'Electricity'
  | 'Plumbing'
  | 'Water Leakage'
  | 'Washroom Cleaning'
  | 'Room Cleaning'
  | 'AC and Cooling'
  | 'Furniture and Broken Benches'
  | 'Hostel Maintenance'
  | 'Internet and Wi-Fi'
  | 'Other Issues';

export type ComplaintStatus =
  | 'Submitted'
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Resolved'
  | 'Verified'
  | 'Reopened'
  | 'Rejected';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface LocationInfo {
  campusArea: 'Hostel' | 'Academic Block' | 'Lab Complex' | 'Library' | 'Cafeteria' | 'Sports Complex' | 'Other';
  building: string;
  floor: string;
  roomNumber: string;
  specificSpot?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string; // For staff members
  departmentName?: string;
  phone?: string;
  rollNumber?: string; // For students
  hostelInfo?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Department {
  departmentId: string;
  name: string;
  code: string;
  categories: ComplaintCategory[];
  staffIds: string[];
  headName: string;
  headEmail: string;
  slaHoursUrgent?: number;
  slaHoursHigh: number;
  slaHoursMedium: number;
  slaHoursLow: number;
}

export interface EscalationRecord {
  escalatedAt: string;
  reason: string;
  triggeredBy: string;
  hoursOverdue?: number;
  notifiedRoles?: string[];
}

export interface Complaint {
  complaintId: string; // e.g. CF-2026-8492
  title: string;
  description: string;
  category: ComplaintCategory;
  location: LocationInfo;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  departmentId: string;
  departmentName: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  imageUrls: string[];
  resolutionNote?: string;
  resolutionImageUrls?: string[];
  reopenReason?: string;
  dueAt: string; // ISO date string
  isOverdue?: boolean;
  escalatedToManagement?: boolean;
  escalatedAt?: string;
  escalationHistory?: EscalationRecord[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  verifiedAt?: string;
}

export interface ActivityLog {
  logId: string;
  complaintId: string;
  action: string;
  oldStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  updatedBy: string;
  updatedByUid?: string; // Authenticated User ID
  updatedByRole: UserRole;
  timestamp: string;
  note?: string;
}

export interface NotificationItem {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  complaintId?: string;
  read: boolean;
  timestamp: string;
  type?: 'status_update' | 'assignment' | 'escalation' | 'feedback_request' | 'system' | 'general';
}

export interface ComplaintFeedback {
  feedbackId: string;
  complaintId: string;
  studentId: string;
  studentName: string;
  rating: number; // 1-5
  comment: string;
  aspects?: {
    timeliness: number;
    cleanliness: number;
    staffBehavior: number;
  };
  createdAt: string;
}
