import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  includeDocumentNames: string[];
  onAddIncludeDocumentName: (name: string) => void;
  onRemoveIncludeDocumentName: (name: string) => void;
  excludeDocumentNames: string[];
  onAddExcludeDocumentName: (name: string) => void;
  onRemoveExcludeDocumentName: (name: string) => void;
}

export function SearchBar({
  value,
  onChange,
  includeDocumentNames,
  onAddIncludeDocumentName,
  onRemoveIncludeDocumentName,
  excludeDocumentNames,
  onAddExcludeDocumentName,
  onRemoveExcludeDocumentName,
}: SearchBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeInputValue, setIncludeInputValue] = useState('');
  const [excludeInputValue, setExcludeInputValue] = useState('');

  const handleIncludeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && includeInputValue.trim()) {
      onAddIncludeDocumentName(includeInputValue);
      setIncludeInputValue('');
    }
  };

  const handleExcludeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && excludeInputValue.trim()) {
      onAddExcludeDocumentName(excludeInputValue);
      setExcludeInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder="Search documents..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 text-base h-12 font-mono"
          autoFocus
        />
      </div>

      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 border rounded-lg bg-muted/30 space-y-4">
            {/* Include filters */}
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-2">
                Include documents matching:
              </label>
              <Input
                type="text"
                placeholder="e.g. 'EFTA' or 'United States v. Maxwell' (press Enter to add)"
                value={includeInputValue}
                onChange={(e) => setIncludeInputValue(e.target.value)}
                onKeyDown={handleIncludeKeyDown}
                className="text-base font-mono"
              />

              {includeDocumentNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {includeDocumentNames.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-sm font-mono border border-green-500/20"
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => onRemoveIncludeDocumentName(name)}
                        className="hover:bg-green-500/20 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${name} include filter`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exclude filters */}
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-2">
                Exclude documents matching:
              </label>
              <Input
                type="text"
                placeholder="e.g. 'Redacted' (press Enter to add)"
                value={excludeInputValue}
                onChange={(e) => setExcludeInputValue(e.target.value)}
                onKeyDown={handleExcludeKeyDown}
                className="text-base font-mono"
              />

              {excludeDocumentNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {excludeDocumentNames.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-700 dark:text-red-400 rounded-full text-sm font-mono border border-red-500/20"
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => onRemoveExcludeDocumentName(name)}
                        className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${name} exclude filter`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
