'use client';
/**
 * ProjectCard — Project summary card with progress bar
 *
 * @level Molecule
 * @composition Badge + Title + Progress Bar + Stats
 */

import React from 'react';
import { FolderOpen, Building2, Pencil } from 'lucide-react';
import Badge from '../atoms/Badge';
import type { Project, ProjectStatus } from '@/src/types';

interface ProjectCardProps {
  project: Project;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  canEdit?: boolean;
}

export default function ProjectCard({
  project,
  progress,
  completedTasks,
  totalTasks,
  onClick,
  onEdit,
  canEdit = false,
}: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="
        bg-white border border-slate-200/60 shadow-sm rounded-xl p-5 cursor-pointer group
        hover:border-[#D2001A]/30 hover:-translate-y-1
        hover:shadow-[0_0_20px_rgba(210,0,26,0.15)]
        transition-all duration-250
      "
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-[#D2001A]/10 text-[#D2001A] rounded-xl flex items-center justify-center shrink-0">
          <FolderOpen size={20} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status as ProjectStatus}>{project.status}</Badge>
          {canEdit && onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(e); }}
              title="Edit Project"
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#D2001A] hover:bg-[#D2001A]/10 transition-colors"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      <h3 className="font-bold text-slate-800 mb-1 truncate group-hover:text-[#D2001A] transition-colors" title={project.name}>
        {project.name}
      </h3>
      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-5">
        <Building2 size={12} />
        <span className="truncate font-medium">{project.client}</span>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">Progres Tugas ({completedTasks}/{totalTasks})</span>
          <span className="font-bold text-slate-800">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-[#D2001A]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
