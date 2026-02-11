'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteGroupButtonProps {
  groupId: string;
  groupName: string;
}

export default function DeleteGroupButton({
  groupId,
  groupName,
}: DeleteGroupButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete group');
      }

      console.log('✅ Group deleted successfully');
      const timestamp = Date.now();
      //for local dev 
      await fetch('/api/clear-cache', { method: 'POST' });
      window.location.href = '/groups';

      window.location.href = `/groups?_=${timestamp}`;
      // Success - redirect to groups page
      //window.location.href = '/groups';
      //router.push('/groups');
      //router.refresh();
      //window.location.reload();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      alert(error.message || 'Failed to delete group');
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the group <strong>"{groupName}"</strong> and
            remove all members. All shared content links will remain accessible, but
            the group itself will be deleted.
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Deleting...' : 'Delete Group'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}