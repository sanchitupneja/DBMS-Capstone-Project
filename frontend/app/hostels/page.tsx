'use client';

import { useEffect, useState, useCallback } from 'react';
import { hostelApi } from '../../lib/api';
import { parseAmenities } from '@/lib/amenities';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, MapPin, Wifi, Star, ChevronRight, Search, Filter, Loader2, BedDouble } from 'lucide-react';
import Link from 'next/link';

interface Hostel {
  id: string;
  name: string;
  description: string;
  gender: string;
  address: string;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  imageUrl?: string;
  _count?: { rooms: number };
}

function HostelCard({ hostel }: { hostel: Hostel }) {
  const amenities = parseAmenities(hostel.amenities);
  const occupancyPct = hostel.totalRooms > 0
    ? Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100)
    : 0;

  const genderColor: Record<string, string> = {
    MALE: '#3b82f6',
    FEMALE: '#ec4899',
    OTHER: '#8b5cf6',
  };

  return (
    <div className="room-card group">
      {}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-[14px]"
        style={{ background: `linear-gradient(90deg, ${genderColor[hostel.gender] ?? '#8b5cf6'}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors truncate">{hostel.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={12} className="text-white/30 shrink-0" />
            <p className="text-xs text-white/40 truncate">{hostel.address}</p>
          </div>
        </div>
        <span
          className="badge shrink-0 ml-3"
          style={{
            background: `${genderColor[hostel.gender] ?? '#8b5cf6'}20`,
            color: genderColor[hostel.gender] ?? '#8b5cf6',
            border: `1px solid ${genderColor[hostel.gender] ?? '#8b5cf6'}40`,
          }}
        >
          {hostel.gender}
        </span>
      </div>

      {hostel.description && (
        <p className="text-sm text-white/40 mb-4 line-clamp-2">{hostel.description}</p>
      )}

      {}
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {amenities.slice(0, 4).map((a) => (
            <span key={a} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs text-white/50" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Wifi size={10} />
              {a}
            </span>
          ))}
          {amenities.length > 4 && (
            <span className="px-2 py-0.5 rounded-lg text-xs text-white/30" style={{ background: 'rgba(255,255,255,0.04)' }}>
              +{amenities.length - 4} more
            </span>
          )}
        </div>
      )}

      {}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>{hostel.availableRooms} rooms available</span>
          <span>{occupancyPct}% occupied</span>
        </div>
        <div className="capacity-bar">
          <div
            className="capacity-fill"
            style={{
              width: `${occupancyPct}%`,
              background: occupancyPct > 85
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : occupancyPct > 60
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #22c55e, #16a34a)',
            }}
          />
        </div>
      </div>

      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-white/40">
            <BedDouble size={12} />
            <span>{hostel.totalRooms} total</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-teal-400/80">
            <Star size={12} />
            <span>{amenities.length} amenities</span>
          </div>
        </div>
        <Link
          href={`/hostels/${hostel.id}`}
          className="flex items-center gap-1 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          View Rooms <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function HostelsPage() {
  const { user } = useAuth();
  const studentGender = user?.role === 'STUDENT' ? user.gender : undefined;

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // A student only ever sees hostels matching the gender they registered with.
  useEffect(() => {
    if (studentGender) {
      setGenderFilter(studentGender);
      setPage(1);
    }
  }, [studentGender]);

  const fetchHostels = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '9' };
    if (genderFilter) params.gender = genderFilter;
    const res = await hostelApi.list(params);
    setHostels((res.data as Hostel[]) ?? []);
    setTotalPages(res.meta?.totalPages ?? 1);
    setLoading(false);
  }, [page, genderFilter]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  const filtered = hostels.filter((h) =>
    !search ||
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-2xl font-bold text-white">Browse Hostels</h1>
        <p className="text-white/40 text-sm mt-1">
          {studentGender
            ? `Showing ${studentGender.toLowerCase()} hostels based on your registration`
            : 'Explore available hostels and rooms'}
        </p>
      </div>

      {}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="form-input pl-9"
            placeholder="Search hostels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {studentGender ? (
          <div className="flex items-center gap-2 px-3 text-sm text-teal-400/80">
            <Filter size={14} />
            <span>{studentGender === 'MALE' ? 'Male' : studentGender === 'FEMALE' ? 'Female' : 'Co-Ed'} hostels only</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-white/40" />
            <select
              className="form-input w-auto"
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Co-Ed</option>
            </select>
          </div>
        )}
      </div>

      {}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-purple-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No hostels found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((hostel) => (
            <HostelCard key={hostel.id} hostel={hostel} />
          ))}
        </div>
      )}

      {}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary text-sm px-4 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-white/40 text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary text-sm px-4 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
