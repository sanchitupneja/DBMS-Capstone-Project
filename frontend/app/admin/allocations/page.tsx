'use client';

import { useEffect, useState, useCallback } from 'react';
import { allocationApi } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  BedDouble, Search, ChevronLeft, ChevronRight,
  Loader2, DoorOpen, AlertTriangle, X,
} from 'lucide-react';

interface Allocation {
  id: string;
  status: string;
  checkInDate: string;
  checkOutDate?: string;
  academicYear: string;
  semester: number;
  notes?: string;
  student: { fullName: string; studentId: string; email: string };
  room: {
    roomNumber: string;
    floor: number;
    roomType: string;
    hostel: { name: string };
  };
  allocatedBy?: { fullName: string } | null;
}

function VacateModal({
  allocation,
  onClose,
  onSuccess,
}: {
  allocation: Allocation;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVacate = async () => {
    setLoading(true);
    setError('');
    const res = await allocationApi.vacate(allocation.id);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message ?? 'Failed to vacate');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">Vacate Room</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 rounded-xl mb-5 border border-amber-500/20"
          style={{ background: 'rgba(245,158,11,0.08)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">Confirm Vacate Action</p>
              <p className="text-amber-400/70 text-xs mt-1">
                This will free up the bed and update room occupancy. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-white font-semibold">{allocation.student.fullName}</p>
          <p className="text-white/40 text-sm">{allocation.student.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge badge-pending">{allocation.room.roomNumber}</span>
            <span className="badge badge-ac">{allocation.room.hostel.name}</span>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">⚠ {error}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleVacate} disabled={loading} className="btn-danger flex-1">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <DoorOpen size={15} />}
            Vacate Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAllocationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacateTarget, setVacateTarget] = useState<Allocation | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, authLoading, router]);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    const res = await allocationApi.list({ page: String(page), limit: '15' });
    setAllocations((res.data as Allocation[]) ?? []);
    setTotalPages(res.meta?.totalPages ?? 1);
    setTotal(res.meta?.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  const filtered = allocations.filter(
    (a) =>
      !search ||
      a.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.student.studentId.toLowerCase().includes(search.toLowerCase()) ||
      a.room.roomNumber.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = allocations.filter((a) => a.status === 'ACTIVE').length;

  return (
    <>
      {vacateTarget && (
        <VacateModal
          allocation={vacateTarget}
          onClose={() => setVacateTarget(null)}
          onSuccess={fetchAllocations}
        />
      )}

      <div className="space-y-6">
        {}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Room Allocations</h1>
            <p className="text-white/40 text-sm mt-1">
              Manage all active and historical allocations
            </p>
          </div>
          {}
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span className="text-green-400 font-bold">{activeCount}</span>
              <span className="text-green-400/60 ml-1">Active</span>
            </div>
            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-white font-bold">{total}</span>
              <span className="text-white/40 ml-1">Total</span>
            </div>
          </div>
        </div>

        {}
        <div className="glass-card p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="form-input pl-9 max-w-md"
              placeholder="Search by student name, ID, or room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={28} className="animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Room</th>
                    <th>Hostel</th>
                    <th>Type</th>
                    <th>Check-in</th>
                    <th>Academic Year</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-white/30 py-12">
                        <BedDouble size={32} className="text-white/10 mx-auto mb-3" />
                        No allocations found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((alloc) => (
                      <tr key={alloc.id}>
                        <td>
                          <div>
                            <p className="font-medium text-white">{alloc.student.fullName}</p>
                            <p className="text-xs text-white/40">{alloc.student.email}</p>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-sm text-white/60">{alloc.student.studentId}</span>
                        </td>
                        <td>
                          <span className="font-bold text-white">{alloc.room.roomNumber}</span>
                          <p className="text-xs text-white/40">Floor {alloc.room.floor}</p>
                        </td>
                        <td className="text-white/70 text-sm">{alloc.room.hostel.name}</td>
                        <td>
                          <span className={`badge badge-${alloc.room.roomType === 'AC' ? 'ac' : 'non-ac'}`}>
                            {alloc.room.roomType}
                          </span>
                        </td>
                        <td className="text-white/60 text-sm">
                          {new Date(alloc.checkInDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="text-white/60 text-sm">
                          {alloc.academicYear} · Sem {alloc.semester}
                        </td>
                        <td>
                          <span className={`badge badge-${alloc.status.toLowerCase()}`}>
                            {alloc.status}
                          </span>
                        </td>
                        <td>
                          {alloc.status === 'ACTIVE' && (
                            <button
                              onClick={() => setVacateTarget(alloc)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
                            >
                              <DoorOpen size={12} /> Vacate
                            </button>
                          )}
                          {alloc.status !== 'ACTIVE' && (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05]">
            <span className="text-xs text-white/30">
              Showing {filtered.length} of {total} allocations
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 text-xs text-white/40">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
