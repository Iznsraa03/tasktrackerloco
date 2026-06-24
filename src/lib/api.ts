// ============================================================
// LOCO 21 PRO — API Client Layer (Axios)
// Skill: axios (SKILL.md — Custom Instance + Interceptors)
// Semua operasi CRUD menggunakan axiosInstance → /api/* route handlers
// Auth session tetap menggunakan localStorage (no server session needed)
// ============================================================

import axiosInstance from './axios';
import type { Employee, Project, Task } from '@/src/types';

const STORAGE_KEYS = {
  authEmail: 'loco21_auth_v1_email',
  authLoggedIn: 'loco21_auth_v1_loggedin',
} as const;

// ─── Employees ───────────────────────────────────────────────

async function getEmployees(): Promise<Employee[]> {
  const res = await axiosInstance.get<Employee[]>('/employees');
  return res.data;
}

async function createEmployee(data: Omit<Employee, 'id' | 'status'>): Promise<Employee> {
  const res = await axiosInstance.post<Employee>('/employees', data);
  return res.data;
}

async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
  const res = await axiosInstance.put<Employee>(`/employees/${id}`, data);
  return res.data;
}

async function deleteEmployee(id: string): Promise<void> {
  await axiosInstance.delete(`/employees/${id}`);
}

// ─── Projects ────────────────────────────────────────────────

async function getProjects(): Promise<Project[]> {
  const res = await axiosInstance.get<Project[]>('/projects');
  return res.data;
}

async function createProject(data: Omit<Project, 'id'>): Promise<Project> {
  const res = await axiosInstance.post<Project>('/projects', data);
  return res.data;
}

async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const res = await axiosInstance.put<Project>(`/projects/${id}`, data);
  return res.data;
}

async function deleteProject(id: string): Promise<void> {
  await axiosInstance.delete(`/projects/${id}`);
}

// ─── Tasks ───────────────────────────────────────────────────

async function getTasks(): Promise<Task[]> {
  const res = await axiosInstance.get<Task[]>('/tasks');
  return res.data;
}

async function createTask(data: Partial<Task>): Promise<Task> {
  const res = await axiosInstance.post<Task>('/tasks', data);
  return res.data;
}

async function bulkCreateTasks(rows: any[]): Promise<{ success: number; errors: string[]; createdTasks: Task[] }> {
  const res = await axiosInstance.post<{ success: number; errors: string[]; createdTasks: Task[] }>('/tasks/bulk', rows, {
    timeout: 60000, // 60 seconds for bulk imports
  });
  return res.data;
}

async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const res = await axiosInstance.put<Task>(`/tasks/${id}`, data);
  return res.data;
}

async function deleteTask(id: string): Promise<void> {
  await axiosInstance.delete(`/tasks/${id}`);
}

// ─── Bootstrap (one-shot load) ───────────────────────────────

async function bootstrap(): Promise<{
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
}> {
  const res = await axiosInstance.get<{
    employees: Employee[];
    projects: Project[];
    tasks: Task[];
  }>('/bootstrap');
  return res.data;
}

// ─── Auth (localStorage-based session) ───────────────────────

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Public API object ───────────────────────────────────────

export const api = {
  bootstrap,

  employees: {
    getAll: getEmployees,
    create: createEmployee,
    update: updateEmployee,
    remove: deleteEmployee,
  },

  projects: {
    getAll: getProjects,
    create: createProject,
    update: updateProject,
    remove: deleteProject,
  },

  tasks: {
    getAll: getTasks,
    create: createTask,
    bulkCreate: bulkCreateTasks,
    update: updateTask,
    remove: deleteTask,
  },

  auth: {
    getEmail(): string {
      return getStorage<string>(STORAGE_KEYS.authEmail, '');
    },
    getLoggedIn(): boolean {
      return getStorage<boolean>(STORAGE_KEYS.authLoggedIn, false);
    },
    save(email: string, loggedIn: boolean): void {
      setStorage(STORAGE_KEYS.authEmail, email);
      setStorage(STORAGE_KEYS.authLoggedIn, loggedIn);
    },
    clear(): void {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(STORAGE_KEYS.authEmail);
      localStorage.removeItem(STORAGE_KEYS.authLoggedIn);
    },
  },
};

export default api;
