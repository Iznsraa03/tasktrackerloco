'use client';
/**
 * ProjectsPage — Project list with management (Admin/Manager)
 *
 * @level Organism
 */

import React from 'react';
import { Plus } from 'lucide-react';
import ProjectCard from '../molecules/ProjectCard';
import Button from '../atoms/Button';
import type { Project, Task, Employee } from '@/src/types';

interface ProjectsPageProps {
  projects: Project[];
  tasks: Task[];
  currentUser: Employee;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onViewProject: (project: Project) => void;
}

export default function ProjectsPage({
  projects,
  tasks,
  currentUser,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onViewProject,
}: ProjectsPageProps) {
  const canEdit = currentUser.role === 'Admin' || currentUser.role === 'Manager';

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Daftar Project</h1>
          <p className="text-sm text-slate-500 mt-1">{projects.length} project terdaftar</p>
        </div>
        {canEdit && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={onAddProject}>
            Tambah Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const projTasks = tasks.filter((t) => t.project === proj.name);
          const completed = projTasks.filter((t) => t.status === 'Approved').length;
          const progress = projTasks.length === 0 ? 0 : Math.round((completed / projTasks.length) * 100);
          return (
            <ProjectCard
              key={proj.id}
              project={proj}
              progress={progress}
              completedTasks={completed}
              totalTasks={projTasks.length}
              onClick={() => onViewProject(proj)}
              onEdit={(e) => { e.stopPropagation(); onEditProject(proj); }}
              onDelete={(e) => { e.stopPropagation(); onDeleteProject(proj); }}
              canEdit={canEdit}
            />
          );
        })}
      </div>
    </div>
  );
}
