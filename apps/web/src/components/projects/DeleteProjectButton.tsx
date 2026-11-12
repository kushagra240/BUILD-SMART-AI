import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const handleClick = async () => {
    const confirmed = window.confirm(
      t('projects.delete.confirm', { name: projectName })
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(projectId);
    } catch (error) {
      onError(apiErrorMessage(error, t('projects.delete.error')));
    } finally {
      setDeleting(false);
    }
  };

  const icon = deleting ? (
    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
  ) : (
    <Trash2 className="w-4 h-4" aria-hidden="true" />
  );

  const ariaLabel = t('projects.delete.aria', { name: projectName });

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={deleting}
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-brick/40 bg-paper text-brick text-xs font-medium hover:bg-brick/5 transition-colors focus-ring disabled:opacity-60"
      >
        {icon}
        <span>{deleting ? t('projects.delete.deleting') : t('projects.delete.action')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={deleting}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex items-center justify-center p-1.5 rounded hover:bg-paper-deep text-ink-soft hover:text-brick transition-colors focus-ring disabled:opacity-60"
    >
      {icon}
    </button>
  );
}
