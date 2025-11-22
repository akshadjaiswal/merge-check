'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2 } from 'lucide-react';

interface TriggerReviewDialogProps {
  repoFullName: string;
}

export function TriggerReviewDialog({ repoFullName }: TriggerReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [prNumber, setPrNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  async function handleTrigger() {
    if (!prNumber || isNaN(parseInt(prNumber))) {
      toast.error('Please enter a valid PR number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/review/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_full_name: repoFullName,
          pr_number: parseInt(prNumber),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger review');
      }

      toast.success(`Review triggered for PR #${prNumber}!`, {
        description: 'Processing in background... Watch the Reviews page for updates',
        duration: 5000,
      });

      // Reset and close
      setPrNumber('');
      setOpen(false);

      // Invalidate queries to refetch data (NO page reload!)
      queryClient.invalidateQueries({ queryKey: ['stats-and-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    } catch (error) {
      console.error('Trigger error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to trigger review');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
        >
          <Zap className="w-3 h-3 mr-1" />
          Test Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Trigger Manual Review</DialogTitle>
          <DialogDescription>
            Enter a PR number to manually trigger a review for{' '}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{repoFullName}</code>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pr-number" className="text-right">
              PR Number
            </Label>
            <Input
              id="pr-number"
              type="number"
              placeholder="e.g., 1"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="text-sm text-slate-600 bg-cyan-50 p-3 rounded border border-cyan-200">
            💡 <strong>Tip:</strong> This is useful for testing. Normally, reviews are triggered
            automatically when you open or update a PR.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleTrigger}
            disabled={isLoading || !prNumber}
            className="bg-gradient-to-r from-cyan-500 to-teal-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Triggering...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Trigger Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
