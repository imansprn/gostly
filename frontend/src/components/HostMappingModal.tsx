import React, { useEffect, useState } from 'react';

export interface HostMapping {
  id?: number;
  hostname: string;
  ip: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP';
  active: boolean;
}

interface HostMappingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (mapping: HostMapping) => Promise<void> | void;
  initial?: HostMapping | null;
}

const HostMappingModal: React.FC<HostMappingModalProps> = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState<HostMapping>({
    hostname: '',
    ip: '',
    port: 80,
    protocol: 'HTTP',
    active: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setForm({ ...initial });
    } else {
      setForm({ hostname: '', ip: '', port: 80, protocol: 'HTTP', active: true });
    }
  }, [initial, open]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.hostname.trim()) next.hostname = 'Hostname is required';
    if (!form.ip.trim()) next.ip = 'IP address is required';
    if (!form.port || form.port <= 0) next.port = 'Port must be a positive number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'port' ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg mx-4">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{initial ? 'Edit Host Mapping' : 'Add Host Mapping'}</h3>
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" onClick={onClose}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hostname</label>
            <input name="hostname" value={form.hostname} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200 ${errors.hostname ? 'border-red-300 focus:ring-red-200' : 'border-slate-300'}`} placeholder="example.local" />
            {errors.hostname && <p className="text-xs text-red-600 mt-1">{errors.hostname}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
              <input name="ip" value={form.ip} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200 ${errors.ip ? 'border-red-300 focus:ring-red-200' : 'border-slate-300'}`} placeholder="192.168.1.1" />
              {errors.ip && <p className="text-xs text-red-600 mt-1">{errors.ip}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
              <input name="port" type="number" value={form.port} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-200 ${errors.port ? 'border-red-300 focus:ring-red-200' : 'border-slate-300'}`} placeholder="3000" />
              {errors.port && <p className="text-xs text-red-600 mt-1">{errors.port}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Protocol</label>
              <select name="protocol" value={form.protocol} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-200">
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="TCP">TCP</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" name="active" checked={form.active} onChange={handleChange} />
              <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors relative">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="ml-2 text-sm text-slate-700">{form.active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          <div>
            <button className="text-sm text-slate-700 hover:text-slate-900" onClick={() => setShowAdvanced(!showAdvanced)}>
              <span className="inline-flex items-center">
                <svg className={`w-4 h-4 mr-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced
              </span>
            </button>
            {showAdvanced && (
              <div className="mt-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">No advanced options yet. Placeholder for future fields.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-60" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Mapping'}</button>
        </div>
      </div>
    </div>
  );
};

export default HostMappingModal;


