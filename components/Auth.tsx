
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const Auth = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            alert('Error logging in: ' + error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 md:p-12 text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none rotate-3 hover:rotate-6 transition-transform">
                        <span className="text-3xl font-black text-white">CIC</span>
                    </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">Welcome Back!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Hệ thống Quản lý Hợp đồng & Doanh nghiệp</p>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin text-indigo-600" size={20} />
                    ) : (
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            className="w-6 h-6"
                        />
                    )}
                    <span>{isLoading ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
                </button>

                <p className="mt-8 text-xs text-slate-400 font-semibold px-8 leading-relaxed">
                    Bằng việc đăng nhập, bạn đồng ý với Quy định bảo mật và Điều khoản sử dụng của hệ thống CIC.
                </p>
            </div>
        </div>
    );
};

export default Auth;
