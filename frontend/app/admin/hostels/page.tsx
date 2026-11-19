'use client';

import { useEffect, useState, useCallback } from 'react';
import { hostelApi } from '../../../lib/api';
import { parseAmenities } from '@/lib/amenities';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Plus, Building2, Pencil, ToggleLeft, ToggleRight,
  Loader2, X, BedDouble, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Hostel {
  id: string;
  name: string;
  description?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  isActive: boolean;
  _count?: { rooms: number };
}

interface HostelFormData {
  name: string;
  description: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  amenities: string;
}

function HostelModal({
  hostel,
  onClose,
  onSuccess,
}: {
  hostel: Hostel | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!hostel;
  const [form, setForm] = useState<HostelFormData>({
    name: hostel?.name ?? '',
    description: hostel?.description ?? '',
    gender: hostel?.gender ?? 'MALE',
    address: hostel?.address ?? '',
    amenities: parseAmenities(hostel?.amenities).join(', '),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof HostelFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const data = {
      ...form,
      amenities: form.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };
    const res = isEdit
      ? await hostelApi.update(hostel!.id, data)
      : await hostelApi.create(data);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message ?? 'Operation failed');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-lg">
            {isEdit ? 'Edit Hostel' : 'Create New Hostel'}
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Hostel Name *</label>
            <input id="h-name" className="form-input" placeholder="Sunrise Boys Hostel" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea id="h-desc" className="form-input" rows={2} placeholder="Brief description..." value={form.description} onChange={set('description')} style={{ resize: 'none' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Gender *</label>
              <select id="h-gender" className="form-input" value={form.gender} onChange={set('gender')} required>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Co-Ed</option>
              </select>
            </div>
            <div>
              <label className="form-label">Address *</label>
              <input id="h-address" className="form-input" placeholder="Block A, Campus North" value={form.address} onChange={set('address')} required />
            </div>
          </div>
          <div>
            <label className="form-label">Amenities (comma-separated)</label>
            <input id="h-amenities" className="form-input" placeholder="WiFi, Gym, Cafeteria, Laundry" value={form.amenities} onChange={set('amenities')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : isEdit ? 'Update Hostel' : 'Create Hostel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddRoomModal({
  hostelId,
  onClose,
  onSuccess,
}: {
  hostelId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    roomNumber: '', floor: '1', roomType: 'AC',
    totalBeds: '3', pricePerMonth: '8000', amenities: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (f: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await hostelApi.createRoom(hostelId, {
      roomNumber: form.roomNumber,
      floor: parseInt(form.floor, 10),
      roomType: form.roomType,
      totalBeds: parseInt(form.totalBeds, 10),
      pricePerMonth: parseFloat(form.pricePerMonth),
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
    });
    if (res.success) { onSuccess(); onClose(); }
    else setError(res.message ?? 'Failed to create room');
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-lg">Add New Room</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">⚠ {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Room Number *</label>
              <input id="r-num" className="form-input" placeholder="A-101" value={form.roomNumber} onChange={set('roomNumber')} required />
            </div>
            <div>
              <label className="form-label">Floor *</label>
              <input id="r-floor" type="number" min="0" max="50" className="form-input" value={form.floor} onChange={set('floor')} required />
            </div>
            <div>
              <label className="form-label">Room Type *</label>
              <select id="r-type" className="form-input" value={form.roomType} onChange={set('roomType')}>
                <option value="AC">AC</option>
                <option value="NON_AC">Non-AC</option>
              </select>
            </div>
            <div>
              <label className="form-label">Total Beds *</label>
              <input id="r-beds" type="number" min="1" max="10" className="form-input" value={form.totalBeds} onChange={set('totalBeds')} required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Price / Month (₹) *</label>
              <input id="r-price" type="number" min="0" className="form-input" value={form.pricePerMonth} onChange={set('pricePerMonth')} required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Amenities (comma-separated)</label>
              <input id="r-amenities" className="form-input" placeholder="AC, Attached Bathroom, Study Table" value={form.amenities} onChange={set('amenities')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HostelRow({
  hostel,
  onEdit,
  onToggle,
  onAddRoom,
}: {
  hostel: Hostel;
  onEdit: () => void;
  onToggle: () => void;
  onAddRoom: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const occupancy = hostel.totalRooms > 0
    ? Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100)
    : 0;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: hostel.isActive ? 'rgba(147,51,234,0.15)' : 'rgba(107,114,128,0.15)' }}>
            <Building2 size={18} className={hostel.isActive ? 'text-purple-400' : 'text-gray-400'} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white truncate">{hostel.name}</h3>
              {!hostel.isActive && <span className="badge badge-cancelled">Inactive</span>}
            </div>
            <p className="text-white/40 text-sm truncate">{hostel.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onAddRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-400 border border-teal-500/20 hover:bg-teal-500/10 transition-all">
            <Plus size={12} /> Add Room
          </button>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 border border-white/10 hover:bg-white/[0.05] transition-all">
            <Pencil size={12} /> Edit
          </button>
          <button onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hostel.isActive
                ? 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
                : 'text-green-400 border-green-500/20 hover:bg-green-500/10'
            }`}>
            {hostel.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {hostel.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Rooms', value: hostel.totalRooms },
          { label: 'Available', value: hostel.availableRooms, color: 'text-teal-400' },
          { label: 'Occupied', value: hostel.totalRooms - hostel.availableRooms, color: 'text-purple-400' },
          { label: 'Occupancy', value: `${occupancy}%`, color: occupancy > 85 ? 'text-red-400' : 'text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className={`text-xl font-bold ${stat.color ?? 'text-white'}`}>{stat.value}</p>
            <p className="text-xs text-white/30 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {}
      <div className="capacity-bar">
        <div className="capacity-fill" style={{
          width: `${occupancy}%`,
          background: occupancy > 85
            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : 'linear-gradient(90deg, rgb(147,51,234), rgb(20,184,166))',
        }} />
      </div>

      {}
      {expanded && parseAmenities(hostel.amenities).length > 0 && (
        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {parseAmenities(hostel.amenities).map((a) => (
              <span key={a} className="px-3 py-1 rounded-lg text-xs text-white/50"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminHostelsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Hostel | null>(null);
  const [addRoomTarget, setAddRoomTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, authLoading, router]);

  const fetchHostels = useCallback(async () => {
    setLoading(true);
    const res = await hostelApi.list({ limit: '50' });
    setHostels((res.data as Hostel[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  const handleToggle = async (hostel: Hostel) => {
    if (hostel.isActive) {
      await hostelApi.deactivate(hostel.id);
    } else {
      await hostelApi.update(hostel.id, { isActive: true });
    }
    fetchHostels();
  };

  return (
    <>
      {(modalOpen || editTarget) && (
        <HostelModal
          hostel={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSuccess={fetchHostels}
        />
      )}
      {addRoomTarget && (
        <AddRoomModal
          hostelId={addRoomTarget}
          onClose={() => setAddRoomTarget(null)}
          onSuccess={fetchHostels}
        />
      )}

      <div className="space-y-6">
        {}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Hostels</h1>
            <p className="text-white/40 text-sm mt-1">Create, edit, and manage hostel buildings and rooms</p>
          </div>
          <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="btn-primary text-sm">
            <Plus size={15} /> New Hostel
          </button>
        </div>

        {}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-purple-400" />
          </div>
        ) : hostels.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Building2 size={48} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 mb-4">No hostels created yet</p>
            <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
              <Plus size={15} /> Create First Hostel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {hostels.map((hostel) => (
              <HostelRow
                key={hostel.id}
                hostel={hostel}
                onEdit={() => setEditTarget(hostel)}
                onToggle={() => handleToggle(hostel)}
                onAddRoom={() => setAddRoomTarget(hostel.id)}
              />
            ))}
          </div>
        )}

        {}
        {hostels.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <BedDouble size={14} className="text-purple-400" />
                <span className="text-white/40">Total rooms:</span>
                <span className="text-white font-semibold">
                  {hostels.reduce((s, h) => s + h.totalRooms, 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white/40">Available:</span>
                <span className="text-green-400 font-semibold">
                  {hostels.reduce((s, h) => s + h.availableRooms, 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-white/40">Active hostels:</span>
                <span className="text-white font-semibold">
                  {hostels.filter((h) => h.isActive).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
