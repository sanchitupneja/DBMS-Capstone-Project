'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Filter, ChevronLeft, ChevronRight,
  Loader2, Bed as BedIcon, GraduationCap,
} from 'lucide-react';

interface StudentAllocation {
  id: string;
  status: string;
  room: { roomNumber: string; hostel: { name: string } };
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  phone?: string;
  gender: string;
  course: string;
  yearOfStudy: number;
  createdAt: string;
  room_number: string | null;
  room_hostel_name?: string | null;
  active_allocation_id?: string | null;
  allocations?: StudentAllocation[];
}

export default function AdminStudentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, authLoading, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '12' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (genderFilter) params.gender = genderFilter;
    const res = await adminApi.listStudents(params);
    setStudents((res.data as Student[]) ?? []);
    setTotalPages(res.meta?.totalPages ?? 1);
    setTotal(res.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch, genderFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => { setPage(1); }, [debouncedSearch, genderFilter]);

  const genderColors: Record<string, string> = {
    MALE: '#3b82f6',
    FEMALE: '#ec4899',
    OTHER: '#8b5cf6',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-white/40 text-sm mt-1">
            {total > 0 ? `${total} registered students` : 'All registered students'}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: 'rgba(147,51,234,0.1)', border: '1px solid rgba(147,51,234,0.2)' }}
        >
          <Users size={16} className="text-purple-400" />
          <span className="text-purple-300 text-sm font-semibold">{total} total</span>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="form-input pl-9"
            placeholder="Search by name, ID, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/40" />
          <select
            className="form-input w-auto"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={28} className="animate-spin text-purple-400" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Course</th>
                  <th>Gender</th>
                  <th>Year</th>
                  <th>Joined</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                            style={{
                              background: `${genderColors[s.gender] ?? '#8b5cf6'}25`,
                              color: genderColors[s.gender] ?? '#8b5cf6',
                            }}
                          >
                            {s.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{s.fullName}</p>
                            <p className="text-xs text-white/40">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-white/60 font-mono text-sm">{s.studentId}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-white/70 text-sm">
                          <GraduationCap size={13} className="text-teal-400/70 shrink-0" />
                          {s.course}
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${genderColors[s.gender] ?? '#8b5cf6'}20`,
                            color: genderColors[s.gender] ?? '#8b5cf6',
                            border: `1px solid ${genderColors[s.gender] ?? '#8b5cf6'}40`,
                          }}
                        >
                          {s.gender}
                        </span>
                      </td>
                      <td className="text-white/60 text-sm">Year {s.yearOfStudy}</td>
                      <td className="text-white/40 text-sm">
                        {new Date(s.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: '2-digit',
                        })}
                      </td>
                      <td>
                        {s.room_number ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            title={s.room_hostel_name ?? undefined}
                          >
                            <BedIcon className="w-3.5 h-3.5" />
                            {s.room_number}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs italic">Not assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
  );
}
