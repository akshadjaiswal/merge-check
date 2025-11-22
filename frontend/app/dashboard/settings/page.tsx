'use client';

import { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/layout/dashboard-nav';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Github, Shield, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/review/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">GitHub Account</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <p className="text-slate-900">Connected to GitHub</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Reviews This Month</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats?.reviews_this_month || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats ? Math.round(stats.cache_hit_rate * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* App Settings */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">App Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Review Preferences</h3>
              <p className="text-sm text-slate-600 mb-3">
                Customize how MergeCheck reviews your code
              </p>
              <Alert className="border-cyan-200 bg-cyan-50">
                <AlertDescription className="text-cyan-700 text-sm">
                  💡 Custom review preferences coming soon! For now, all PRs are reviewed with default settings.
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-slate-900 mb-2">Notification Settings</h3>
              <p className="text-sm text-slate-600 mb-3">
                Choose how you want to be notified about reviews
              </p>
              <Alert className="border-cyan-200 bg-cyan-50">
                <AlertDescription className="text-cyan-700 text-sm">
                  💡 Email and Slack notifications coming soon! Currently, all notifications are via GitHub PR comments.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-rose-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold text-rose-900">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Disconnect Account</h3>
              <p className="text-sm text-slate-600 mb-3">
                Disconnect your GitHub account and stop all reviews. This action can be reversed by signing in again.
              </p>
              <Button variant="destructive" disabled>
                Disconnect Account (Coming Soon)
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-slate-900 mb-2">Delete All Data</h3>
              <p className="text-sm text-slate-600 mb-3">
                Permanently delete all your reviews, comments, and settings. This action cannot be undone.
              </p>
              <Button variant="destructive" disabled>
                Delete All Data (Coming Soon)
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
