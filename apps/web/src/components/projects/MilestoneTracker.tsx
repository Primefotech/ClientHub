'use client';

import { CheckCircle2, Circle, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'locked';
  updatedAt?: string;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
}

export function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Project Progress</h3>
          <p className="text-sm text-gray-500 mt-1">Real-time tracking of your project milestones</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-brandbook-50 rounded-full">
          <Clock className="w-4 h-4 text-brandbook-500" />
          <span className="text-xs font-bold text-brandbook-600 uppercase tracking-wider">In Progress</span>
        </div>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-gray-100 -z-0" />
        
        <div className="relative z-10 flex justify-between">
          {milestones.map((milestone, index) => {
            const isCompleted = milestone.status === 'completed';
            const isCurrent = milestone.status === 'current';
            const isLocked = milestone.status === 'locked';

            return (
              <div key={milestone.id} className="flex flex-col items-center group w-full px-2">
                <div 
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-sm",
                    isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                    isCurrent ? "bg-white border-brandbook-500 text-brandbook-600 scale-110" :
                    isLocked ? "bg-gray-50 border-gray-200 text-gray-300" :
                    "bg-white border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-brandbook-500 animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <p 
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-tight transition-colors",
                      isCompleted ? "text-emerald-600" :
                      isCurrent ? "text-brandbook-600" :
                      "text-gray-400"
                    )}
                  >
                    {milestone.label}
                  </p>
                  {isCompleted && milestone.updatedAt && (
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {new Date(milestone.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
