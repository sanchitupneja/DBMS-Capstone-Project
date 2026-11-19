'use client';

import { useEffect, useState, useCallback } from 'react';
import { hostelApi, requestApi } from '../../../lib/api';
import { parseAmenities } from '@/lib/amenities';
import { hostelMatchesGender } from '@/lib/gender';
import { useAuth } from '../../../contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Wind, Fan, MapPin, BedDouble,
  ChevronRight, Loader2, Star, Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: 'AC' | 'NON_AC';
  totalBeds: number;
  occupiedBeds: number;
  status: string;
  pricePerMonth: number;
  amenities: string[] | string;
}

interface Hostel {
  id: string;
  name: string;
  description?: string;
  gender: string;
  address: string;
  totalRooms: number;
  availableRooms: number;
  amenities: string[] | string;
  rooms: Room[];
}

function ApplyModal({
  hostel,
  selectedRoomType,
  onClose,
  onSuccess,
}: {
  hostel: Hostel;
  selectedRoomType: 'AC' | 'NON_AC' | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    preferredRoomType: selectedRoomType ?? 'AC',
    preferredFloor: '',
    specialRequirements: '',
    academicYear: `${currentYear}-${currentYear + 1}`,
    semester: '1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await requestApi.create({
      hostelId: hostel.id,
      preferredRoomType: form.preferredRoomType,
      preferredFloor: form.preferredFloor ? parseInt(form.preferredFloor, 10) : undefined,
      specialRequirements: form.specialRequirements || undefined,
      academicYear: form.academicYear,
      semester: parseInt(form.semester, 10),
    });
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message ?? 'Submission failed');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <h3 className="font-bold text-white text-lg mb-1">Apply for Room</h3>
        <p className="text-white/40 text-sm mb-5">{hostel.name}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">⚠ {error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Room Type *</label>
            <div className="flex gap-2">
              {(['AC', 'NON_AC'] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, preferredRoomType: t }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    form.preferredRoomType === t
                      ? 'gradient-bg-primary text-white border-transparent'
                      : 'border-white/10 text-white/40 hover:text-white/70'
                  }`}>
                  {t === 'AC' ? '❄ AC' : '🌀 Non-AC'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Preferred Floor</label>
              <input type="number" min="0" max="20" className="form-input"
                placeholder="Any floor" value={form.preferredFloor}
                onChange={(e) => setForm((f) => ({ ...f, preferredFloor: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Semester *</label>
              <select className="form-input" value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} required>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Academic Year *</label>
              <input type="text" className="form-input" placeholder="2024-2025"
                value={form.academicYear}
                onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Special Requirements</label>
              <input type="text" className="form-input"
                placeholder="e.g. wheelchair access, ground floor..."
                value={form.specialRequirements}
                onChange={(e) => setForm((f) => ({ ...f, specialRequirements: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoomCard({ room, onApply, user, canApply }: { room: Room; onApply: (type: 'AC' | 'NON_AC') => void; user: { role: string } | null; canApply: boolean }) {
  const occupancyPct = (room.occupiedBeds / room.totalBeds) * 100;
  const available = room.status === 'AVAILABLE' || room.status === 'PARTIALLY_OCCUPIED';

  return (
    <div className={`room-card ${!available ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg">{room.roomNumber}</span>
            <span className={`badge ${room.roomType === 'AC' ? 'badge-ac' : 'badge-non-ac'}`}>
              {room.roomType === 'AC' ? <><Wind size={9} /> AC</> : <><Fan size={9} /> Non-AC</>}
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5">Floor {room.floor}</p>
        </div>
        <span className={`badge badge-${
          room.status === 'AVAILABLE' ? 'available'
          : room.status === 'PARTIALLY_OCCUPIED' ? 'pending'
          : room.status === 'FULL' ? 'full'
          : 'maintenance'
        }`}>
          {room.status.replace('_', ' ')}
        </span>
      </div>

      {}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/30 mb-1.5">
          <span>{room.occupiedBeds}/{room.totalBeds} beds occupied</span>
          <span>{room.totalBeds - room.occupiedBeds} free</span>
        </div>
        <div className="capacity-bar">
          <div className="capacity-fill" style={{
            width: `${occupancyPct}%`,
            background: occupancyPct === 100
              ? 'linear-gradient(90deg,#ef4444,#dc2626)'
              : occupancyPct > 66
              ? 'linear-gradient(90deg,#f59e0b,#d97706)'
              : 'linear-gradient(90deg,#22c55e,#16a34a)',
          }} />
        </div>
      </div>

      {}
      {parseAmenities(room.amenities).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {parseAmenities(room.amenities).slice(0, 3).map((a) => (
            <span key={a} className="px-2 py-0.5 rounded text-[10px] text-white/40"
              style={{ background: 'rgba(255,255,255,0.04)' }}>{a}</span>
          ))}
          {parseAmenities(room.amenities).length > 3 && (
            <span className="px-2 py-0.5 rounded text-[10px] text-white/20"
              style={{ background: 'rgba(255,255,255,0.04)' }}>+{parseAmenities(room.amenities).length - 3}</span>
          )}
        </div>
      )}

      {}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold gradient-text">₹{room.pricePerMonth.toLocaleString()}</span>
          <span className="text-white/30 text-xs">/month</span>
        </div>
        {available && user?.role === 'STUDENT' && canApply ? (
          <button onClick={() => onApply(room.roomType)}
            className="flex items-center gap-1 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            Apply <ChevronRight size={14} />
          </button>
        ) : available && user?.role === 'ADMIN' ? (
          <span className="text-teal-400/60 text-xs font-medium">Available</span>
        ) : (
          <span className="text-white/20 text-xs">Not available</span>
        )}
      </div>
    </div>
  );
}

