
import React from 'react';
import UploadSection from '../upload/UploadSection';
import { Icon } from '../common/Icon';

interface LandingPageViewProps {
    onProcessFile: (file: File) => void;
    configUrl: string;
    onConfigUrlChange: (url: string) => void;
    isDeduplicationEnabled?: boolean;
    onDeduplicationChange?: (enabled: boolean) => void;
}

const FeatureCard: React.FC<{ icon: string; title: string; description: string; color: string }> = ({ icon, title, description, color }) => (
    <div className="group p-6 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon name={icon} className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{description}</p>
    </div>
);

const LandingPageView: React.FC<LandingPageViewProps> = ({ onProcessFile, configUrl, onConfigUrlChange, isDeduplicationEnabled, onDeduplicationChange }) => {
    return (
        <div className="relative min-h-[85vh] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-slate-700/30 shadow-2xl bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
            
            {/* Modern Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-400/20 dark:bg-purple-900/20 rounded-full blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-400/20 dark:bg-indigo-900/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-pink-400/20 dark:bg-pink-900/20 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen"></div>
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    
                    {/* Left Content: Hero Text & Features */}
                    <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs font-bold mb-6 shadow-sm backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                INTELLIGENCE HUB 2.0
                            </div>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
                                Phân Tích <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Yêu Cầu Xuất</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-light leading-relaxed max-w-2xl">
                                Biến dữ liệu thô thành Dashboard, các tiêu chí quan tâm được trình bày trực quan. Tối ưu hóa hiệu suất quản lý trong việc đỗ số và theo dõi sức khỏe siêu thị và khai thác nhân viên theo thời gian thực.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <FeatureCard 
                                icon="layout-dashboard" 
                                title="Dashboard KPI" 
                                description="Theo dõi doanh thu, hiệu quả quy đổi và tỷ lệ trả góp." 
                                color="from-blue-500 to-cyan-500"
                            />
                            <FeatureCard 
                                icon="trending-up" 
                                title="Xu Hướng & Dự Báo" 
                                description="Phân tích biểu đồ theo ca, ngày, tuần để nhận diện cơ hội." 
                                color="from-emerald-500 to-teal-500"
                            />
                            <FeatureCard 
                                icon="users" 
                                title="Hiệu Suất Nhân Viên" 
                                description="Bảng xếp hạng chi tiết và chỉ số khai thác từng nhân sự." 
                                color="from-orange-500 to-amber-500"
                            />
                            <FeatureCard 
                                icon="bot" 
                                title="Trợ Lý AI" 
                                description="Hỏi đáp trực tiếp với AI để nhận phân tích sâu." 
                                color="from-purple-500 to-pink-500"
                            />
                        </div>
                    </div>

                    {/* Right Content: Upload Card */}
                    <div className="lg:col-span-5 relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        {/* Decorative background for the card */}
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 animate-pulse"></div>
                        
                        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700/50 p-6 sm:p-8">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Bắt đầu phân tích</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Tải lên file dữ liệu (.xlsx) để khởi tạo dashboard</p>
                            </div>
                            
                            <UploadSection 
                                onProcessFile={onProcessFile}
                                configUrl={configUrl}
                                onConfigUrlChange={onConfigUrlChange}
                                isDeduplicationEnabled={isDeduplicationEnabled}
                                onDeduplicationChange={onDeduplicationChange}
                            />

                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                    <Icon name="shield-check" size={3} />
                                    <span>Dữ liệu được xử lý cục bộ & bảo mật 100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LandingPageView;
