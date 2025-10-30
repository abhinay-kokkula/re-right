import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { RewriteOption } from '../lib/supabase';

interface RewriteCardProps {
  option: RewriteOption;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function RewriteCard({ option, index, isSelected, onSelect }: RewriteCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(option.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative p-5 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={() => onSelect(index)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{option.style}</h3>
          <p className="text-sm text-gray-500">{option.tone}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>
      <p className="text-gray-700 leading-relaxed">{option.text}</p>
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="bg-blue-500 rounded-full p-1">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
