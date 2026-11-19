'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, requestApi, allocationApi } from '../../lib/api';
import {
  Users, Building2, BedDouble, Clock, CheckCircle,
  TrendingUp, Zap, RefreshCw, Loader2,
} from 'lucide-react';

interface DashboardMetrics {
  overview: {
    totalStudents: number;
    totalHostels: number;
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    pendingRequests: number;
    activeAllocations: number;
    occupancyRate: string;
  };
  requestsByStatus: Array<{ status: string; _count: number }>;
  roomsByType: Array<{ roomType: string; status: string; _count: number }>;
}

interface StudentData {
  requests: unknown[];
  allocations: unknown[];
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        {sub && <span className="text-xs text-white/30">{sub}</span>}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-white/40">{label}</p>
    </div>
  );
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoAllocLoading, setAutoAllocLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await adminApi.getDashboard();
    if (res.success && res.data) {
      setMetrics(res.data as DashboardMetrics);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMetrics(); }, []);

  const handleAutoAllocate = async () => {
    setAutoAllocLoading(true);
    const currentYear = new Date().getFullYear();
    await requestApi.autoAllocate({
      academicYear: `${currentYear}-${currentYear + 1}`,
      semester: 1,
    });
    setAutoAllocLoading(false);
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  const ov = metrics?.overview;
  const occupancyPct = parseFloat(ov?.occupancyRate ?? '0');

  return (
    <div className="space-y-8">
      {}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Real-time hostel allocation overview</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchMetrics} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={handleAutoAllocate}
            className="btn-primary flex items-center gap-2 text-sm"
            disabled={autoAllocLoading}
          >
            {autoAllocLoading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            Auto-Allocate
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Students" value={ov?.totalStudents ?? 0} color="#a855f7" />
        <StatCard icon={<Building2 size={20} />} label="Active Hostels" value={ov?.totalHostels ?? 0} color="#14b8a6" />
        <StatCard icon={<BedDouble size={20} />} label="Available Rooms" value={ov?.availableRooms ?? 0} sub={`of ${ov?.totalRooms ?? 0}`} color="#22c55e" />
        <StatCard icon={<Clock size={20} />} label="Pending Requests" value={ov?.pendingRequests ?? 0} color="#f59e0b" />
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<TrendingUp size={20} />} label="Occupancy Rate" value={`${occupancyPct}%`} color="#ec4899" />
        <StatCard icon={<CheckCircle size={20} />} label="Active Allocations" value={ov?.activeAllocations ?? 0} color="#6366f1" />
        <StatCard icon={<BedDouble size={20} />} label="Occupied Rooms" value={ov?.occupiedRooms ?? 0} sub="rooms" color="#f97316" />
      </div>

      {}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Overall Occupancy</h2>
          <span className="text-purple-400 font-bold">{occupancyPct}%</span>
        </div>
        <div className="capacity-bar">
          <div
            className="capacity-fill"
            style={{
              width: `${occupancyPct}%`,
              background: `linear-gradient(90deg, rgb(147,51,234), rgb(20,184,166))`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/30">
          <span>{ov?.occupiedRooms ?? 0} occupied</span>
          <span>{ov?.availableRooms ?? 0} available</span>
        </div>
      </div>

      {}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4">Requests by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {metrics?.requestsByStatus?.map((s) => (
            <div key={s.status} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-2xl font-bold text-white">{s._count}</p>
              <span className={`badge badge-${s.status.toLowerCase()} mt-2`}>{s.status}</span>
            </div>
          )) ?? <p className="text-white/30 col-span-5 text-sm">No data</p>}
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentData>({ requests: [], allocations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [reqRes, allocRes] = await Promise.all([
        requestApi.list({ limit: '5' }),
        allocationApi.list({ limit: '5' }),
      ]);
      setData({
        requests: (reqRes.data as unknown[]) ?? [],
        allocations: (allocRes.data as unknown[]) ?? [],
      });
      setLoading(false);
    })();
  }, []);

  interface RequestRecord {
    id: string;
    status: string;
    hostel?: { name: string };
    preferredRoomType?: string;
    academicYear?: string;
    semester?: number;
    createdAt?: string;
  }

  interface AllocationRecord {
    id: string;
    status: string;
    room?: { roomNumber: string; roomType: string; hostel?: { name: string } };
    checkInDate?: string;
  }

  const latestRequest = (data.requests as RequestRecord[])[0];
  const activeAllocation = (data.allocations as AllocationRecord[]).find(
    (a) => a.status === 'ACTIVE'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Good {getGreeting()},{' '}
          <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/40 text-sm mt-1">Manage your hostel application and room details</p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(147,51,234,0.15)', color: 'rgb(147,51,234)' }}>
              <FileTextIcon />
            </div>
            <h2 className="font-semibold text-white">Application Status</h2>
          </div>
          {latestRequest ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Status</span>
                <span className={`badge badge-${latestRequest.status.toLowerCase()}`}>
                  {latestRequest.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Hostel</span>
                <span className="text-white text-sm">{latestRequest.hostel?.name ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Room Type</span>
                <span className={`badge badge-${latestRequest.preferredRoomType === 'AC' ? 'ac' : 'non-ac'}`}>
                  {latestRequest.preferredRoomType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Academic Year</span>
                <span className="text-white text-sm">{latestRequest.academicYear} Sem {latestRequest.semester}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/30 text-sm mb-3">No application submitted yet</p>
              <a href="/my-request" className="btn-primary text-sm inline-flex items-center gap-2">
                Apply Now
              </a>
            </div>
          )}
        </div>

        {}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.15)', color: 'rgb(20,184,166)' }}>
              <BedDouble size={20} />
            </div>
            <h2 className="font-semibold text-white">My Room</h2>
          </div>
          {activeAllocation ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Room No.</span>
                <span className="text-white font-semibold">{activeAllocation.room?.roomNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Hostel</span>
                <span className="text-white text-sm">{activeAllocation.room?.hostel?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Type</span>
                <span className={`badge badge-${activeAllocation.room?.roomType === 'AC' ? 'ac' : 'non-ac'}`}>
                  {activeAllocation.room?.roomType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Check-in</span>
                <span className="text-white text-sm">
                  {activeAllocation.checkInDate ? new Date(activeAllocation.checkInDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/30 text-sm">No active room allocation</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <a href="/hostels" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Building2 size={20} className="text-purple-400" />
            <span className="text-sm text-white/70">Browse Hostels</span>
          </a>
          <a href="/my-request" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <FileTextIcon />
            <span className="text-sm text-white/70">My Application</span>
          </a>
          <a href="/my-room" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <BedDouble size={20} className="text-teal-400" />
            <span className="text-sm text-white/70">Room Details</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <StudentDashboard />;
}
