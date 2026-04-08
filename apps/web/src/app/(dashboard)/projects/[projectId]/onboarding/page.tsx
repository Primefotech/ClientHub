'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { onboardingApi, globalOnboardingApi } from '@/lib/api';
import { OnboardingForm, OnboardingField } from '@/types';
import { formatRelativeTime, cn } from '@/lib/utils';
import { ClipboardList, Plus, Share2, Edit2, History, ChevronRight, CheckCircle2, Download } from 'lucide-react';

function FormField({ field, response, onUpdate, canEdit }: {
  field: OnboardingField;
  response?: { value?: string; fileUrl?: string };
  onUpdate: (value: string) => void;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(response?.value || '');

  const save = () => {
    onUpdate(value);
    setEditing(false);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400";

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      {field.sectionLabel && (
        <div className="text-xs font-semibold text-brandbook-600 uppercase tracking-wider mb-3 mt-2">
          {field.sectionLabel}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="text-sm font-semibold text-gray-700">{field.label}</label>
            {field.isRequired && <span className="text-red-500 text-xs">*</span>}
          </div>
          {field.helpText && <p className="text-xs text-gray-400 mb-2">{field.helpText}</p>}

          {editing && canEdit ? (
            <div className="space-y-2">
              {field.fieldType === 'TEXTAREA' ? (
                <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} />
              ) : field.fieldType === 'SELECT' ? (
                <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  {field.options?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : field.fieldType === 'CHECKBOX' ? (
                <div className="space-y-1">
                  {field.options?.map((o: any) => (
                    <label key={o} className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={value.includes(o)}
                        onChange={(e) => setValue(e.target.checked ? (value ? `${value},${o}` : o) : value.split(',').filter(v => v !== o).join(','))}
                        className="rounded border-gray-300 text-brandbook-500" />
                      {o}
                    </label>
                  ))}
                </div>
              ) : (
                <input type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : field.fieldType === 'EMAIL' ? 'email' : 'text'}
                  value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} placeholder={field.placeholder} />
              )}
              <div className="flex gap-2">
                <button onClick={save} className="px-3 py-1.5 bg-brandbook-500 text-white text-xs font-medium rounded-lg hover:bg-brandbook-600 transition-colors">Save</button>
                <button onClick={() => { setEditing(false); setValue(response?.value || ''); }} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className={cn('text-sm', response?.value ? 'text-gray-800' : 'text-gray-400 italic')}>
                {response?.value || 'Not filled in yet'}
              </p>
              {canEdit && (
                <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-brandbook-500 transition-colors flex-shrink-0">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const { projectId } = params;
  const qc = useQueryClient();
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});

  const canManage = ['SUPER_ADMIN', 'PROJECT_HEAD'].includes(user?.role || '');
  const canEdit = canManage;

  const { data: forms } = useQuery({
    queryKey: ['onboarding-forms', projectId],
    queryFn: () => onboardingApi.getForms(projectId),
  });

  const { data: selectedFormData } = useQuery({
    queryKey: ['onboarding-form', projectId, selectedForm],
    queryFn: () => onboardingApi.getForm(projectId, selectedForm!),
    enabled: !!selectedForm,
  });

  const { data: globalTemplates } = useQuery({
    queryKey: ['global-onboarding-forms'],
    queryFn: globalOnboardingApi.getForms,
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: () => onboardingApi.createForm(projectId, { projectId, title: newFormTitle, mode: 'PH_FILLED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-forms', projectId] });
      setShowCreate(false);
      setNewFormTitle('');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: { formId: string; responses: any[] }) =>
      onboardingApi.submitResponses(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-form', projectId, selectedForm] }),
  });

  const importMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = globalTemplates?.find((t: any) => t.id === templateId);
      if (!template) return;
      const newForm = await onboardingApi.createForm(projectId, { projectId, title: template.title, mode: 'PH_FILLED' });
      const fields = template.fields || [];
      const promises = fields.map((field: any) => 
        onboardingApi.addField(projectId, newForm.id, {
          label: field.label, fieldType: field.fieldType, placeholder: field.placeholder,
          options: field.options, helpText: field.helpText, isRequired: field.isRequired
        })
      );
      await Promise.all(promises);
      return newForm;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['onboarding-forms', projectId] });
      setShowImport(false);
      // We could select it here, but it's okay just to let it render in the list
    }
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => onboardingApi.publishForm(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-forms', projectId] });
      qc.invalidateQueries({ queryKey: ['onboarding-form', projectId, selectedForm] });
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => onboardingApi.unpublishForm(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-forms', projectId] });
      qc.invalidateQueries({ queryKey: ['onboarding-form', projectId, selectedForm] });
    }
  });

  const deleteFormMutation = useMutation({
    mutationFn: (id: string) => onboardingApi.deleteForm(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-forms', projectId] });
      setSelectedForm(null);
    }
  });

  // Client filtering: If user is client, only show published forms
  const allForms: OnboardingForm[] = Array.isArray(forms) ? forms : [];
  const formList = canManage ? allForms : allForms.filter(f => f.isPublished);
  const currentForm = selectedFormData as any;

  const handleFieldUpdate = (fieldId: string, value: string) => {
    setResponses(r => ({ ...r, [fieldId]: value }));
    saveMutation.mutate({
      formId: selectedForm!,
      responses: [{ fieldId, value }],
    });
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Project Onboarding"
        subtitle="Campaign briefs and client data"
        actions={
          canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 bg-white border border-brandbook-200 text-brandbook-600 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-50 transition-colors"
              >
                <Download className="w-4 h-4" /> Import Template
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Form
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 flex p-6 gap-6 overflow-hidden">
        {/* Forms List */}
        <div className="w-72 flex-shrink-0 space-y-2">
          {formList.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No onboarding forms yet</p>
              {canManage && (
                <button onClick={() => setShowCreate(true)}
                  className="mt-3 text-sm text-brandbook-500 hover:underline">
                  Create first form
                </button>
              )}
            </div>
          ) : (
            formList.map((form) => (
              <button
                key={form.id}
                onClick={() => setSelectedForm(form.id)}
                className={cn(
                  'w-full text-left bg-white rounded-xl border p-4 transition-all',
                  selectedForm === form.id ? 'border-brandbook-300 shadow-sm' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{form.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.mode?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {form.isPublished ? (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Live</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Draft</span>
                    )}
                    <span className="text-xs text-gray-400">{form._count?.responses || 0} responses</span>
                  </div>
                </div>
                {form.shareToken && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-brandbook-500">
                    <Share2 className="w-3 h-3" />
                    <span className="truncate">Shareable link</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Form View */}
        <div className="flex-1 overflow-auto">
          {!selectedForm ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center h-full flex items-center justify-center">
              <div>
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Select a form to view</p>
              </div>
            </div>
          ) : currentForm ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{currentForm.title}</h2>
                    {currentForm.description && (
                      <p className="text-sm text-gray-500 mt-1">{currentForm.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentForm.shareToken && (
                      <button className="flex items-center gap-1.5 text-sm text-brandbook-600 hover:underline">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this form?')) {
                             deleteFormMutation.mutate(currentForm.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 text-sm ml-2"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    currentForm.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                    {currentForm.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-gray-500">{currentForm.mode?.replace('_', ' ')}</span>
                  
                  {canManage && (
                    <button
                      onClick={() => {
                        if (currentForm.isPublished) unpublishMutation.mutate(currentForm.id);
                        else publishMutation.mutate(currentForm.id);
                      }}
                      disabled={publishMutation.isPending || unpublishMutation.isPending}
                      className="ml-auto text-xs text-brandbook-600 font-semibold hover:underline"
                    >
                      {currentForm.isPublished ? 'Revert to Draft' : 'Publish to Client'}
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="px-6">
                {currentForm.fields?.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No fields added yet.
                    {canManage && ' Add fields to create the form.'}
                  </div>
                ) : (
                  currentForm.fields?.map((field: OnboardingField) => {
                    const fieldResponse = currentForm.responses?.find((r: any) => r.fieldId === field.id);
                    return (
                      <FormField
                        key={field.id}
                        field={field}
                        response={fieldResponse}
                        onUpdate={(value) => handleFieldUpdate(field.id, value)}
                        canEdit={canEdit}
                      />
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Onboarding Form</h2>
            <input value={newFormTitle} onChange={(e) => setNewFormTitle(e.target.value)}
              placeholder="Form title (e.g. Campaign Brief)"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => createMutation.mutate()} disabled={!newFormTitle.trim()}
                className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                Create
              </button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Global Template</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {!globalTemplates || globalTemplates.length === 0 ? (
                <p className="text-center py-4 text-gray-500 text-sm">No global templates available</p>
              ) : (
                globalTemplates.map((template: any) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold">{template.title}</p>
                      <p className="text-xs text-gray-500">{template.fields?.length} fields</p>
                    </div>
                    <button
                       onClick={() => importMutation.mutate(template.id)}
                       disabled={importMutation.isPending}
                       className="px-3 py-1.5 bg-brandbook-100 text-brandbook-700 text-xs font-semibold rounded hover:bg-brandbook-200"
                    >
                      {importMutation.isPending ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowImport(false)}
              className="w-full py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
