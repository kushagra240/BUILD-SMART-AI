import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '../../lib/errorMessage';

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
  onDelete: (projectId: string) => Promise<void>;
  onError: (message: string) => void;
  variant?: 'icon' | 'button';
};

/** Confirms before deleting a project and reports failures instead of hiding them. */
export function DeleteProjectButton({
  projectId,
  projectName,
  onDelete,
  onError,
  variant = 'icon',
}: DeleteProjectButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleClick = async () => {
    const confirmed = window.confirm(
      `Delete “${projectName}”? This removes it from your project list.`
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(projectId);
    } catch (error) {
      onError(apiErrorMessage(error, 'Could not delete this project'));
    } finally {
      setDeleting(false);
    }
  };

  const icon = deleting ? (
    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
  ) : (
    <Trash2 className="w-4 h-4" aria-hidden="true" />
  );

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={deleting}
        aria-label={`Delete ${projectName}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-brick/40 bg-paper text-brick text-xs font-medium hover:bg-brick/5 transition-colors focus-ring disabled:opacity-60"
      >
        {icon}
        <span>{deleting ? 'Deleting…' : 'Delete project'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={deleting}
      aria-label={`Delete ${projectName}`}
      title={`Delete ${projectName}`}
      className="inline-flex items-center justify-center p-1.5 rounded hover:bg-paper-deep text-ink-soft hover:text-brick transition-colors focus-ring disabled:opacity-60"
    >
      {icon}
    </button>
  );
}
