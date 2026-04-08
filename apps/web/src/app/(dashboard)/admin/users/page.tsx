'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { usersApi, tenantsApi } from '@/lib/api';
import { User } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth';
import { formatDate, cn } from '@/lib/utils';
import { Users, Plus, Search, UserCheck, UserX, Trash2, Edit } from 'lucide-react';

const ROLES = ['SUPER_ADMIN', 'PROJECT_HEAD', 'BRANDBOOK_STAFF', 'CLIENT_OWNER', 'CLIENT_STAFF'];

export default function UsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'BRANDBOOK_STAFF', phone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () => usersApi.list({ search: search || undefined, role: roleFilter || undefined }),
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: () => tenantsApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => usersApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setNewUser({ name: '', email: '', password: '', role: 'BRANDBOOK_STAFF', phone: '' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setEditingUserId(null);
      setNewUser({ name: '', email: '', password: '', role: 'BRANDBOOK_STAFF', phone: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const users: User[] = data?.users || [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        user={user!}
        title="Users"
        subtitle={`${data?.total || 0} total users`}
        actions={
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-brandbook-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brandbook-600 transition-colors">
            <Plus className="w-4 h-4" /> Invite User
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..." className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading users...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['User', 'Role', 'Tenants', 'Projects', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brandbook-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-brandbook-600">
                            {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', ROLE_COLORS[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(u as any).tenantUsers?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(u as any).projectUsers?.length || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          title={u.isActive ? "Deactivate" : "Activate"}
                          onClick={() => toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          className={cn('p-1 text-xs font-medium transition-colors',
                            u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700')}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          title="Edit User"
                          onClick={() => {
                            setNewUser({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' });
                            setEditingUserId(u.id);
                            setShowCreate(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          title="Delete Permanently"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete ${u.name}?`)) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingUserId ? 'Edit User' : 'Invite New User'}</h2>
              <div className="space-y-4">
                {[
                  { key: 'name', label: 'Full Name *', placeholder: 'John Doe' },
                  { key: 'email', label: 'Email *', placeholder: 'john@example.com', type: 'email', disabled: !!editingUserId },
                  { key: 'password', label: editingUserId ? 'New Password (leave empty to ignore)' : 'Password *', placeholder: '••••••••', type: 'password' },
                  { key: 'phone', label: 'Phone', placeholder: '+1 234 567 8900' },
                ].map(({ key, label, placeholder, type, disabled }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type={type || 'text'} value={(newUser as any)[key]} disabled={disabled}
                      onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandbook-400 disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                    {ROLES.filter(r => r !== 'SUPER_ADMIN').map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => {
                    if (editingUserId) {
                      const data: any = { name: newUser.name, phone: newUser.phone };
                      if (newUser.password) data.password = newUser.password; // Note: backend needs setup if password update allowed outside me
                      updateMutation.mutate({ id: editingUserId, data });
                    } else {
                      createMutation.mutate(newUser);
                    }
                  }}
                  disabled={!newUser.name || (!editingUserId && !newUser.password) || createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 bg-brandbook-500 text-white font-medium rounded-lg hover:bg-brandbook-600 disabled:opacity-50 transition-colors">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingUserId ? 'Save Changes' : 'Create User')}
                </button>
                <button onClick={() => { setShowCreate(false); setEditingUserId(null); setNewUser({ name: '', email: '', password: '', role: 'BRANDBOOK_STAFF', phone: '' }); }}
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
