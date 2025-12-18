import React from 'react';
import { Icon } from './Icon';

interface DropdownFilterProps {
    type: string;
    label: string;
    options: string[];
    selected: string[];
    onChange: (type: string, selected: string[]) => void;
    hideLabel?: boolean;
    debugId?: string;
    debugInfo?: string;
}

const DropdownFilter: React.FC<DropdownFilterProps> = ({ type, label, options, selected, onChange, hideLabel = false, debugId, debugInfo }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(type, e.target.checked ? options : []);
    };
    
    const handleOptionChange = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(type, newSelected);
    };

    const filteredOptions = options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let displayLabel = label;
    if (selected.length > 0 && selected.length < options.length) {
        displayLabel = `${label} (${selected.length})`;
    } else if (selected.length === options.length && options.length > 0) {
        displayLabel = `${label} (Tất cả)`;
    } else if (selected.length === 0 && options.length > 0) {
        displayLabel = `${label} (Không)`;
    }


    return (
        <div data-debug-id={debugId} data-debug-info={debugInfo}>
            {!hideLabel && <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">{label}</label>}
            <div className="relative" ref={containerRef}>
                <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-white/60 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-4 py-2 inline-flex justify-between items-center text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-700/50">
                    <span className="truncate">{displayLabel}</span>
                    <Icon name="chevron-down" className="ml-2 text-slate-500" />
                </button>
                {isOpen && (
                    <div className="absolute z-40 mt-2 w-full rounded-md shadow-lg bg-white dark:bg-slate-700 ring-1 ring-black dark:ring-slate-600 ring-opacity-5 p-4 filter-dropdown-panel">
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full text-sm bg-slate-50 dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                        />
                        <div className="flex items-center border-b border-slate-200 dark:border-slate-600 pb-2 mb-2">
                            <input type="checkbox" id={`select-all-${type}`} checked={options.length > 0 && selected.length === options.length} onChange={handleSelectAll} className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500" />
                            <label htmlFor={`select-all-${type}`} className="ml-3 block text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer">Chọn tất cả</label>
                        </div>
                        {filteredOptions.map(option => (
                            <div key={option} className="flex items-center mt-1.5">
                                <input type="checkbox" id={`cb-${type}-${option}`} value={option} checked={selected.includes(option)} onChange={() => handleOptionChange(option)} className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor={`cb-${type}-${option}`} className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">{option}</label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DropdownFilter;