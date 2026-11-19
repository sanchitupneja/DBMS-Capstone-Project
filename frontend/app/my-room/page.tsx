'use client';

import { useEffect, useState, useCallback } from 'react';
import { allocationApi } from '../../lib/api';
import { parseAmenities } from '@/lib/amenities';
import {
  BedDouble, CheckCircle, Calendar, Building2,
  Loader2, Wind, Fan, MapPin, Info,
} from 'lucide-react';

interface Allocation {
  id: string;
  status: 'ACTIVE' | 'VACATED' | 'TRANSFERRED' | 'EXPIRED';
  checkInDate: string;
  checkOutDate?: string;
  academicYear: string;
  semester: number;
  notes?: string;
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    roomType: 'AC' | 'NON_AC';
    totalBeds: number;
    occupiedBeds: number;
    pricePerMonth: number;
    amenities: string[];
    hostel: {
      name: string;
      address: string;
      amenities: string[];
    };
  };
  allocatedBy?: { fullName: string } | null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-b-0">
      <span className="text-sm text-white/40">{label}</span>
      <span className="text-sm text-white font-medium text-right">{value}</span>
    </div>
  );
}

export default function MyRoomPage() {
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [history, setHistory] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await allocationApi.list({ limit: '10' });
    const allocs = (res.data as Allocation[]) ?? [];
    const active = allocs.find((a) => a.status === 'ACTIVE') ?? null;
    const hist = allocs.filter((a) => a.status !== 'ACTIVE');
    setAllocation(active);
    setHistory(hist);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {}
      <div>
        <h1 className="text-2xl font-bold text-white">My Room</h1>
        <p className="text-white/40 text-sm mt-1">Your current hostel room details</p>
      </div>

      {!allocation ? (
        
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <BedDouble size={32} className="text-white/20" />
          </div>
          <h2 className="font-semibold text-white mb-2">No Active Room</h2>
          <p className="text-white/40 text-sm max-w-xs mx-auto">
            You haven't been allocated a room yet. Submit an application from the{' '}
            <a href="/my-request" className="text-purple-400 hover:underline">My Application</a> page.
          </p>
        </div>
      ) : (
        <>
          {/* ─── Active Room Card ─── */}
          <div className="glass-card p-6 relative overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, rgb(147,51,234), rgb(20,184,166))' }} />

            <div className="flex items-start justify-between mb-6 mt-2">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-4xl font-black text-white">{allocation.room.roomNumber}</span>
                  <span className={`badge ${allocation.room.roomType === 'AC' ? 'badge-ac' : 'badge-non-ac'}`}>
                    {allocation.room.roomType === 'AC' ? (
                      <><Wind size={10} /> AC</>
                    ) : (
                      <><Fan size={10} /> Non-AC</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-white/40 text-sm">
                  <MapPin size={12} />
                  <span>{allocation.room.hostel.name} · Floor {allocation.room.floor}</span>
                </div>
              </div>
              <span className="badge badge-active">
                <CheckCircle size={10} /> Active
              </span>
            </div>

            {/* Capacity Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>Room Occupancy</span>
                <span>{allocation.room.occupiedBeds}/{allocation.room.totalBeds} beds</span>
              </div>
              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${(allocation.room.occupiedBeds / allocation.room.totalBeds) * 100}%`,
                    background: 'linear-gradient(90deg, rgb(147,51,234), rgb(20,184,166))',
                  }}
                />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <h3 className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3">Room Details</h3>
                <InfoRow label="Room Number" value={allocation.room.roomNumber} />
                <InfoRow label="Floor" value={`Floor ${allocation.room.floor}`} />
                <InfoRow
                  label="Room Type"
                  value={
                    <span className={`badge ${allocation.room.roomType === 'AC' ? 'badge-ac' : 'badge-non-ac'}`}>
                      {allocation.room.roomType}
                    </span>
                  }
                />
                <InfoRow label="Total Beds" value={allocation.room.totalBeds} />
                <InfoRow label="Monthly Rent" value={`₹${allocation.room.pricePerMonth.toLocaleString()}/mo`} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3">Booking Details</h3>
                <InfoRow
                  label="Check-in Date"
                  value={new Date(allocation.checkInDate).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                />
                <InfoRow label="Academic Year" value={allocation.academicYear} />
                <InfoRow label="Semester" value={`Semester ${allocation.semester}`} />
                {allocation.allocatedBy && (
                  <InfoRow label="Allocated By" value={allocation.allocatedBy.fullName} />
                )}
                {allocation.notes && (
                  <InfoRow label="Notes" value={allocation.notes} />
                )}
              </div>
            </div>
          </div>

          {/* ─── Hostel Details ─── */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(20,184,166,0.15)' }}>
                <Building2 size={18} className="text-teal-400" />
              </div>
              <h2 className="font-semibold text-white">Hostel Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Hostel Name</p>
                <p className="text-white font-semibold">{allocation.room.hostel.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Address</p>
                <p className="text-white/70 text-sm">{allocation.room.hostel.address}</p>
              </div>
            </div>

            {/* Hostel Amenities */}
            {parseAmenities(allocation.room.hostel.amenities).length > 0 && (
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Hostel Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {parseAmenities(allocation.room.hostel.amenities).map((a) => (
                    <span key={a} className="px-3 py-1 rounded-lg text-xs text-white/60"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Amenities */}
            {parseAmenities(allocation.room.amenities).length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Room Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {parseAmenities(allocation.room.amenities).map((a) => (
                    <span key={a} className="px-3 py-1 rounded-lg text-xs text-teal-400/70"
                      style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Rental Breakdown ─── */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(147,51,234,0.15)' }}>
                <Calendar size={18} className="text-purple-400" />
              </div>
              <h2 className="font-semibold text-white">Rental Summary</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Monthly Rent</span>
                <span className="text-white font-semibold">₹{allocation.room.pricePerMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Duration</span>
                <span className="text-white font-semibold">1 Semester (~6 months)</span>
              </div>
              <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center">
                <span className="text-white font-semibold">Estimated Total</span>
                <span className="text-xl font-black gradient-text">
                  ₹{(allocation.room.pricePerMonth * 6).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Allocation History ─── */}
      {history.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Info size={18} className="text-white/40" />
            </div>
            <h2 className="font-semibold text-white">Allocation History</h2>
          </div>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <p className="text-white font-medium text-sm">
                    Room {h.room.roomNumber} — {h.room.hostel.name}
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {h.academicYear} · Sem {h.semester} ·{' '}
                    {new Date(h.checkInDate).toLocaleDateString()}
                    {h.checkOutDate && ` → ${new Date(h.checkOutDate).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`badge badge-${h.status.toLowerCase()}`}>{h.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
