
import React, { useState, useRef, useEffect } from 'react';
import { TAX_BRACKETS } from './TaxConstants';

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

export const UserCircleIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>);
export const MoneyIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.168-.217c-1.22-.05-1.92.65-1.92 1.542 0 .91.698 1.482 1.92 1.482.511 0 .962-.132 1.168-.217v1.698c-.22.07-.408.163-.567-.267C8.07 13.94 7.5 14.5 7.5 15.5c0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5c0-1.002-.57-1.56-1.067-1.918-.158-.103-.346-.196-.567-.267v-1.698a2.5 2.5 0 001.168.217c1.22.05 1.92-.65 1.92-1.542 0-.91-.698-1.482-1.92-1.482-.511 0-.962-.132-1.168.217V6.082c.22-.07.408-.163.567-.267C11.93 5.44 12.5 4.88 12.5 3.878c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5c0 1.002.57 1.56 1.067 1.918zM10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>);
export const UsersIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>);
export const GiftIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 5a3 3 0 015.252-2.121l.738.737a.5.5 0 00.708 0l.737-.737A3 3 0 0115 5v2a1 1 0 01-1 1H6a1 1 0 01-1-1V5zM6 9a1 1 0 00-1 1v3a1 1 0 001 1h8a1 1 0 001-1v-3a1 1 0 00-1-1H6z" clipRule="evenodd" /></svg>);
export const ShieldIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);
export const BuildingIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>);
export const UploadIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);
export const DownloadIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
export const ProcessingSpinnerIcon: React.FC = () => (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
export const TrashIcon: React.FC<{small?: boolean}> = ({small = false}) => (<svg xmlns="http://www.w3.org/2000/svg" className={`${small ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
export const BankIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>);
export const QRIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 5h.01M5 12h.01M5 19h.01M12 5h.01M12 19h.01M19 5h.01M19 12h.01M19 19h.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 5h2M5 5v2M19 5h-2M19 5v2M5 19h2M5 19v-2M19 19h-2M19 19v-2" /></svg>);
export const SaveIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002 2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>);
export const LoadIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M4 12a8 8 0 0114.83-5.29" /></svg>);
export const HistoryIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
export const SearchIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);

type TextInputRowProps = { label: string, id: string, value: string, onChange: (val: string) => void, placeholder: string, icon: React.ReactNode, highlightLabel?: boolean, onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void };
export const TextInputRow = React.forwardRef<HTMLInputElement, TextInputRowProps>(({ label, id, value, onChange, placeholder, icon, highlightLabel = false, onPaste }, ref) => (
    <div>
      <label htmlFor={id} className={`block font-medium mb-1 ${highlightLabel ? 'text-xl font-bold text-red-600 dark:text-red-400' : 'text-sm text-slate-700 dark:text-slate-300'}`}>{label}</label>
      <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div><input ref={ref} onPaste={onPaste} type="text" id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"/></div>
    </div>
));

type InputRowProps = { label: string, id: string, value: number, onChange: (val: number) => void, placeholder: string, isCurrency?: boolean, icon: React.ReactNode, highlightLabel?: boolean, tooltip?: React.ReactNode };
export const InputRow = React.forwardRef<HTMLInputElement, InputRowProps>(({ label, id, value, onChange, placeholder, isCurrency = true, icon, highlightLabel = false, tooltip }, ref) => {
    const displayValue = typeof value === 'number' && value > 0 ? (isCurrency ? value.toLocaleString('vi-VN') : value.toString()) : '';
    return (
        <div>
          <label htmlFor={id} className={`block font-medium mb-1 ${highlightLabel ? 'text-xl font-bold text-red-600 dark:text-red-400' : 'text-sm text-slate-700 dark:text-slate-300'}`}>{label}</label>
          <div className="relative">
            {tooltip}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>
            <input ref={ref} type="text" id={id} value={displayValue} onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, '')))} placeholder={placeholder} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"/>
            {isCurrency && <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 sm:text-sm">VND</span>}
          </div>
        </div>
    );
});

export const SearchableSelectRow: React.FC<{ label: string, id: string, value: string, onChange: (val: string) => void, icon: React.ReactNode, options: {value: string, label: string}[], placeholder: string }> = ({ label, id, value, onChange, icon, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={wrapperRef}>
      <label htmlFor={id} className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 pl-10 pr-10 text-left shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
        >
          <span className={selectedOption ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="p-2"><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></div><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm ngân hàng..." className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 pl-9 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10" autoFocus/></div></div>
            <ul className="max-h-60 overflow-y-auto">{filteredOptions.length > 0 ? (filteredOptions.map(opt => (<li key={opt.value} onClick={() => handleSelect(opt.value)} className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"><span className="block truncate">{opt.label}</span></li>))) : (<li className="text-center text-slate-500 py-2 text-sm">Không tìm thấy ngân hàng.</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
};

export const ResultRow: React.FC<{ label: string, value: string, isSubtle?: boolean }> = ({ label, value, isSubtle = false }) => (
    <div className={`flex justify-between items-center py-2 ${isSubtle ? 'pl-4' : ''}`}>
        <p className={`text-sm ${isSubtle ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{label}</p>
        <p className={`text-base text-right font-medium ${isSubtle ? 'text-slate-600 dark:text-slate-300' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
    </div>
);

export const TaxBracketTable: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-xl shadow-lg mt-8 border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Biểu Thuế Lũy Tiến Từng Phần</h3>
      <div className="overflow-x-auto"><table className="min-w-full"><thead className="bg-slate-100 dark:bg-slate-700/50"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider rounded-tl-lg">Bậc</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Thu Nhập Tính Thuế / Tháng</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider rounded-tr-lg">Thuế Suất</th></tr></thead><tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">{TAX_BRACKETS.map((bracket, index) => { const prevMax = index > 0 ? TAX_BRACKETS[index-1].max : 0; const incomeRange = bracket.max === Infinity ? `Trên ${formatCurrency(prevMax)}` : `${formatCurrency(prevMax + 1)} - ${formatCurrency(bracket.max)}`; return (<tr key={bracket.level} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"><td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{bracket.level}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{incomeRange}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-semibold">{bracket.rate * 100}%</td></tr>)})}</tbody></table></div>
    </div>
);
