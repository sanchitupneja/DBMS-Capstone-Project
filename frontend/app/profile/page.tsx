'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../lib/api';
import {
  User, Mail, Phone, BookOpen, Calendar,
  GraduationCap, Shield, CheckCircle, Loader2,
} from 'lucide-react';

interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  studentId: string;
  phone?: string;
  gender: string;
  course: string;
  yearOfStudy: number;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

type Profile = StudentProfile | AdminProfile;

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-white/[0.04] last:border-b-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(147,51,234,0.1)', color: 'rgb(167,139,250)' }}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
        <p className="text-white font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getMe().then((res) => {
      if (res.success && res.data) setProfile(res.data as Profile);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  const isStudent = user?.role === 'STUDENT';
  const sp = profile as StudentProfile;
  const ap = profile as AdminProfile;

  const genderColors: Record<string, string> = {
    MALE: '#3b82f6', FEMALE: '#ec4899', OTHER: '#8b5cf6',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-white/40 text-sm mt-1">Your account information and details</p>
      </div>

      {}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, rgb(147,51,234), rgb(20,184,166))' }} />
        <div className="flex items-center gap-5 mt-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
            style={{ background: isStudent ? `${genderColors[sp?.gender] ?? '#8b5cf6'}20` : 'rgba(147,51,234,0.15)', color: isStudent ? (genderColors[sp?.gender] ?? '#8b5cf6') : 'rgb(147,51,234)' }}
          >
            {profile?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.fullName}</h2>
            <p className="text-white/50 text-sm">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-active' : 'badge-ac'}`}>
                {user?.role}
              </span>
              {isStudent && sp?.isEmailVerified && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="glass-card p-6">
        <h3 className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-2">Account Details</h3>
        <InfoItem icon={<Mail size={15} />} label="Email Address" value={profile?.email} />
        <InfoItem icon={<User size={15} />} label="Full Name" value={profile?.fullName} />
        <InfoItem
          icon={<Shield size={15} />}
          label="Account Role"
          value={<span className={`badge ${user?.role === 'ADMIN' ? 'badge-active' : 'badge-ac'}`}>{user?.role}</span>}
        />
        <InfoItem
          icon={<Calendar size={15} />}
          label="Member Since"
          value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
        />
      </div>

      {}
      {isStudent && (
        <div className="glass-card p-6">
          <h3 className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-2">Student Information</h3>
          <InfoItem icon={<BookOpen size={15} />} label="Student ID" value={<span className="font-mono">{sp?.studentId}</span>} />
          <InfoItem icon={<GraduationCap size={15} />} label="Course" value={sp?.course} />
          <InfoItem icon={<Calendar size={15} />} label="Year of Study" value={`Year ${sp?.yearOfStudy}`} />
          {sp?.phone && <InfoItem icon={<Phone size={15} />} label="Phone" value={sp.phone} />}
          <InfoItem
            icon={<User size={15} />}
            label="Gender"
            value={
              <span
                className="badge"
                style={{
                  background: `${genderColors[sp?.gender] ?? '#8b5cf6'}20`,
                  color: genderColors[sp?.gender] ?? '#8b5cf6',
                  border: `1px solid ${genderColors[sp?.gender] ?? '#8b5cf6'}40`,
                }}
              >
                {sp?.gender}
              </span>
            }
          />
        </div>
      )}

      {}
      {!isStudent && (
        <div className="glass-card p-4 flex items-center gap-3" style={{ border: '1px solid rgba(147,51,234,0.2)' }}>
          <Shield size={18} className="text-purple-400 shrink-0" />
          <p className="text-white/60 text-sm">You have administrator privileges. You can manage hostels, rooms, student requests, and allocations.</p>
        </div>
      )}
    </div>
  );
}
