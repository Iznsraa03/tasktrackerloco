// ============================================================
// LOCO 21 PRO — TypeScript Interfaces
// Atomic Design: Quarks Level — Pure type definitions
// ============================================================

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Approved' | 'Revisi';
export type TaskType = 'Core' | 'Support' | 'Colaboration' | 'Improvement';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type EmployeeRole = 'Admin' | 'Manager' | 'Karyawan';
export type EmployeeStatus = 'Aktif' | 'Menunggu';
export type ProjectStatus = 'Fix' | 'Pitching' | 'Pending' | 'Cancel';
export type Division = 'Operation' | 'Admin & Finance' | 'Marketing' | 'Creative & Program';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  division: Division;
  jobTitle: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  venue: string;
  status: ProjectStatus;
  projectOfficer: string;
}

export interface Task {
  id: string;
  title: string;
  division: Division;
  project: string;
  assignee: string;
  taskType: TaskType;
  partner: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  date: string;
  fileName: string;
  revisionCount: number;
  completedAt: string | null;
  resultLink: string;
  resultFile: string;
  revisionNotes: string;
  approvedBy: string[];
}

export interface KPIResult {
  totalTask: number;
  taskCompleted: number;
  taskOnTime: number;
  totalRevision: number;
  totalSupportTask: number;
  supportTask: number;
  totalImprovementTask: number;
  improvementTask: number;
  productivityScore: number;
  qualityScore: number;
  disciplineScore: number;
  teamworkScore: number;
  initiativeScore: number;
  kpiScore: number;
  capaian: number;
}

export interface Notification {
  id: string;
  taskId: string;
  type: 'revision' | 'approved' | 'need_approval';
  title: string;
  message: string;
  bgColor: string;
}

export interface ProjectWithStats extends Project {
  tasksInProj: Task[];
  completedTasks: number;
  totalTasks: number;
  progress: number;
  topAchiever: { name: string; completed: number; total: number } | null;
  bottomAchiever: { name: string; completed: number; total: number } | null;
}

export type Page =
  | 'dashboard'
  | 'tasks'
  | 'projects'
  | 'projectDetail'
  | 'calendarTask'
  | 'calendarProject'
  | 'kpi'
  | 'employees';

export interface NewTaskForm {
  division: Division;
  assignee: string;
  project: string;
  title: string;
  description: string;
  taskType: TaskType;
  partner: string;
  date: string;
  fileName: string;
  revisionCount: number;
  completedAt: string | null;
  resultLink: string;
  resultFile: string;
  approvedBy: string[];
}

export interface NewEmployeeForm {
  name: string;
  email: string;
  phone: string;
  division: Division;
  jobTitle: string;
  role: EmployeeRole;
  birthDate: string;
}

export interface NewProjectForm {
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  venue: string;
  status: ProjectStatus;
  projectOfficer: string;
}

export interface ResultSubmission {
  type: 'link' | 'file';
  value: string;
  fileName: string;
}
