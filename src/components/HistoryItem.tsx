import { Trash2, Clock } from 'lucide-react';
import { RewriteHistory } from '../lib/supabase';

interface HistoryItemProps {
  item: RewriteHistory;
  onDelete: (id: string) => void;
  onRestore: (text: string) => void;
}

export function HistoryItem({ item, onDelete, onRestore }: HistoryItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{formatDate(item.created_at)}</span>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p
        className="text-gray-700 text-sm cursor-pointer hover:text-gray-900"
        onClick={() => onRestore(item.original_text)}
      >
        {item.original_text.length > 100
          ? item.original_text.substring(0, 100) + '...'
          : item.original_text}
      </p>
      {item.selected_option !== null && item.rewrite_options[item.selected_option] && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-blue-600">
            Selected: {item.rewrite_options[item.selected_option].style}
          </span>
        </div>
      )}
    </div>
  );
}
