'use client';

import { useEffect, useState, useCallback } from 'react';
import { requestApi, hostelApi } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Clock, Filter, Search,
  ChevronLeft, ChevronRight, Loader2, Zap, X
} from 'lucide-react';

interface AllocationRequest {
  id: string;
  hostelId: string;
  status: string;
  preferredRoomType: string;
  academicYear: string;
  semester: number;
  createdAt: string;
  student: { fullName: string; studentId: string; email: string; gender: string };
  hostel: { name: string; gender: string };
  allocation?: { room: { roomNumber: string; roomType: string } } | null;
  rejectionReason?: string | null;
}

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  totalBeds: number;
  occupiedBeds: number;
  status: string;
  pricePerMonth: number;
}

function ProcessModal({
  request,
  onClose,
  onSuccess,
}: {
  request: AllocationRequest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [action, setAction] = useState<'approve' | 'reject' | 'waitlist'>('approve');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (action === 'approve') {
      setRoomsLoading(true);
      hostelApi
        .listRooms(request.hostelId, {
          roomType: request.preferredRoomType,
          limit: '50',
        })
        .then((res) => {
          
          const all = (res.data as Room[]) ?? [];
          setRooms(all.filter(r => r.status === 'AVAILABLE' || r.status === 'PARTIALLY_OCCUPIED'));
        })
        .finally(() => setRoomsLoading(false));
    }
  }, [action, request.hostel, request.preferredRoomType]);

  const handleSubmit = async () => {
    setError('');
    if (action === 'approve' && !selectedRoom) {
      setError('Please select a room to assign');
      return;
    }
    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setLoading(true);
    try {
      const res = await requestApi.process(request.id, {
        action,
        ...(selectedRoom && { roomId: selectedRoom }),
        ...(rejectionReason && { rejectionReason }),
        ...(notes && { notes }),
      });
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message ?? 'Action failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-lg">Process Request</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {}
        <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="font-semibold text-white">{request.student?.fullName}</p>
          <p className="text-sm text-white/40">{request.student?.email} · {request.student?.studentId}</p>
          <div className="flex gap-2 mt-2">
            <span className={`badge badge-${request.preferredRoomType === 'AC' ? 'ac' : 'non-ac'}`}>{request.preferredRoomType}</span>
            <span className="badge badge-pending">{request.hostel?.name}</span>
          </div>
        </div>

        {}
        <div className="flex gap-2 mb-5">
          {(['approve', 'reject', 'waitlist'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                action === a
                  ? a === 'approve'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : a === 'reject'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {}
        {action === 'approve' && (
          <div className="mb-4">
            <label className="form-label">Select Room</label>
            {roomsLoading ? (
              <div className="flex items-center gap-2 text-white/40 text-sm py-3">
                <Loader2 size={14} className="animate-spin" /> Loading rooms...
              </div>
            ) : (
              <select
                className="form-input"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                <option value="">-- Select a room --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} · Floor {r.floor} · {r.roomType} · {r.occupiedBeds}/{r.totalBeds} beds · ₹{r.pricePerMonth}/mo
                  </option>
                ))}
              </select>
            )}
            {rooms.length === 0 && !roomsLoading && (
              <p className="text-amber-400 text-xs mt-1">No rooms matching preferences</p>
            )}
            <div className="mt-3">
              <label className="form-label">Notes (optional)</label>
              <input
                className="form-input"
                placeholder="Add notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {}
        {action === 'reject' && (
          <div className="mb-4">
            <label className="form-label">Rejection Reason *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Explain why this request is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4">⚠ {error}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 ${action === 'reject' ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : `Confirm ${action}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<AllocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AllocationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoAllocLoading, setAutoAllocLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, authLoading, router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '10' };
    if (statusFilter) params.status = statusFilter;
    const res = await requestApi.list(params);
    setRequests((res.data as AllocationRequest[]) ?? []);
    setTotalPages(res.meta?.totalPages ?? 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAutoAllocate = async () => {
    setAutoAllocLoading(true);
    const y = new Date().getFullYear();
    await requestApi.autoAllocate({ academicYear: `${y}-${y + 1}`, semester: 1 });
    setAutoAllocLoading(false);
    fetchRequests();
  };

  const filtered = requests.filter(
    (r) =>
      !search ||
      r.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {selectedRequest && (
        <ProcessModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={fetchRequests}
        />
      )}

      <div className="space-y-6">
        {}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Requests</h1>
            <p className="text-white/40 text-sm">Review and process student allocation requests</p>
          </div>
          <button
            onClick={handleAutoAllocate}
            disabled={autoAllocLoading}
            className="btn-primary text-sm"
          >
            {autoAllocLoading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            Auto-Allocate All Pending
          </button>
        </div>

        {}
        <div className="glass-card p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="form-input pl-9"
              placeholder="Search by name or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-white/40" />
            <select className="form-input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="WAITLISTED">Waitlisted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
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
                    <th>Hostel</th>
                    <th>Preference</th>
                    <th>Academic Year</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-white/30 py-12">No requests found</td></tr>
                  ) : (
                    filtered.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div>
                            <p className="font-medium text-white">{req.student?.fullName}</p>
                            <p className="text-xs text-white/40">{req.student?.email}</p>
                          </div>
                        </td>
                        <td className="text-white/60 font-mono text-sm">{req.student?.studentId}</td>
                        <td className="text-white/80">{req.hostel?.name}</td>
                        <td>
                          <span className={`badge badge-${req.preferredRoomType === 'AC' ? 'ac' : 'non-ac'}`}>
                            {req.preferredRoomType}
                          </span>
                        </td>
                        <td className="text-white/60 text-sm">{req.academicYear} Sem {req.semester}</td>
                        <td>
                          <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                        </td>
                        <td>
                          {(req.status === 'PENDING' || req.status === 'WAITLISTED') && (
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="btn-secondary text-xs px-3 py-1.5"
                            >
                              Process
                            </button>
                          )}
                          {req.status === 'APPROVED' && req.allocation && (
                            <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                              <CheckCircle size={12} /> Room {req.allocation.room.roomNumber}
                            </span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="text-red-400/60 text-xs flex items-center gap-1">
                              <XCircle size={12} /> Rejected
                            </span>
                          )}
                          {req.status === 'WAITLISTED' && (
                            <span className="text-indigo-400/60 text-xs flex items-center gap-1">
                              <Clock size={12} /> Waitlisted
                            </span>
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
            <span className="text-xs text-white/30">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
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
