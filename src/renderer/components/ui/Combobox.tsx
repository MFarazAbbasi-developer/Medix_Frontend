import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string, option?: ComboboxOption) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  onSearchChange?: (query: string) => void;
  filterOption?: (option: ComboboxOption, query: string) => boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  error,
  helperText,
  isLoading = false,
  disabled = false,
  isClearable = true,
  onSearchChange,
  filterOption,
  className,
  inputClassName,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Selected Option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  // Filtered Options
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    if (filterOption) {
      return options.filter((opt) => filterOption(opt, searchQuery));
    }

    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)),
    );
  }, [options, searchQuery, filterOption]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: ComboboxOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        scrollHighlightedIntoView(highlightedIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        scrollHighlightedIntoView(highlightedIndex - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div ref={containerRef} className={twMerge(clsx('relative w-full space-y-1', className))}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-charcoal-700 select-none"
        >
          {label}
        </label>
      )}

      {/* Trigger & Search Input */}
      <div
        className={twMerge(
          clsx(
            'flex h-8 w-full items-center rounded border bg-surface-card px-2 text-xs shadow-sm transition-colors focus-within:ring-1 focus-within:ring-brand-500',
            disabled && 'cursor-not-allowed bg-surface-muted opacity-60',
            error
              ? 'border-red-500 focus-within:ring-red-500'
              : 'border-surface-border hover:border-surface-borderStrong',
            inputClassName,
          ),
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="h-3.5 w-3.5 text-charcoal-400 shrink-0 mr-1.5" />
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder={isOpen ? 'Type to search...' : selectedOption ? selectedOption.label : placeholder}
          value={isOpen ? searchQuery : selectedOption ? selectedOption.label : ''}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearchChange?.(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isLoading && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-600" />
          )}

          {isClearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="rounded p-0.5 text-charcoal-400 hover:text-charcoal-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <ChevronDown
            className={clsx(
              'h-3.5 w-3.5 text-charcoal-400 transition-transform duration-150',
              isOpen && 'rotate-180 text-brand-600',
            )}
          />
        </div>
      </div>

      {/* Error or Helper text */}
      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-[11px] text-charcoal-500">{helperText}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded border border-surface-border bg-surface-card shadow-lg animate-in fade-in duration-100 select-none">
          <ul ref={listRef} role="listbox" className="p-1 divide-y divide-surface-border/40">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-charcoal-400">
                {isLoading ? 'Loading options...' : 'No matching options found'}
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={clsx(
                      'flex items-center justify-between rounded px-2.5 py-1.5 text-xs cursor-pointer transition-colors',
                      opt.disabled && 'opacity-40 cursor-not-allowed',
                      isHighlighted && !opt.disabled && 'bg-brand-50 text-brand-900 font-medium',
                      isSelected && 'bg-brand-50/70 font-bold text-brand-700',
                      !isHighlighted && !isSelected && 'text-charcoal-800 hover:bg-surface-muted',
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-charcoal-500 truncate font-mono">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-surface-muted text-charcoal-600 border border-surface-border">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
