
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { BANKS, PERSONAL_DEDUCTION, DEPENDENT_DEDUCTION, TAX_BRACKETS } from './tax/TaxConstants';
import { saveCalculation, getCalculations, deleteCalculation } from './tax/TaxDb';
import { 
    UserCircleIcon, MoneyIcon, UsersIcon, GiftIcon, ShieldIcon, BuildingIcon, 
    UploadIcon, DownloadIcon, ProcessingSpinnerIcon, TrashIcon, BankIcon, 
    QRIcon, SaveIcon, LoadIcon, HistoryIcon, 
    TextInputRow, InputRow, SearchableSelectRow, ResultRow, TaxBracketTable 
} from './tax/TaxComponents';

declare const html2canvas: any;

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

export default function TaxCalculatorView() {
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
        if (assessableIncome <= 0) {
            return 0;
        }
    
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
                break; // No more income to tax
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
        const insuranceDeductions = insurance;
        const unionFeeDeduction = unionFee;
        const totalDeductions = personalDeduction + dependentDeductions + insuranceDeductions + unionFeeDeduction;
        const assessableIncomeWithProxy = Math.max(0, totalIncome - totalDeductions);
        const totalTaxWithProxy = calculateProgressiveTax(assessableIncomeWithProxy);
        const incomeWithoutProxy = totalIncome > proxyAmount ? totalIncome - proxyAmount : 0;
        const assessableIncomeWithoutProxy = Math.max(0, incomeWithoutProxy - totalDeductions);
        const totalTaxWithoutProxy = calculateProgressiveTax(assessableIncomeWithoutProxy);
        const taxOnProxyAmount = Math.abs(totalTaxWithProxy - totalTaxWithoutProxy);
        setResults({ totalTaxWithProxy, assessableIncomeWithProxy, incomeWithoutProxy, assessableIncomeWithoutProxy, totalTaxWithoutProxy, taxOnProxyAmount, personalDeduction, dependentDeductions, insuranceDeductions, unionFeeDeduction, totalDeductions });
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts: [ 
                  { inlineData: { mimeType, data: base64Data } }, 
                  { text: `Phân tích phiếu lương trong hình ảnh này. Trích xuất chính xác các giá trị sau đây. - "fullName": Họ và tên của người nhận lương, thường ở góc trên bên phải. - "totalIncome": Tổng thu nhập chịu thuế TNCN trong tháng. - "dependents": Số lượng người phụ thuộc. - "totalInsurance": Tổng cộng của tất cả các khoản bảo hiểm (BHXH, BHYT, BHTN). Nếu có nhiều khoản, hãy cộng chúng lại. - "unionFee": Kinh phí công đoàn. - "bankAccount": Số tài khoản ngân hàng. - "bankName": Tên ngân hàng hoặc tên viết tắt (ví dụ: Vietcombank, MBBank, NH TMCP Quân đội). Trả về 0 cho bất kỳ trường số nào không tìm thấy. Trả về chuỗi rỗng cho trường chữ không tìm thấy.` } 
                ] },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          fullName: { type: Type.STRING, description: 'Họ và tên của người nhận lương' },
                          totalIncome: { type: Type.NUMBER, description: 'Tổng thu nhập chịu thuế TNCN trong tháng' },
                          dependents: { type: Type.NUMBER, description: 'Số lượng người phụ thuộc' },
                          totalInsurance: { type: Type.NUMBER, description: 'Tổng cộng các khoản bảo hiểm bắt buộc' },
                          unionFee: { type: Type.NUMBER, description: 'Khấu trừ kinh phí công đoàn' },
                          bankAccount: { type: Type.STRING, description: 'Số tài khoản ngân hàng' },
                          bankName: { type: Type.STRING, description: 'Tên ngân hàng (đầy đủ hoặc viết tắt)' }
                      },
                      required: ["fullName", "totalIncome", "dependents", "totalInsurance", "unionFee", "bankAccount", "bankName"]
                  },
              }
            });
            const extractedData = JSON.parse(response.text);
            if (extractedData.fullName) setName(extractedData.fullName);
            if (extractedData.totalIncome) setTotalIncome(extractedData.totalIncome);
            if (extractedData.dependents !== undefined) setDependents(extractedData.dependents);
            if (extractedData.totalInsurance) setInsurance(extractedData.totalInsurance);
            if (extractedData.unionFee) setUnionFee(extractedData.unionFee);
            if (extractedData.bankAccount) setBankAccount(extractedData.bankAccount);
            if (extractedData.bankName) {
              const aiBankName = extractedData.bankName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
              if (aiBankName) {
                  const foundBank = BANKS.find(bank => {
                      const shortName = bank.short_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      const fullName = bank.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      return aiBankName.includes(shortName) || (aiBankName.length > 3 && fullName.includes(aiBankName));
                  });
                  if (foundBank) setBankCode(foundBank.short_name);
              }
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
    
    const proxyTooltip = showProxyTooltip ? (
        <div className="absolute z-10 -top-14 right-0 w-64 p-3 text-sm text-white bg-slate-900 rounded-lg shadow-lg transition-opacity duration-300 pointer-events-none animate-bounce">
            <div className="relative">
                <div className="font-bold">Đã nhận diện phiếu lương!</div>
                <div className="text-slate-300">Vui lòng nhập "Tiền nhận thay" để tính thuế chênh lệch.</div>
                <div className="absolute -bottom-5 right-3 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-slate-900 border-r-[10px] border-r-transparent"></div>
            </div>
        </div>
    ) : null;

    return (
        <div id="tax-calculator-view" className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 text-slate-800 dark:text-slate-200">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Công Cụ Tính Thuế TNCN Nhận Thay</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-3 max-w-3xl mx-auto">
                    Hỗ trợ tính số tiền thuế chênh lệch do nhận THƯỞNG/KHOÁN thay siêu thị. Ví dụ: Thưởng thi đua ngành hàng, thưởng Vùng, tiền khoán VPP và Vệ Sinh
                </p>
            </header>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg" role="alert"><p>{error}</p></div>}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Input Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông tin tính thuế</h2>
                        
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p>Tải ảnh chụp phiếu lương để hệ thống tự động trích xuất thông tin chính.</p>
                            <p className="font-semibold">Hướng dẫn chụp ảnh:</p>
                            <ul className="list-decimal list-inside space-y-1">
                                <li>
                                    Click vào <a href="https://newinsite.thegioididong.com/hrm/chi-tiet-luong" target="_blank" rel="noopener noreferrer" className="font-bold text-red-600 dark:text-red-500 hover:underline">"Chi tiết thưởng"</a> tại đây.
                                </li>
                                <li>
                                    Bấm vào dòng <strong className="text-indigo-600 dark:text-indigo-400">"Tổng tiền giảm trừ"</strong> để mở rộng.
                                </li>
                                <li>
                                    Chụp toàn màn hình (đảm bảo thấy được STK).
                                </li>
                                <li>
                                    Chọn <strong className="text-indigo-600 dark:text-indigo-400">"Tải ảnh phiếu lương (AI)"</strong> bên dưới.
                                </li>
                                <li>
                                    Nhập <strong className="text-red-600 dark:text-red-400">"Số tiền nhận thay"</strong>.
                                </li>
                            </ul>
                        </div>

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
                            {proxyTooltip}
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Các khoản giảm trừ khác (nếu có)</p>
                            <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                <InputRow label="Bảo hiểm bắt buộc" id="insurance" value={insurance} onChange={setInsurance} placeholder="BHXH, BHYT, BHTN..." icon={<ShieldIcon />} />
                                <InputRow label="Phí công đoàn" id="union-fee" value={unionFee} onChange={setUnionFee} placeholder="Nếu có" icon={<BuildingIcon />} />
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={handleReset} className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"><TrashIcon /> Xóa</button>
                            <button onClick={handleSave} className="flex-1 inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"><SaveIcon /> Lưu</button>
                        </div>
                    </div>
                    
                    {/* History Card */}
                    {savedCalculations.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                           <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3"><HistoryIcon /> Lịch sử tính toán</h3>
                           <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                               {savedCalculations.map(calc => (
                                   <div key={calc.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center group">
                                       <div className="space-y-1">
                                           <p className="font-semibold text-slate-800 dark:text-slate-200">{calc.name}</p>
                                           <p className="text-xs text-slate-500 dark:text-slate-400">Tổng thu nhập: {formatCurrency(calc.totalIncome)}</p>
                                           <p className="text-xs text-slate-500 dark:text-slate-400">Lưu lúc: {new Date(calc.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                                       </div>
                                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => handleLoad(calc)} className="flex items-center text-xs font-semibold py-1 px-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"><LoadIcon /> Tải</button>
                                           <button onClick={() => handleDelete(calc.id)} className="flex items-center text-xs font-semibold py-1 px-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"><TrashIcon small /> Xóa</button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        </div>
                    )}
                </div>

                {/* Result Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {results && totalIncome > 0 && (
                        <div ref={resultsRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                            <div className="p-6 lg:p-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Tiền thuế chênh lệch</p>
                                        <p className="text-5xl font-extrabold text-red-600 dark:text-red-400 my-2">{formatCurrency(results.taxOnProxyAmount)}</p>
                                        <p className="text-slate-500 dark:text-slate-400">Đây là số tiền thuế TNCN phát sinh từ khoản nhận thay.</p>
                                    </div>
                                    <button id="export-button" onClick={handleExport} className="inline-flex items-center gap-2 py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                        <DownloadIcon /> Xuất ảnh
                                    </button>
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Thông tin thanh toán</h4>
                                        <SearchableSelectRow label="Ngân hàng" id="bank-code" value={bankCode} onChange={setBankCode} options={bankOptions} placeholder="Chọn ngân hàng" icon={<BankIcon />} />
                                        <TextInputRow label="Số tài khoản" id="bank-account" value={bankAccount} onChange={setBankAccount} placeholder="Nhập số tài khoản" icon={<BankIcon />} />
                                        <TextInputRow label="Nội dung chuyển khoản" id="qr-description" value={qrDescription} onChange={setQrDescription} placeholder="VD: HOAN THUE TNCN" icon={<BankIcon />} />
                                    </div>
                                    <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                        {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain rounded-md" /> : <div className="flex flex-col items-center gap-2 text-center text-slate-500"><QRIcon /><p className="text-sm">Mã QR sẽ hiện ở đây khi bạn điền đủ thông tin ngân hàng.</p></div>}
                                    </div>
                                </div>
                                <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                                    <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4">Chi tiết tính toán</h4>
                                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                      <ResultRow label="Tổng thu nhập" value={formatCurrency(totalIncome)} />
                                      <ResultRow label="Tổng giảm trừ" value={formatCurrency(results.totalDeductions)} />
                                      <ResultRow label="   - Giảm trừ bản thân" value={formatCurrency(results.personalDeduction)} isSubtle />
                                      <ResultRow label="   - Giảm trừ người phụ thuộc" value={formatCurrency(results.dependentDeductions)} isSubtle />
                                      <ResultRow label="   - Bảo hiểm, phí công đoàn" value={formatCurrency(results.insuranceDeductions + results.unionFeeDeduction)} isSubtle />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                        <div className="space-y-2">
                                            <h5 className="font-semibold text-red-600 dark:text-red-500">Khi bao gồm tiền nhận thay</h5>
                                            <ResultRow label="Thu nhập tính thuế" value={formatCurrency(results.assessableIncomeWithProxy)} />
                                            <ResultRow label="Tổng thuế phải nộp" value={formatCurrency(results.totalTaxWithProxy)} />
                                        </div>
                                        <div className="space-y-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:pl-8 md:border-l border-dashed border-slate-300 dark:border-slate-600">
                                            <h5 className="font-semibold text-green-600 dark:text-green-500">Khi KHÔNG gồm tiền nhận thay</h5>
                                            <ResultRow label="Thu nhập tính thuế" value={formatCurrency(results.assessableIncomeWithoutProxy)} />
                                            <ResultRow label="Tổng thuế phải nộp" value={formatCurrency(results.totalTaxWithoutProxy)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-12 text-center">
                <button onClick={() => setShowTaxBrackets(!showTaxBrackets)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm">
                    {showTaxBrackets ? 'Ẩn' : 'Hiện'} Biểu Thuế Lũy Tiến
                </button>
                {showTaxBrackets && <TaxBracketTable />}
            </div>
        </div>
    );
}
