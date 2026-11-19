'use client';

import { useEffect, useState, useCallback } from 'react';
import { requestApi, hostelApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircle, FileText, Loader2, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface AllocationRequest {
  id: string;
  status: string;
  hostelId: string;
  hostel: { name: string };
  preferredRoomType: string;
  preferredFloor?: number;
  specialRequirements?: string;
  academicYear: string;
  semester: number;
  rejectionReason?: string | null;
  createdAt: string;
  processedAt?: string | null;
  allocation?: {
    room: { roomNumber: string; floor: number; roomType: string; hostel: { name: string } };
    checkInDate: string;
    status: string;
  } | null;
}

interface Hostel { id: string; name: string; gender: string }

function StatusTimeline({ status }: { status: string }) {
  const steps = [
    { key: 'PENDING', label: 'Submitted', icon: <FileText size={14} /> },
    { key: 'WAITLISTED', label: 'Waitlisted', icon: <Clock size={14} /> },
    { key: 'APPROVED', label: 'Approved', icon: <CheckCircle size={14} /> },
  ];

  const currentIdx = status === 'REJECTED' || status === 'CANCELLED'
    ? -1
    : steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-2 my-4">
      {steps.map((step, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isDone
                ? isCurrent
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-green-500/15 text-green-400'
                : 'bg-white/[0.03] text-white/20'
            }`}>
              {step.icon}
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 ${isDone && i < currentIdx ? 'bg-green-500/40' : 'bg-white/[0.06]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ApplyForm({
  hostels,
  onSubmit,
  loading,
  error,
}: {
  hostels: Hostel[];
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  error: string;
}) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    hostelId: '',
    preferredRoomType: 'AC',
    preferredFloor: '',
    specialRequirements: '',
    academicYear: `${currentYear}-${currentYear + 1}`,
    semester: '1',
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      hostelId: form.hostelId,
      preferredRoomType: form.preferredRoomType,
      preferredFloor: form.preferredFloor ? parseInt(form.preferredFloor, 10) : undefined,
      specialRequirements: form.specialRequirements || undefined,
      academicYear: form.academicYear,
      semester: parseInt(form.semester, 10),
    });
  };

  return (
    <div className="glass-card p-6">
      <h2 className="font-bold text-white text-lg mb-1">Submit Application</h2>
      <p className="text-white/40 text-sm mb-6">Fill in your hostel preferences</p>

      {error && (
        <div className="mb-5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Preferred Hostel *</label>
            <select id="req-hostel" className="form-input" value={form.hostelId} onChange={set('hostelId')} required>
              <option value="">-- Select a hostel --</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>{h.name} ({h.gender})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Room Type *</label>
            <div className="flex gap-2">
              {['AC', 'NON_AC'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, preferredRoomType: t }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    form.preferredRoomType === t
                      ? 'gradient-bg-primary text-white border-transparent'
                      : 'border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  {t === 'AC' ? '❄ AC' : '🌀 Non-AC'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Preferred Floor (Optional)</label>
            <input
              id="req-floor"
              type="number"
              min="0"
              max="20"
              className="form-input"
              placeholder="e.g. 2"
              value={form.preferredFloor}
              onChange={set('preferredFloor')}
            />
          </div>

          <div>
            <label className="form-label">Academic Year *</label>
            <input
              id="req-year"
              type="text"
              className="form-input"
              placeholder="2024-2025"
              value={form.academicYear}
              onChange={set('academicYear')}
              required
            />
          </div>

          <div>
            <label className="form-label">Semester *</label>
            <select id="req-semester" className="form-input" value={form.semester} onChange={set('semester')} required>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="form-label">Special Requirements (Optional)</label>
            <textarea
              id="req-special"
              className="form-input"
              rows={2}
              placeholder="e.g. wheelchair access, ground floor preference..."
              value={form.specialRequirements}
              onChange={set('specialRequirements')}
              style={{ resize: 'none' }}
            />
          </div>
        </div>

        <button id="req-submit" type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Submitting...</>
          ) : (
            <><PlusCircle size={15} /> Submit Application</>
          )}
        </button>
      </form>
    </div>
  );
}

export default function MyRequestPage() {
  const { user } = useAuth();
  const [request, setRequest] = useState<AllocationRequest | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');

  const studentGender = user?.role === 'STUDENT' ? user.gender : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const hostelParams: Record<string, string> = { limit: '50' };
    if (studentGender) hostelParams.gender = studentGender;
    const [reqRes, hostelRes] = await Promise.all([
      requestApi.list({ limit: '1', page: '1' }),
      hostelApi.list(hostelParams),
    ]);
    const reqs = (reqRes.data as AllocationRequest[]) ?? [];
    setRequest(reqs[0] ?? null);
    setHostels((hostelRes.data as Hostel[]) ?? []);
    setLoading(false);
  }, [studentGender]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setError('');
    setSubmitLoading(true);
    try {
      const res = await requestApi.create(data);
      if (res.success) {
        fetchData();
      } else {
        setError(res.message ?? 'Submission failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;
    setCancelLoading(true);
    await requestApi.cancel(request.id);
    setCancelLoading(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Application</h1>
        <p className="text-white/40 text-sm mt-1">Submit and track your hostel allocation request</p>
      </div>

      {!request || request.status === 'CANCELLED' ? (
        <ApplyForm hostels={hostels} onSubmit={handleSubmit} loading={submitLoading} error={error} />
      ) : (
        <div className="space-y-4">
          {}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-white text-lg">Application Status</h2>
                <p className="text-white/40 text-sm">Submitted {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`badge badge-${request.status.toLowerCase()}`}>{request.status}</span>
            </div>

            <StatusTimeline status={request.status} />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Hostel</p>
                <p className="text-white font-medium">{request.hostel?.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Room Type</p>
                <span className={`badge badge-${request.preferredRoomType === 'AC' ? 'ac' : 'non-ac'}`}>
                  {request.preferredRoomType}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Academic Year</p>
                <p className="text-white text-sm">{request.academicYear} · Sem {request.semester}</p>
              </div>
              {request.preferredFloor !== undefined && (
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Preferred Floor</p>
                  <p className="text-white text-sm">Floor {request.preferredFloor}</p>
                </div>
              )}
            </div>

            {request.rejectionReason && (
              <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10">
                <p className="text-xs text-red-400/70 uppercase tracking-wider mb-1">Rejection Reason</p>
                <p className="text-red-300 text-sm">{request.rejectionReason}</p>
              </div>
            )}

            {(request.status === 'PENDING' || request.status === 'WAITLISTED') && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="btn-danger text-sm"
                >
                  {cancelLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Cancel Application
                </button>
              </div>
            )}
          </div>

          {}
          {request.status === 'APPROVED' && request.allocation && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Room Allocated! 🎉</h2>
                  <p className="text-white/40 text-xs">Your room has been confirmed</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Room Number</p>
                  <p className="text-white font-bold text-xl">{request.allocation.room.roomNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Hostel</p>
                  <p className="text-white font-medium">{request.allocation.room.hostel?.name ?? request.hostel?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Floor</p>
                  <p className="text-white">{request.allocation.room.floor}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Check-in Date</p>
                  <p className="text-white">{new Date(request.allocation.checkInDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
