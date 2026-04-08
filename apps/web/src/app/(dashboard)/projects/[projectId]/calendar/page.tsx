'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { calendarApi } from '@/lib/api';
import { CalendarEvent } from '@/types';
import { STATUS_COLORS, cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', platform: '', startDate: '', endDate: '' });

  const canAdd = ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF'].includes(user?.role || '');

  const { data: events } = useQuery({
    queryKey: ['calendar', projectId, year, month],
    queryFn: () => calendarApi.getMonthView(projectId, year, month + 1),
  });

  const addMutation = useMutation({
    mutationFn: (dto: any) => calendarApi.createEvent(projectId, { ...dto, projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', projectId] });
      setShowAdd(false);
    },
  });

  const eventList: CalendarEvent[] = Array.isArray(events) ? events : [];

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventList.filter((e) => e.startDate.startsWith(dateStr));
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Content Calendar"
        subtitle={`${MONTHS[month]} ${year}`}
        actions={
          canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          )
        }
      />

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-100 bg-gray-50/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

              return (
                <div
                  key={day}
                  className="min-h-[100px] border-r border-b border-gray-100 p-2 hover:bg-gray-50 transition-colors"
                  onClick={() => { setSelectedDay(day); setShowAdd(true); setNewEvent(n => ({ ...n, startDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` })); }}
                >
                  <div className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1',
                    isToday ? 'bg-brandbook-500 text-white' : 'text-gray-700',
                  )}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="text-xs px-2 py-0.5 rounded truncate font-medium"
                        style={{
                          backgroundColor: e.color ? `${e.color}20` : '#e0e7ff',
                          color: e.color || '#4f46e5',
                        }}
                        onClick={(ev) => ev.stopPropagation()}
                        title={e.title}
                      >
                        {e.creative?.thumbnailUrl && (
                          <img src={e.creative.thumbnailUrl} alt="" className="w-3 h-3 rounded inline-block mr-1" />
                        )}
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-gray-400">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {eventList.reduce((acc, e) => {
            if (e.platform && !acc.includes(e.platform)) acc.push(e.platform);
            return acc;
          }, [] as string[]).map((platform) => (
            <div key={platform} className="flex items-center gap-1.5 text-sm text-gray-600">
              <div className="w-3 h-3 rounded-sm bg-brandbook-200" />
              {platform}
            </div>
          ))}
        </div>

        {/* Add Event Modal */}
        {showAdd && canAdd && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Calendar Event</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                    placeholder="Event title" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" value={newEvent.startDate} onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <select value={newEvent.platform} onChange={(e) => setNewEvent({ ...newEvent, platform: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                      <option value="">All</option>
                      {['Instagram', 'Facebook', 'Google', 'Twitter', 'LinkedIn', 'TikTok'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => addMutation.mutate(newEvent)} disabled={!newEvent.title || !newEvent.startDate}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                  Add Event
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
