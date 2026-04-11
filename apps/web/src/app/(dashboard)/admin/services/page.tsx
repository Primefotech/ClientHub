'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { servicesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Briefcase, Plus, Search, Edit2, Trash2, Globe, Cpu, Calendar, BarChart3, CheckSquare, XSquare, ShieldOff } from 'lucide-react';

export default function ServicesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    hasCRM: false,
    hasCalendar: false,
    hasWebDev: false,
    hasAdReporting: false,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  });

  // ── Guard: Admin only (after all hooks)
  if (user && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-sm max-w-sm">Service management is only available to Super Administrators.</p>
      </div>
    );
  }


  const createMutation = useMutation({
    mutationFn: (dto: any) => servicesApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setShowCreate(false);
      setNewService({
        name: '',
        description: '',
        hasCRM: false,
        hasCalendar: false,
        hasWebDev: false,
        hasAdReporting: false,
      });
      alert('Service created successfully!');
    },
    onError: (err: any) => {
      alert(`Failed to create service: ${err.response?.data?.message || err.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (dto: any) => servicesApi.update(editingService.id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setShowEdit(false);
      setEditingService(null);
      alert('Service updated successfully!');
    },
    onError: (err: any) => {
      alert(`Failed to update service: ${err.response?.data?.message || err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const filteredServices = services?.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const FeatureToggle = ({ label, value, onChange, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "p-1.5 rounded-lg",
          value ? "bg-brandbook-100 text-brandbook-600" : "bg-gray-100 text-gray-400"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
          value ? "bg-brandbook-500" : "bg-gray-200"
        )}
      >
        <span className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          value ? "translate-x-6" : "translate-x-1"
        )} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50/30">
      <Header
        user={user!}
        title="Services & Packages"
        subtitle="Manage available service tiers and their featured modules"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-brandbook-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brandbook-600 transition-all shadow-md shadow-brandbook-500/20"
          >
            <Plus className="w-4 h-4" /> Create Service
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
            <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No services found</h3>
            <p className="text-gray-500 text-sm mb-6">Create service packages to attach them to your client projects.</p>
            <button onClick={() => setShowCreate(true)}
              className="px-6 py-2.5 bg-brandbook-500 text-white rounded-xl text-sm font-bold hover:bg-brandbook-600 transition-all shadow-lg shadow-brandbook-500/20">
              Create First Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service: any) => (
              <div key={service.id} className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brandbook-50 flex items-center justify-center text-brandbook-600 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingService(service); setShowEdit(true); }}
                      className="p-2 text-gray-400 hover:text-brandbook-600 hover:bg-brandbook-50 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if(confirm('Delete this service?')) deleteMutation.mutate(service.id); }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">{service.description || 'No description provided.'}</p>

                <div className="grid grid-cols-2 gap-3 pt-5 border-t border-gray-50">
                  <div className={cn("flex items-center gap-2 text-xs font-bold", service.hasCRM ? "text-emerald-600" : "text-gray-300")}>
                    {service.hasCRM ? <CheckSquare className="w-3.5 h-3.5" /> : <XSquare className="w-3.5 h-3.5" />}
                    CRM Module
                  </div>
                  <div className={cn("flex items-center gap-2 text-xs font-bold", service.hasCalendar ? "text-emerald-600" : "text-gray-300")}>
                    {service.hasCalendar ? <CheckSquare className="w-3.5 h-3.5" /> : <XSquare className="w-3.5 h-3.5" />}
                    Calendar
                  </div>
                  <div className={cn("flex items-center gap-2 text-xs font-bold", service.hasWebDev ? "text-emerald-600" : "text-gray-300")}>
                    {service.hasWebDev ? <CheckSquare className="w-3.5 h-3.5" /> : <XSquare className="w-3.5 h-3.5" />}
                    Web Dev
                  </div>
                  <div className={cn("flex items-center gap-2 text-xs font-bold", service.hasAdReporting ? "text-emerald-600" : "text-gray-300")}>
                    {service.hasAdReporting ? <CheckSquare className="w-3.5 h-3.5" /> : <XSquare className="w-3.5 h-3.5" />}
                    Ad Reports
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreate || showEdit) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {showCreate ? 'Create Service tier' : 'Edit Service tier'}
              </h2>
              <p className="text-gray-500 text-sm mb-8">Define name, description and which modules are available for this package.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Service Name</label>
                  <input 
                    value={showCreate ? newService.name : editingService.name}
                    onChange={(e) => showCreate ? setNewService({ ...newService, name: e.target.value }) : setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all"
                    placeholder="e.g. Premium Web Design & SEO" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    value={showCreate ? newService.description : editingService.description}
                    onChange={(e) => showCreate ? setNewService({ ...newService, description: e.target.value }) : setEditingService({ ...editingService, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 transition-all resize-none"
                    rows={2}
                    placeholder="Describe what's included in this tier..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FeatureToggle 
                    label="CRM Module" 
                    icon={Globe}
                    value={showCreate ? newService.hasCRM : editingService.hasCRM}
                    onChange={(val: boolean) => showCreate ? setNewService({ ...newService, hasCRM: val }) : setEditingService({ ...editingService, hasCRM: val })}
                  />
                  <FeatureToggle 
                    label="Calendar" 
                    icon={Calendar}
                    value={showCreate ? newService.hasCalendar : editingService.hasCalendar}
                    onChange={(val: boolean) => showCreate ? setNewService({ ...newService, hasCalendar: val }) : setEditingService({ ...editingService, hasCalendar: val })}
                  />
                  <FeatureToggle 
                    label="Web Dev" 
                    icon={Cpu}
                    value={showCreate ? newService.hasWebDev : editingService.hasWebDev}
                    onChange={(val: boolean) => showCreate ? setNewService({ ...newService, hasWebDev: val }) : setEditingService({ ...editingService, hasWebDev: val })}
                  />
                  <FeatureToggle 
                    label="Ad Reporting" 
                    icon={BarChart3}
                    value={showCreate ? newService.hasAdReporting : editingService.hasAdReporting}
                    onChange={(val: boolean) => showCreate ? setNewService({ ...newService, hasAdReporting: val }) : setEditingService({ ...editingService, hasAdReporting: val })}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => {
                    if (showCreate) {
                      createMutation.mutate(newService);
                    } else {
                      // Only send editable fields — strip Prisma metadata/relations
                      const dto = {
                        name: editingService.name,
                        description: editingService.description,
                        hasCRM: editingService.hasCRM,
                        hasCalendar: editingService.hasCalendar,
                        hasWebDev: editingService.hasWebDev,
                        hasAdReporting: editingService.hasAdReporting,
                      };
                      updateMutation.mutate(dto);
                    }
                  }} 
                  disabled={showCreate ? (!newService.name || createMutation.isPending) : (!editingService.name || updateMutation.isPending)}
                  className="flex-1 py-3.5 bg-brandbook-500 text-white font-bold rounded-2xl hover:bg-brandbook-600 disabled:opacity-50 transition-all shadow-lg shadow-brandbook-500/30"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Service'}
                </button>
                <button onClick={() => { setShowCreate(false); setShowEdit(false); setEditingService(null); }}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all">
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
