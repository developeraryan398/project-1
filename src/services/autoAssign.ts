import { ComplaintCategory, Department } from '../types';

export interface DepartmentMapping {
  departmentId: string;
  departmentName: string;
  defaultSlaHours: {
    High: number;
    Medium: number;
    Low: number;
  };
}

export const CATEGORY_DEPARTMENT_MAP: Record<ComplaintCategory, { id: string; name: string }> = {
  Electricity: { id: 'dept-electrical', name: 'Electrical Department' },
  Plumbing: { id: 'dept-plumbing', name: 'Plumbing Department' },
  'Water Leakage': { id: 'dept-plumbing', name: 'Plumbing Department' },
  'Washroom Cleaning': { id: 'dept-housekeeping', name: 'Housekeeping Department' },
  'Room Cleaning': { id: 'dept-housekeeping', name: 'Housekeeping Department' },
  'AC and Cooling': { id: 'dept-ac', name: 'AC Maintenance Department' },
  'Furniture and Broken Benches': { id: 'dept-furniture', name: 'Furniture Maintenance Department' },
  'Internet and Wi-Fi': { id: 'dept-it', name: 'IT Support Department' },
  'Hostel Maintenance': { id: 'dept-general', name: 'General Maintenance Department' },
  'Other Issues': { id: 'dept-general', name: 'General Maintenance Department' },
};

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    departmentId: 'dept-electrical',
    name: 'Electrical Department',
    code: 'ELEC',
    categories: ['Electricity'],
    staffIds: ['staff-rajesh'],
    headName: 'Er. R. K. Saxena',
    headEmail: 'electrical.head@campusfix.edu',
    slaHoursUrgent: 2,
    slaHoursHigh: 6,
    slaHoursMedium: 18,
    slaHoursLow: 36,
  },
  {
    departmentId: 'dept-plumbing',
    name: 'Plumbing Department',
    code: 'PLUMB',
    categories: ['Plumbing', 'Water Leakage'],
    staffIds: ['staff-suresh'],
    headName: 'Mr. Manoj Joshi',
    headEmail: 'plumbing.head@campusfix.edu',
    slaHoursUrgent: 2,
    slaHoursHigh: 4,
    slaHoursMedium: 16,
    slaHoursLow: 32,
  },
  {
    departmentId: 'dept-housekeeping',
    name: 'Housekeeping Department',
    code: 'HOUSEKEEP',
    categories: ['Washroom Cleaning', 'Room Cleaning'],
    staffIds: ['staff-anita'],
    headName: 'Mrs. Sunita Deshmukh',
    headEmail: 'housekeeping.head@campusfix.edu',
    slaHoursUrgent: 1,
    slaHoursHigh: 3,
    slaHoursMedium: 8,
    slaHoursLow: 24,
  },
  {
    departmentId: 'dept-ac',
    name: 'AC Maintenance Department',
    code: 'HVAC',
    categories: ['AC and Cooling'],
    staffIds: ['staff-amit-hvac'],
    headName: 'Er. Vikas Pandey',
    headEmail: 'hvac.head@campusfix.edu',
    slaHoursUrgent: 3,
    slaHoursHigh: 8,
    slaHoursMedium: 24,
    slaHoursLow: 48,
  },
  {
    departmentId: 'dept-furniture',
    name: 'Furniture Maintenance Department',
    code: 'FURN',
    categories: ['Furniture and Broken Benches'],
    staffIds: ['staff-ramesh-furn'],
    headName: 'Mr. Dilip Verma',
    headEmail: 'furniture.head@campusfix.edu',
    slaHoursUrgent: 4,
    slaHoursHigh: 12,
    slaHoursMedium: 36,
    slaHoursLow: 72,
  },
  {
    departmentId: 'dept-it',
    name: 'IT Support Department',
    code: 'IT',
    categories: ['Internet and Wi-Fi'],
    staffIds: ['staff-amit-it'],
    headName: 'Prof. Anirudh Sen',
    headEmail: 'itsupport.head@campusfix.edu',
    slaHoursUrgent: 2,
    slaHoursHigh: 4,
    slaHoursMedium: 12,
    slaHoursLow: 24,
  },
  {
    departmentId: 'dept-general',
    name: 'General Maintenance Department',
    code: 'GEN',
    categories: ['Hostel Maintenance', 'Other Issues'],
    staffIds: ['staff-suresh', 'staff-rajesh'],
    headName: 'Col. Sanjeev Nair (Retd.)',
    headEmail: 'estate.head@campusfix.edu',
    slaHoursUrgent: 3,
    slaHoursHigh: 12,
    slaHoursMedium: 24,
    slaHoursLow: 48,
  },
];

/**
 * Returns automatically routed department ID and name based on category
 */
export function getAutoRoutedDepartment(category: ComplaintCategory): { departmentId: string; departmentName: string } {
  const match = CATEGORY_DEPARTMENT_MAP[category];
  if (match) {
    return { departmentId: match.id, departmentName: match.name };
  }
  return { departmentId: 'dept-general', departmentName: 'General Maintenance Department' };
}

/**
 * Calculate complaint deadline according to priority and department SLA
 */
export function calculateDueDate(priority: 'Low' | 'Medium' | 'High' | 'Urgent', departmentId: string, departments = INITIAL_DEPARTMENTS): string {
  const dept = departments.find((d) => d.departmentId === departmentId);
  let hours = 24;
  if (priority === 'Urgent') {
    hours = dept?.slaHoursUrgent ?? 2;
  } else if (priority === 'High') {
    hours = dept?.slaHoursHigh ?? 6;
  } else if (priority === 'Medium') {
    hours = dept?.slaHoursMedium ?? 24;
  } else {
    hours = dept?.slaHoursLow ?? 48;
  }
  const now = new Date();
  const dueDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return dueDate.toISOString();
}

/**
 * Generates human-friendly unique complaint ID: CF-YYYY-XXXX
 */
export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CF-${year}-${randomSuffix}`;
}
