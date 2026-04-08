'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { settingsApi } from '@/lib/api';
import { Settings, Save, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function GlobalSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: settingsApi.getAll,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) => settingsApi.updateAll(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['global-settings'] }),
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Global Settings"
        subtitle="Manage platform-wide configurations"
      />

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Platform Preferences</h2>
                <p className="text-sm text-gray-500">Configure global limits and generic defaults</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading settings...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData?.['COMPANY_NAME'] || ''}
                    onChange={(e) => handleChange('COMPANY_NAME', e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={formData?.['SUPPORT_EMAIL'] || ''}
                    onChange={(e) => handleChange('SUPPORT_EMAIL', e.target.value)}
                    placeholder="support@example.com"
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={formData?.['DEFAULT_TIMEZONE'] || 'UTC'}
                    onChange={(e) => handleChange('DEFAULT_TIMEZONE', e.target.value)}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 block bg-white"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                  <select
                    value={formData?.['DEFAULT_CURRENCY'] || 'USD'}
                    onChange={(e) => handleChange('DEFAULT_CURRENCY', e.target.value)}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 block bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Logo URL</label>
                  <input
                    type="text"
                    value={formData?.['LOGO_URL'] || ''}
                    onChange={(e) => handleChange('LOGO_URL', e.target.value)}
                    placeholder="https://..."
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                  {formData?.['LOGO_URL'] && (
                    <div className="mt-2 p-2 border border-gray-100 rounded-lg bg-gray-50 inline-block">
                      <img src={formData['LOGO_URL']} alt="Logo Preview" className="h-8 object-contain" />
                    </div>
                  )}
                </div>
                
                <hr className="border-gray-100 my-6" />
                
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Module Visibility (Global)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'ENABLE_CRM', label: 'CRM Leads' },
                    { key: 'ENABLE_CALENDAR', label: 'Content Calendar' },
                    { key: 'ENABLE_REPORTS', label: 'Ad Reporting' },
                    { key: 'ENABLE_ONBOARDING', label: 'Onboarding System' },
                  ].map(mod => (
                    <label key={mod.key} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData?.[mod.key] === 'true'} 
                        onChange={(e) => handleChange(mod.key, e.target.checked.toString())}
                        className="rounded border-gray-300 text-brandbook-500" 
                      />
                      <span className="text-sm font-medium text-gray-700">{mod.label}</span>
                    </label>
                  ))}
                </div>
                
                <hr className="border-gray-100 my-6" />
                
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Limits & Quotas</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Upload Size (MB)</label>
                  <input
                    type="number"
                    value={formData?.['MAX_UPLOAD_MB'] || '50'}
                    onChange={(e) => handleChange('MAX_UPLOAD_MB', e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400"
                  />
                </div>

                <hr className="border-gray-100 my-6" />
                
                <h3 className="text-sm font-semibold text-gray-900 mb-3">System Resources</h3>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Experience Manuals (Playbooks)</h4>
                      <p className="text-xs text-gray-500">Edit the documentation shown to staff and clients</p>
                    </div>
                  </div>
                  <Link 
                    href="/admin/settings/playbooks"
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Edit Playbooks
                  </Link>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLoading || updateMutation.isPending}
                className="flex items-center gap-1.5 bg-brandbook-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brandbook-600 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
