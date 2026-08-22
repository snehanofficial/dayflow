import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Briefcase, Calendar, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.js';
import {
  Card,
  Button,
  Label,
  Input,
  ErrorState,
  Skeleton,
} from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import { toast } from '../../components/Toast/toastStore.js';
import { Info } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import type { paths } from '../../types/api.js';

type EmployeeProfile =
  paths['/api/employee/profile']['get']['responses']['200']['content']['application/json'];

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(30).nullable().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data: profile,
    isLoading,
    error,
    refetch: fetchProfile,
  } = useQuery<EmployeeProfile>({
    queryKey: ['employee', 'profile'],
    queryFn: () => apiClient<EmployeeProfile>('/api/employee/profile'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (profile && !isInitialized) {
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? '',
      });
      setIsInitialized(true);
    }
  }, [profile, isInitialized, reset]);

  const updateProfileMutation = useMutation<
    EmployeeProfile,
    Error,
    ProfileFormData
  >({
    mutationFn: (data: ProfileFormData) => {
      const formattedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone === '' ? null : data.phone,
      };
      return apiClient<EmployeeProfile>('/api/employee/profile', {
        method: 'PATCH',
        data: formattedData,
      });
    },
    onSuccess: (updated) => {
      toast.success('Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['employee', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone ?? '',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile.');
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch {
      // Caught in mutation onError hook
    }
  };

  const isSubmitting = updateProfileMutation.isPending;

  if (isLoading) {
    return (
      <section
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'var(--space-4) 0',
        }}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <Skeleton
            width="180px"
            height="32px"
            style={{ marginBottom: 'var(--space-2)' }}
          />
          <Skeleton width="300px" height="16px" />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          {/* Identity Header Skeleton */}
          <Card style={{ padding: 'var(--space-6)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <Skeleton width="60px" height="60px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton
                  width="200px"
                  height="24px"
                  style={{ marginBottom: 'var(--space-2)' }}
                />
                <Skeleton width="120px" height="16px" />
              </div>
            </div>
          </Card>

          {/* Form Fields Skeleton */}
          <Card style={{ padding: 'var(--space-6)' }}>
            <Skeleton
              width="180px"
              height="20px"
              style={{ marginBottom: 'var(--space-4)' }}
            />
            <div
              className="adaptive-grid"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Skeleton width="80px" height="14px" />
                  <Skeleton width="100%" height="38px" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load employee profile.'
          }
          onRetry={() => fetchProfile()}
        />
      </div>
    );
  }

  return (
    <section
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'var(--space-4) 0',
      }}
    >
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="main-title">My Profile</h1>
        <p className="subtitle">
          View and update your personal and organization details.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* Core Identity Info Header */}
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-bg)',
                color: 'var(--color-primary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={32} />
            </div>
            <div>
              <h2
                className="card-title"
                style={{ margin: 0, fontSize: '1.25rem' }}
              >
                {profile?.firstName || profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : 'New Employee'}
              </h2>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  margin: '4px 0 0 0',
                }}
              >
                {profile?.designation || 'Position not assigned'} •{' '}
                {profile?.department || 'Department not assigned'}
              </p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-6)',
            }}
          >
            {/* Personal Details Editable Form */}
            <Card>
              <h3
                className="card-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <User size={18} />
                Personal Information
              </h3>
              <p
                className="subtitle"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Manage your public profile name and contact information.
              </p>

              <div
                className="form-grid"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                <div className="form-group">
                  <Label htmlFor="firstName" required>
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    error={errors.firstName?.message}
                    disabled={isSubmitting}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <span className="form-error-msg">
                      {errors.firstName.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <Label htmlFor="lastName" required>
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    error={errors.lastName?.message}
                    disabled={isSubmitting}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <span className="form-error-msg">
                      {errors.lastName.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="phone">Phone Number</Label>
                <div
                  className="input-wrapper"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Phone
                    size={16}
                    style={{
                      color: 'var(--color-text-muted)',
                      marginLeft: 'var(--space-3)',
                      position: 'absolute',
                    }}
                  />
                  <Input
                    id="phone"
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    style={{ paddingLeft: 'var(--space-9)' }}
                    error={errors.phone?.message}
                    disabled={isSubmitting}
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <span className="form-error-msg">{errors.phone.message}</span>
                )}
              </div>
            </Card>

            {/* Account & Organization Read-Only Details */}
            <Card>
              <h3
                className="card-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <Briefcase size={18} />
                Organization Details
              </h3>
              <p
                className="subtitle"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Official employment details managed by HR. Contact your HR
                administrator to update these.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  className="kv-row"
                  style={{
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    className="kv-label"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Mail size={14} /> Email Address
                  </span>
                  <span className="kv-value">{user?.email}</span>
                </div>
                <div
                  className="kv-row"
                  style={{
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span className="kv-label">Employee ID (System)</span>
                  <span
                    className="kv-value"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {user?.employeeId}
                  </span>
                </div>
                <div
                  className="kv-row"
                  style={{
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span className="kv-label">Employee Code</span>
                  <span
                    className="kv-value"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {profile?.employeeCode}
                  </span>
                </div>
                <div
                  className="kv-row"
                  style={{
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span className="kv-label">Department</span>
                  <span className="kv-value">
                    {profile?.department || 'Not Assigned'}
                  </span>
                </div>
                <div
                  className="kv-row"
                  style={{
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span className="kv-label">Designation</span>
                  <span className="kv-value">
                    {profile?.designation || 'Not Assigned'}
                  </span>
                </div>
                <div className="kv-row" style={{ padding: 'var(--space-2) 0' }}>
                  <span
                    className="kv-label"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Calendar size={14} /> Joining Date
                  </span>
                  <span className="kv-value">
                    {profile?.joiningDate
                      ? new Date(profile.joiningDate).toLocaleDateString(
                          undefined,
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )
                      : 'Not Set'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
              }}
            >
              <Button
                type="button"
                variant="secondary"
                disabled={!isDirty || isSubmitting}
                onClick={() => {
                  if (profile) {
                    reset({
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      phone: profile.phone ?? '',
                    });
                  }
                }}
              >
                Reset Changes
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isDirty || isSubmitting || !isOnline}
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={16} style={{ marginRight: 'var(--space-2)' }} />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
            {!isOnline && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger-text)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  marginTop: 'var(--space-2)',
                }}
                role="alert"
              >
                <Info size={14} />
                Offline: Saving profile changes is disabled.
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
