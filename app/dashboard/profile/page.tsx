'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  User,
  Mail,
  Lock,
  Camera,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Fingerprint,
  Save,
} from 'lucide-react';

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile fields state (loaded automatically from authenticated Admin account)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password management state
  const [showPasswordUpdateForm, setShowPasswordUpdateForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback Messages
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Fetch logged-in Admin profile details automatically on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/profile');
        if (res.status === 401 || res.status === 403) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        if (data.success && data.profile) {
          setFullName(data.profile.full_name || '');
          setEmail(data.profile.email || '');
          setIdentifier(data.profile.identifier || data.profile.username || data.profile.email || '');
          setAvatarUrl(data.profile.avatar_url || null);
        } else {
          setProfileErrorMsg(data.error || 'Failed to load profile details.');
        }
      } catch (err: any) {
        setProfileErrorMsg(err.message || 'Error connecting to server.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Handle image upload, validate file size & type, and compress to 256x256
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image MIME type
    if (!file.type.startsWith('image/')) {
      setProfileErrorMsg('Invalid file format. Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    // Validate file size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setProfileErrorMsg('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          setProfileSuccessMsg('Photo selected. Click "Save Profile Changes" to update your header avatar.');
          setProfileErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    setProfileSuccessMsg('Profile photo cleared. Click "Save Profile Changes" to apply.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save profile information (Full Name, Email, Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!fullName.trim()) {
      setProfileErrorMsg('Full Name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      setProfileErrorMsg('Email Address cannot be empty.');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          avatar_url: avatarUrl || '',
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setProfileErrorMsg(data.error || 'Failed to update profile.');
        return;
      }

      setProfileSuccessMsg('Profile updated successfully!');

      // Notify header and navigation components in real-time
      window.dispatchEvent(
        new CustomEvent('vocnix_profile_updated', {
          detail: {
            full_name: fullName.trim(),
            avatar_url: avatarUrl || '',
          },
        })
      );

      setTimeout(() => setProfileSuccessMsg(null), 5000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Password functionality with validation, error handling, and bcrypt backend storage
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    // 1. Validate both fields are filled in
    if (!newPassword) {
      setPasswordErrorMsg('New password is required.');
      return;
    }
    if (!confirmPassword) {
      setPasswordErrorMsg('Please confirm your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    // 2. Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirm password do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordErrorMsg(data.error || 'Failed to update password.');
        return;
      }

      // 3. Show success message, clear inputs, and hide update form
      setPasswordSuccessMsg('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordUpdateForm(false);

      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Error saving password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400">Loading Admin profile details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-400 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-emerald-500/30 p-6 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Admin Profile & Account Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Profile
            </h1>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300">Admin Account</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Field 1: Profile Picture Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-200">1. Profile Picture</h3>

            <div className="relative inline-block mx-auto">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-28 h-28 rounded-full object-cover border-2 border-emerald-500/60 shadow-lg mx-auto"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-3xl shadow-lg mx-auto border-2 border-emerald-500/30">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full shadow-md transition"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Upload New Photo
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fields 2, 3, 4, 5 in exact required order */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Account Details</h2>
            </div>

            {profileSuccessMsg && (
              <div className="flex items-center space-x-2 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {passwordSuccessMsg && (
              <div className="flex items-center space-x-2 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Field 2: Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Full Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Field 3: Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  3. Email Address <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vocnix.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Field 4: Platform Identifier */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  4. Platform Identifier
                </label>
                <div className="relative">
                  <Fingerprint className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={identifier || email}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 pl-9 pr-3 text-sm font-mono text-slate-400 cursor-not-allowed select-all"
                  />
                </div>
              </div>

              {/* Field 5: Password (Masked as ••••••••) */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  5. Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value="••••••••••••"
                    disabled
                    readOnly
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-400 tracking-widest cursor-not-allowed select-none"
                  />
                </div>

                {/* 3. Update Password Button */}
                {!showPasswordUpdateForm && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordUpdateForm(true);
                        setPasswordErrorMsg(null);
                        setPasswordSuccessMsg(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition shadow-sm hover:border-emerald-500/40"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Update Password</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Save Profile Changes Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Password Update Form (Conditional: appears when Admin clicks Update Password) */}
            {showPasswordUpdateForm && (
              <div className="mt-6 pt-5 border-t border-slate-800 animate-in fade-in duration-200 bg-slate-950/40 p-5 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Set New Password</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordUpdateForm(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordErrorMsg(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  {/* New Password Input with show/hide toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      New Password <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password Input with show/hide toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm New Password <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 4. Save Password Button */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordUpdateForm(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordErrorMsg(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center space-x-2 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {savingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          <span>Saving Password...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
