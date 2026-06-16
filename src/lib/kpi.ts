// ============================================================
// LOCO 21 PRO — KPI Calculation Utilities (Lib Layer)
// Pure functions — no side effects, no UI dependencies
// ============================================================

import type { Task, Employee, KPIResult } from '@/src/types';

/** Determine KPI period month from task date.
 * Tasks dated 1-4 of a month count toward the previous period. */
export function getPeriodMonth(dateString: string): string | null {
  if (!dateString) return null;
  const [, m, d] = dateString.split('-').map(Number);
  if (d <= 4) {
    const prevM = m - 1 === 0 ? 12 : m - 1;
    return String(prevM).padStart(2, '0');
  }
  return String(m).padStart(2, '0');
}

/** Calculate KPI score for a single employee filtered by month. */
export function calculateKPI(
  emp: Employee,
  allTasks: Task[],
  monthFilter: string
): KPIResult {
  const empTasks = allTasks.filter(
    (t) => t.assignee === emp.name || t.partner === emp.name
  );
  const periodTasks = empTasks.filter(
    (t) => monthFilter === 'all' || getPeriodMonth(t.date) === monthFilter
  );

  const totalTask = periodTasks.length;
  const taskCompletedList = periodTasks.filter((t) => t.status === 'Approved' || t.status === 'Done');
  const taskCompleted = taskCompletedList.length;
  const taskOnTime = taskCompletedList.filter(
    (t) => t.status === 'Approved' && t.completedAt && t.completedAt <= t.date
  ).length;
  const totalRevision = periodTasks.reduce(
    (acc, t) => acc + (t.revisionCount || 0),
    0
  );

  const totalSupportTask = periodTasks.filter(
    (t) => t.taskType === 'Support' || t.taskType === 'Colaboration'
  ).length;
  const totalImprovementTask = periodTasks.filter(
    (t) => t.taskType === 'Improvement'
  ).length;

  const supportTask = taskCompletedList.filter(
    (t) => t.taskType === 'Support' || t.taskType === 'Colaboration'
  ).length;
  const improvementTask = taskCompletedList.filter(
    (t) => t.taskType === 'Improvement'
  ).length;

  const productivityScore =
    taskCompleted === 0 || totalTask === 0
      ? 0
      : Math.min(10, (taskCompleted / totalTask) * 10);
  const qualityScore =
    taskCompleted === 0
      ? 0
      : Math.max(1, 10 - totalRevision / taskCompleted);
  const disciplineScore =
    taskCompleted === 0 ? 0 : (taskOnTime / taskCompleted) * 10;
  const teamworkScore =
    totalSupportTask === 0 ? 0 : (supportTask / totalSupportTask) * 10;
  const initiativeScore =
    totalImprovementTask === 0
      ? 0
      : (improvementTask / totalImprovementTask) * 10;

  const kpiScore =
    productivityScore * 0.4 +
    qualityScore * 0.2 +
    disciplineScore * 0.3 +
    teamworkScore * 0.05 +
    initiativeScore * 0.05;
  const capaian = kpiScore * 10;

  return {
    totalTask,
    taskCompleted,
    taskOnTime,
    totalRevision,
    totalSupportTask,
    supportTask,
    totalImprovementTask,
    improvementTask,
    productivityScore,
    qualityScore,
    disciplineScore,
    teamworkScore,
    initiativeScore,
    kpiScore,
    capaian,
  };
}
