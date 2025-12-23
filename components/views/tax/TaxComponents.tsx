
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TAX_BRACKETS, BANKS, PERSONAL_DEDUCTION, DEPENDENT_DEDUCTION } from './TaxConstants';
import { saveCalculation, getCalculations, deleteCalculation } from './TaxDb';
// Always use GoogleGenAI and Type from @google/genai
import { GoogleGenAI, Type } from "@google/genai";

declare const html2canvas: any;

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

// Unified implementation of TaxCalculatorView
export const TaxCalculatorView: React.FC = () => {
    const [name, setName] = useState('');
    const [totalIncome, setTotalIncome] = useState(0);
    const [dependents, setDependents] = useState(0);
    const [proxyAmount, setProxyAmount] = useState(0);
    const [insurance, setInsurance] = useState(0);
    const [unionFee, setUnionFee] = useState(0);
    const [bankAccount, setBankAccount] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [qrDescription, setQrDescription] = useState('');
    
    const [results, setResults] = useState<any>(null);
    const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTaxBrackets, setShowTaxBrackets] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);
    const proxyAmountInputRef = useRef<HTMLInputElement>(null);
    const [showProxyTooltip, setShowProxyTooltip] = useState(false);

    useEffect(() => {
        if (showProxyTooltip) {
            const timer = setTimeout(() => setShowProxyTooltip(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [showProxyTooltip]);

    const fetchSavedCalculations = useCallback(async () => {
        try {
            const calculations = await getCalculations();
            setSavedCalculations(calculations);
        } catch (err) {
            console.error(err);
            setError('Không thể tải lịch sử tính toán.');
        }
    }, []);

    useEffect(() => {
        fetchSavedCalculations();
    }, [fetchSavedCalculations]);

    const bankOptions = BANKS
        .map(b => ({ value: b.short_name, label: `${b.short_name} - ${b.name}` }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const calculateProgressiveTax = (assessableIncome: number): number => {
        if (assessableIncome <= 0) return 0;
        let tax = 0;
        let remainingIncome = assessableIncome;
        for (let i = 0; i < TAX_BRACKETS.length; i++) {
            const bracket = TAX_BRACKETS[i];
            const prevMax = i > 0 ? TAX_BRACKETS[i - 1].max : 0;
            if (remainingIncome > 0) {
                const incomeInBracket = Math.min(remainingIncome, bracket.max - prevMax);
                tax += incomeInBracket * bracket.rate;
                remainingIncome -= incomeInBracket;
            } else {
                break;
            }
        }
        return tax;
    };

    const calculateTax = useCallback(() => {
        if (totalIncome <= 0) {
            setResults(null);
            return;
        }
        const personalDeduction = PERSONAL_DEDUCTION;
        const dependentDeductions = dependents * DEPENDENT_DEDUCTION;
        const totalDeductions = personalDeduction + dependentDeductions + insurance + unionFee;
        const assessableIncomeWithProxy = Math.max(0, totalIncome - totalDeductions);
        const totalTaxWithProxy = calculateProgressiveTax(assessableIncomeWithProxy);
        const incomeWithoutProxy = totalIncome > proxyAmount ? totalIncome - proxyAmount : 0;
        const assessableIncomeWithoutProxy = Math.max(0, incomeWithoutProxy - totalDeductions);
        const totalTaxWithoutProxy = calculateProgressiveTax(assessableIncomeWithoutProxy);
        const taxOnProxyAmount = Math.abs(totalTaxWithProxy - totalTaxWithoutProxy);
        setResults({ totalTaxWithProxy, assessableIncomeWithProxy, incomeWithoutProxy, assessableIncomeWithoutProxy, totalTaxWithoutProxy, taxOnProxyAmount, personalDeduction, dependentDeductions, insuranceDeductions: insurance, unionFeeDeduction: unionFee, totalDeductions });
        if (taxOnProxyAmount > 0) {
            setQrDescription(`HOAN TIEN THUE CHECH LECH DO NHAN THAY`);
        } else {
            setQrDescription('');
        }
    }, [totalIncome, dependents, proxyAmount, insurance, unionFee]);

    useEffect(() => {
        calculateTax();
    }, [calculateTax]);
    
    useEffect(() => {
        const selectedBank = BANKS.find(b => b.short_name === bankCode);
        if (results?.taxOnProxyAmount > 0 && bankAccount && selectedBank) {
          const amount = Math.round(results.taxOnProxyAmount);
          const encodedDescription = encodeURIComponent(qrDescription || `Hoan thue TNCN cho ${name || 'ban'}`);
          setQrCodeUrl(`https://qr.sepay.vn/img?acc=${bankAccount}&bank=${selectedBank.bin}&amount=${amount}&des=${encodedDescription}&template=compact`);
        } else {
          setQrCodeUrl('');
        }
    }, [results, bankAccount, bankCode, name, qrDescription]);

    const handleReset = () => {
        setName(''); setTotalIncome(0); setDependents(0); setProxyAmount(0); setInsurance(0); setUnionFee(0);
        setBankAccount(''); setBankCode(''); setQrDescription(''); setResults(null); setError(null);
    };
    
    const handleSave = async () => {
        if (totalIncome <= 0) { setError('Vui lòng nhập thu nhập để lưu.'); return; }
        const calculationToSave = { name: name || 'Chưa đặt tên', totalIncome, dependents, proxyAmount, insurance, unionFee, createdAt: new Date().toISOString() };
        try { await saveCalculation(calculationToSave); await fetchSavedCalculations(); } catch (err) { console.error(err); setError('Không thể lưu kết quả.'); }
    };

    const handleLoad = (calc: any) => {
        setName(calc.name === 'Chưa đặt tên' ? '' : calc.name); setTotalIncome(calc.totalIncome); setDependents(calc.dependents);
        setProxyAmount(calc.proxyAmount); setInsurance(calc.insurance); setUnionFee(calc.unionFee);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (id && window.confirm('Bạn có chắc chắn muốn xóa mục này?')) {
            try { await deleteCalculation(id); await fetchSavedCalculations(); } catch (err) { console.error(err); setError('Không thể xóa kết quả.'); }
        }
    };

    const processAndResizeImage = (file: File): Promise<{ base64Data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024; let width = img.width; let height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Could not get canvas context'));
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    resolve({ base64Data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        handleReset();
        event.target.value = '';
        setIsProcessing(true);
        try {
            const { base64Data, mimeType } = await processAndResizeImage(file);
            // Create a new instance right before call as per guidelines
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: { parts: [ 
                  { inlineData: { mimeType, data: base64Data } }, 
                  { text: `Phân tích phiếu lương trong hình ảnh này. Trích xuất chính xác các giá trị sau đây. - "fullName": Họ và tên của người nhận lương, thường ở góc trên bên phải. - "totalIncome": Tổng thu nhập chịu thuế TNCN trong tháng. - "dependents": Số lượng người phụ thuộc. - "totalInsurance": Tổng cộng của tất cả các khoản bảo hiểm (BHXH, BHYT, BHTN). Nếu có nhiều khoản, hãy cộng chúng lại. - "unionFee": Kinh phí công đoàn. - "bankAccount": Số tài khoản ngân hàng. - "bankName": Tên ngân hàng hoặc tên viết tắt (ví dụ: Vietcombank, MBBank, NH TMCP Quân đội). Trả về 0 cho bất kỳ trường số nào không tìm thấy. Trả về chuỗi rỗng cho trường chữ không tìm thấy.` } 
                ] },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          fullName: { type: Type.STRING },
                          totalIncome: { type: Type.NUMBER },
                          dependents: { type: Type.NUMBER },
                          totalInsurance: { type: Type.NUMBER },
                          unionFee: { type: Type.NUMBER },
                          bankAccount: { type: Type.STRING },
                          bankName: { type: Type.STRING }
                      },
                      required: ["fullName", "totalIncome", "dependents", "totalInsurance", "unionFee", "bankAccount", "bankName"]
                  },
              }
            });
            const extractedData = JSON.parse(response.text || '{}');
            if (extractedData.fullName) setName(extractedData.fullName);
            if (extractedData.totalIncome) setTotalIncome(extractedData.totalIncome);
            if (extractedData.dependents !== undefined) setDependents(extractedData.dependents);
            if (extractedData.totalInsurance) setInsurance(extractedData.totalInsurance);
            if (extractedData.unionFee) setUnionFee(extractedData.unionFee);
            if (extractedData.bankAccount) setBankAccount(extractedData.bankAccount);
            if (extractedData.bankName) {
              const aiBankName = extractedData.bankName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
              const foundBank = BANKS.find(bank => {
                  const shortName = bank.short_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const fullName = bank.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return aiBankName.includes(shortName) || (aiBankName.length > 3 && fullName.includes(aiBankName));
              });
              if (foundBank) setBankCode(foundBank.short_name);
            }
             if (proxyAmountInputRef.current) {
                proxyAmountInputRef.current.focus();
                proxyAmountInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setShowProxyTooltip(true);
            }
        } catch (err) {
            console.error("Error processing image:", err);
            setError("Không thể xử lý hình ảnh. Vui lòng thử lại hoặc nhập tay.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleExport = () => {
        if (!resultsRef.current) return;
        const exportButton = resultsRef.current.querySelector('#export-button') as HTMLElement | null;
        if (exportButton) exportButton.style.display = 'none';
        html2canvas(resultsRef.current, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff' })
          .then((canvas: any) => {
            const link = document.createElement('a');
            const fileName = name ? `ket-qua-thue-tncn-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}.png` : 'ket-qua-thue-tncn.png';
            link.download = fileName;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            if (exportButton) exportButton.style.display = 'flex';
        }).catch((err: any) => {
            console.error("Error exporting image:", err);
            if (exportButton) exportButton.style.display = 'flex';
        });
    };
    
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-slate-800 dark:text-slate-200">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Công Cụ Tính Thuế TNCN Nhận Thay</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-3 max-w-3xl mx-auto">
                    Hỗ trợ tính số tiền thuế chênh lệch do nhận thưởng hoặc khoán thay siêu thị.
                </p>
            </header>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg" role="alert"><p>{error}</p></div>}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông tin tính thuế</h2>
                        <div>
                            <label htmlFor="image-upload" className={`relative w-full flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isProcessing ? 'bg-slate-200 dark:bg-slate-700 border-slate-400' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-400'}`}>
                                {isProcessing ? <ProcessingSpinnerIcon /> : <UploadIcon />}
                                <span className={`text-sm font-semibold ${isProcessing ? 'text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>{isProcessing ? 'Đang xử lý...' : 'Tải ảnh phiếu lương (AI)'}</span>
                            </label>
                            <input id="image-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" disabled={isProcessing} />
                        </div>
                        
                        <TextInputRow label="Họ và tên" id="name" value={name} onChange={setName} placeholder="VD: Nguyễn Văn A" icon={<UserCircleIcon />} />
                        <InputRow label="Tổng thu nhập chịu thuế" id="total-income" value={totalIncome} onChange={setTotalIncome} placeholder="Thu nhập trước khi giảm trừ" icon={<MoneyIcon />} />
                        <InputRow label="Số người phụ thuộc" id="dependents" value={dependents} onChange={setDependents} placeholder="0" isCurrency={false} icon={<UsersIcon />} />
                        
                        <div className="relative">
                            <InputRow ref={proxyAmountInputRef} label="Số tiền nhận thay" id="proxy-amount" value={proxyAmount} onChange={setProxyAmount} placeholder="Tiền thưởng, hoa hồng..." icon={<GiftIcon />} highlightLabel={true} />
                            {showProxyTooltip && (
                                <div className="absolute z-10 -top-14 right-0 w-64 p-3 text-sm text-white bg-slate-900 rounded-lg shadow-lg animate-bounce">
                                    <div className="relative">
                                        <div className="font-bold">Đã nhận diện phiếu lương!</div>
                                        <div className="text-slate-300">Vui lòng nhập "Tiền nhận thay" để tính thuế chênh lệch.</div>
                                        <div className="absolute -bottom-5 right-3 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-slate-900 border-r-[10px] border-r-transparent"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                            <InputRow label="Bảo hiểm bắt buộc" id="insurance" value={insurance} onChange={setInsurance} placeholder="BHXH, BHYT, BHTN..." icon={<ShieldIcon />} />
                            <InputRow label="Phí công đoàn" id="union-fee" value={unionFee} onChange={setUnionFee} placeholder="Nếu có" icon={<BuildingIcon />} />
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={handleReset} className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"><TrashIcon /> Xóa</button>
                            <button onClick={handleSave} className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"><SaveIcon /> Lưu</button>
                        </div>
                    </div>
                    
                    {savedCalculations.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                           <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3"><HistoryIcon /> Lịch sử</h3>
                           <div className="max-h-96 overflow-y-auto space-y-2">
                               {savedCalculations.map(calc => (
                                   <div key={calc.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center group">
                                       <div>
                                           <p className="font-semibold">{calc.name}</p>
                                           <p className="text-xs text-slate-500">{formatCurrency(calc.totalIncome)}</p>
                                       </div>
                                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => handleLoad(calc)} className="text-xs py-1 px-2 bg-blue-100 text-blue-700 rounded-md">Tải</button>
                                           <button onClick={() => handleDelete(calc.id)} className="text-xs py-1 px-2 bg-red-100 text-red-700 rounded-md">Xóa</button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {results && (
                        <div ref={resultsRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 lg:p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-indigo-600 uppercase">Tiền thuế chênh lệch</p>
                                    <p className="text-5xl font-extrabold text-red-600 my-2">{formatCurrency(results.taxOnProxyAmount)}</p>
                                </div>
                                <button id="export-button" onClick={handleExport} className="inline-flex items-center gap-2 py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium">
                                    <DownloadIcon /> Xuất ảnh
                                </button>
                            </div>
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <SearchableSelectRow label="Ngân hàng" id="bank-code" value={bankCode} onChange={setBankCode} options={bankOptions} placeholder="Chọn ngân hàng" icon={<BankIcon />} />
                                    <TextInputRow label="Số tài khoản" id="bank-account" value={bankAccount} onChange={setBankAccount} placeholder="Nhập số tài khoản" icon={<BankIcon />} />
                                    <TextInputRow label="Nội dung" id="qr-description" value={qrDescription} onChange={setQrDescription} placeholder="Nội dung chuyển khoản" icon={<BankIcon />} />
                                </div>
                                <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                    {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-md" /> : <div className="text-center text-slate-500"><QRIcon /><p className="text-sm">Điền đủ thông tin ngân hàng để hiện mã QR.</p></div>}
                                </div>
                            </div>
                            <div className="mt-8 border-t border-slate-200 pt-6">
                                <h4 className="text-lg font-bold text-indigo-600 mb-4">Chi tiết</h4>
                                <ResultRow label="Tổng thu nhập" value={formatCurrency(totalIncome)} />
                                <ResultRow label="Tổng giảm trừ" value={formatCurrency(results.totalDeductions)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                        <h5 className="font-semibold text-red-600 mb-2">Bao gồm tiền nhận thay</h5>
                                        <ResultRow label="Thuế phải nộp" value={formatCurrency(results.totalTaxWithProxy)} />
                                    </div>
                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg mt-4 md:mt-0">
                                        <h5 className="font-semibold text-green-600 mb-2">Không gồm tiền nhận thay</h5>
                                        <ResultRow label="Thuế phải nộp" value={formatCurrency(results.totalTaxWithoutProxy)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-12 text-center">
                <button onClick={() => setShowTaxBrackets(!showTaxBrackets)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                    {showTaxBrackets ? 'Ẩn' : 'Hiện'} Biểu Thuế Lũy Tiến
                </button>
                {showTaxBrackets && <TaxBracketTable />}
            </div>
        </div>
    );
};