export default function HostelDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState<{ open: boolean; type: 'AC' | 'NON_AC' | null }>({ open: false, type: null });
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [applied, setApplied] = useState(false);

  const fetchHostel = useCallback(async () => {
    setLoading(true);
    const res = await hostelApi.get(params.id as string);
    if (res.success) setHostel(res.data as Hostel);
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchHostel(); }, [fetchHostel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-white/30">Hostel not found</p>
        <Link href="/hostels" className="btn-secondary text-sm mt-4 inline-flex">← Back</Link>
      </div>
    );
  }

  const studentGender = user?.role === 'STUDENT' ? user.gender : undefined;
  const canApply = hostelMatchesGender(hostel.gender, studentGender);

  const filteredRooms = hostel.rooms.filter(
    (r) => !typeFilter || r.roomType === typeFilter
  );

  const occupancyPct = hostel.totalRooms > 0
    ? Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100)
    : 0;

  return (
    <>
      {applyModal.open && (
        <ApplyModal
          hostel={hostel}
          selectedRoomType={applyModal.type}
          onClose={() => setApplyModal({ open: false, type: null })}
          onSuccess={() => setApplied(true)}
        />
      )}

      <div className="space-y-6 max-w-5xl">
        {}
        <Link href="/hostels"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Hostels
        </Link>

        {}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, rgb(147,51,234), rgb(20,184,166))' }} />

          {applied && (
            <div className="mb-5 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-center gap-2">
              ✅ Application submitted! Check{' '}
              <Link href="/my-request" className="underline">My Application</Link> for status updates.
            </div>
          )}

          {user?.role === 'STUDENT' && !canApply && (
            <div className="mb-5 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
              ⚠ This hostel is for {hostel.gender.toLowerCase()} students only. Your registration is
              {' '}{studentGender?.toLowerCase() ?? 'unknown'}, so you cannot apply here.{' '}
              <Link href="/hostels" className="underline">Browse your hostels</Link>.
            </div>
          )}

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-white">{hostel.name}</h1>
                <span className={`badge ${
                  hostel.gender === 'MALE' ? 'badge-ac'
                  : hostel.gender === 'FEMALE' ? 'badge-non-ac'
                  : 'badge-available'
                }`}>
                  {hostel.gender}
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/40 text-sm">
                <MapPin size={14} />{hostel.address}
              </div>
            </div>
            {user?.role === 'STUDENT' && canApply && (
              <button
                onClick={() => setApplyModal({ open: true, type: null })}
                className="btn-primary"
              >
                Apply for Room
              </button>
            )}
          </div>

          {hostel.description && (
            <p className="text-white/50 text-sm mt-4 max-w-2xl">{hostel.description}</p>
          )}

          {}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Rooms', value: hostel.totalRooms, color: 'text-white' },
              { label: 'Available', value: hostel.availableRooms, color: 'text-teal-400' },
              { label: 'Occupied', value: hostel.totalRooms - hostel.availableRooms, color: 'text-purple-400' },
              { label: 'Occupancy', value: `${occupancyPct}%`, color: occupancyPct > 85 ? 'text-red-400' : 'text-green-400' },
            ].map((s) => (
              <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/30 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {}
          <div className="mt-4">
            <div className="capacity-bar">
              <div className="capacity-fill" style={{
                width: `${occupancyPct}%`,
                background: 'linear-gradient(90deg, rgb(147,51,234), rgb(20,184,166))',
              }} />
            </div>
          </div>

          {}
          {parseAmenities(hostel.amenities).length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {parseAmenities(hostel.amenities).map((a) => (
                <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Star size={10} className="text-purple-400" />{a}
                </span>
              ))}
            </div>
          )}
        </div>

        {}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <BedDouble size={18} className="text-purple-400" />
              Rooms ({filteredRooms.length})
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-white/40" />
              <select className="form-input w-auto text-sm" value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="AC">AC Only</option>
                <option value="NON_AC">Non-AC Only</option>
              </select>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <BedDouble size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No rooms found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  user={user}
                  canApply={canApply}
                  onApply={(type) => setApplyModal({ open: true, type })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
