'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { globalOnboardingApi } from '@/lib/api';
import { ClipboardList, Plus, Edit2, Share2, PlusCircle, Users, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingForm, OnboardingField } from '@/types';

function FieldBuilder({ formId, fields = [] }: { formId: string, fields: OnboardingField[] }) {
  const qc = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [newField, setNewField] = useState<Partial<OnboardingField>>({
    label: '', fieldType: 'TEXT', isRequired: false, placeholder: '', helpText: '', options: [],
  });

  const addFieldMutation = useMutation({
    mutationFn: (data: any) => globalOnboardingApi.addField(formId, {
      ...data,
      options: typeof data.options === 'string' ? data.options.split(',').map((s: string) => s.trim()).filter(Boolean) : data.options,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-onboarding-forms'] });
      setShowBuilder(false);
      setNewField({ label: '', fieldType: 'TEXT', isRequired: false, placeholder: '', helpText: '', options: [] });
    },
  });

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Template Fields</h3>
        <button onClick={() => setShowBuilder(true)} className="text-sm text-brandbook-600 font-medium hover:text-brandbook-700 flex items-center gap-1">
          <PlusCircle className="w-4 h-4" /> Add Field
        </button>
      </div>

      <div className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No fields in this template yet.</p>
        ) : (
          fields.map((field, idx) => (
            <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 relative">
              <span className="absolute -left-2 -top-2 w-5 h-5 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{field.label} {field.isRequired && <span className="text-red-500">*</span>}</p>
                  <p className="text-xs text-gray-500 mt-1">Type: <span className="font-medium text-brandbook-600">{field.fieldType}</span></p>
                  {field.options && field.options.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Options: {field.options.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showBuilder && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-blue-900 mb-3 uppercase tracking-wider">New Field</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-blue-800 mb-1">Label *</label>
                <input value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} className="w-full px-2 py-1.5 focus:ring-blue-400 border border-gray-300 rounded text-sm" placeholder="Field name" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-blue-800 mb-1">Field Type</label>
                <select value={newField.fieldType} onChange={e => setNewField({ ...newField, fieldType: e.target.value as any })} className="w-full px-2 py-1.5 focus:ring-blue-400 border border-gray-300 rounded text-sm bg-white">
                  <option value="TEXT">Text (Short)</option>
                  <option value="TEXTAREA">Textarea (Long)</option>
                  <option value="NUMBER">Number</option>
                  <option value="EMAIL">Email</option>
                  <option value="DATE">Date</option>
                  <option value="SELECT">Dropdown (Select)</option>
                  <option value="CHECKBOX">Checkbox (Multiple choice)</option>
                  <option value="RADIO">Radio (Single choice)</option>
                </select>
              </div>
            </div>
            {['SELECT', 'CHECKBOX', 'RADIO'].includes(newField.fieldType || '') && (
              <div>
                <label className="block text-[11px] font-semibold text-blue-800 mb-1">Options (Comma separated)</label>
                <input value={newField.options as any} onChange={e => setNewField({ ...newField, options: e.target.value as any })} className="w-full px-2 py-1.5 focus:ring-blue-400 border border-gray-300 rounded text-sm" placeholder="Option 1, Option 2, Option 3" />
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-1.5 text-sm text-blue-900">
                <input type="checkbox" checked={!!newField.isRequired} onChange={e => setNewField({ ...newField, isRequired: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Required field
              </label>
            </div>
            <div className="flex gap-2 mt-2">
              <button disabled={!newField.label} onClick={() => addFieldMutation.mutate(newField)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">Create Field</button>
              <button onClick={() => setShowBuilder(false)} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOnboardingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');

  const { data: forms } = useQuery({
    queryKey: ['global-onboarding-forms'],
    queryFn: globalOnboardingApi.getForms,
  });

  const createMutation = useMutation({
    mutationFn: (mode: 'CLIENT_FILLED' | 'PH_FILLED') => globalOnboardingApi.createForm({ title: newFormTitle, mode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-onboarding-forms'] });
      setShowCreate(false);
      setNewFormTitle('');
    },
  });

  const formList: OnboardingForm[] = Array.isArray(forms) ? forms : [];
  const clientForms = formList.filter(f => f.mode === 'CLIENT_FILLED');
  const projectForms = formList.filter(f => f.mode === 'PH_FILLED');
  const currentForm = selectedForm ? formList.find(f => f.id === selectedForm) : null;

  const renderFormList = (list: OnboardingForm[], title: string, icon: React.ReactNode) => (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 flex items-center gap-1.5">
        {icon} {title}
      </p>
      {list.length === 0 ? (
        <div className="bg-white/50 rounded-xl border border-dashed border-gray-200 p-4 text-center">
          <p className="text-[10px] text-gray-400 italic">No {title.toLowerCase()} templates</p>
        </div>
      ) : (
        list.map((form) => (
          <button
            key={form.id}
            onClick={() => setSelectedForm(form.id)}
            className={cn(
              'w-full text-left bg-white rounded-xl border p-4 transition-all group relative overflow-hidden',
              selectedForm === form.id 
                ? 'border-brandbook-300 shadow-sm ring-1 ring-brandbook-500/10' 
                : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
            )}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-gray-50/50 -mr-8 -mt-8 rounded-full pointer-events-none" />
            <p className="text-sm font-bold text-gray-900 truncate">{form.title}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">{form.fields?.length || 0} fields defined</p>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-auto bg-[#f8fafc]">
      <Header
        user={user!}
        title="Template Center"
        subtitle="Manage global intake and operational project structures"
        actions={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-brandbook-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brandbook-600 shadow-sm transition-all active:scale-95">
            <Plus className="w-4 h-4" /> New Template
          </button>
        }
      />

      <div className="flex-1 flex p-6 gap-8 overflow-hidden max-w-[1400px] mx-auto w-full">
        {/* Templates List */}
        <div className="w-80 flex-shrink-0 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
          {renderFormList(clientForms, "Client Intake Forms", <Users className="w-3 h-3" />)}
          {renderFormList(projectForms, "Project Templates", <FolderKanban className="w-3 h-3" />)}
        </div>

        {/* Form View & Builder */}
        <div className="flex-1 overflow-auto">
          {!currentForm ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center h-full flex items-center justify-center">
              <div>
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Select a template to configure</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{currentForm.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">Configure the fields for this template below.</p>
                </div>
              </div>
              
              <FieldBuilder formId={currentForm.id} fields={currentForm.fields || []} />
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Create Template</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Template Title</label>
            <input 
              value={newFormTitle} 
              onChange={(e) => setNewFormTitle(e.target.value)}
              placeholder="e.g. Standard Briefing"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all mb-6" 
            />
            
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Select Template Type</p>
            <div className="grid grid-cols-1 gap-3 mb-8">
              <button 
                onClick={() => createMutation.mutate('CLIENT_FILLED')}
                disabled={!newFormTitle.trim() || createMutation.isPending}
                className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:bg-brandbook-50 hover:border-brandbook-200 transition-all text-left"
              >
                <div className="w-10 h-10 bg-brandbook-100 text-brandbook-600 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Client Intake Form</p>
                  <p className="text-[10px] text-gray-500">For external clients to fill out</p>
                </div>
              </button>
              
              <button 
                onClick={() => createMutation.mutate('PH_FILLED')}
                disabled={!newFormTitle.trim() || createMutation.isPending}
                className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:bg-brandbook-50 hover:border-brandbook-200 transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Project Template</p>
                  <p className="text-[10px] text-gray-500">Internal operational requirements</p>
                </div>
              </button>
            </div>
            
            <button 
              onClick={() => setShowCreate(false)}
              className="w-full py-3 bg-gray-50 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
