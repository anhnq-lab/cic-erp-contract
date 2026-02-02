import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * Modern Auth Component with Glassmorphism Design
 * Supports both Light and Dark mode
 * 
 * Design System (UI UX Pro Max):
 * - Style: Glassmorphism + Minimalism
 * - Primary: #0F172A (Navy) | Dark: #F8FAFC (White)
 * - Accent: #E85D04 (CIC Orange)
 * - Background: Dynamic gradient with animated shapes
 */
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
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Dynamic Gradient Background - Light Mode */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-500" />

            {/* Animated Floating Shapes - Light Mode */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Large gradient orb - top left */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-300/30 to-amber-200/20 dark:from-orange-500/20 dark:to-amber-600/10 rounded-full blur-3xl animate-pulse" />

                {/* Medium orb - top right */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-400/25 to-indigo-300/20 dark:from-blue-600/20 dark:to-indigo-500/15 rounded-full blur-3xl"
                    style={{ animation: 'pulse 4s ease-in-out infinite alternate' }} />

                {/* Large orb - bottom */}
                <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-t from-purple-300/30 to-pink-200/20 dark:from-purple-700/20 dark:to-pink-600/10 rounded-full blur-3xl"
                    style={{ animation: 'pulse 5s ease-in-out infinite alternate-reverse' }} />

                {/* Small accent orb */}
                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-gradient-to-br from-orange-400/40 to-red-400/30 dark:from-orange-500/30 dark:to-red-500/20 rounded-full blur-2xl"
                    style={{ animation: 'pulse 3s ease-in-out infinite' }} />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />

            {/* Login Card - Glassmorphism */}
            <div className="relative z-10 w-full max-w-md">
                {/* Main Card */}
                <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-white/50 dark:border-slate-700/50 p-8 md:p-12">

                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        {/* CIC Logo - Modern Clean Style */}
                        <div className="inline-flex items-center gap-3 mb-4">
                            {/* CIC Text with Gradient */}
                            <div className="relative">
                                <span className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text text-transparent"
                                    style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                                    CIC
                                </span>
                                {/* Subtle shadow for depth */}
                                <span className="absolute inset-0 text-5xl md:text-6xl font-black tracking-tight text-orange-500/10 dark:text-orange-400/5 blur-sm -z-10"
                                    style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                                    CIC
                                </span>
                            </div>

                            {/* ERP Badge */}
                            <div className="flex flex-col items-start">
                                <span className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-200 tracking-wide">
                                    ERP
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
                                    Since 1990
                                </span>
                            </div>
                        </div>

                        {/* Subtitle */}
                        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base">
                            Hệ thống Quản trị Doanh nghiệp Tổng thể
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-white/70 dark:bg-slate-900/70 text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                                Đăng nhập
                            </span>
                        </div>
                    </div>

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 
                                   bg-white dark:bg-slate-800 
                                   border border-slate-200 dark:border-slate-600 
                                   hover:bg-slate-50 dark:hover:bg-slate-700 
                                   hover:border-slate-300 dark:hover:border-slate-500
                                   hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
                                   text-slate-700 dark:text-slate-200 
                                   font-semibold py-4 px-6 rounded-2xl 
                                   transition-all duration-300 
                                   hover:scale-[1.02] active:scale-[0.98] 
                                   disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                                   group"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin text-orange-500" size={22} />
                        ) : (
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
                            />
                        )}
                        <span className="text-base">
                            {isLoading ? 'Đang kết nối...' : 'Đăng nhập với Google'}
                        </span>
                    </button>

                    {/* Footer Text */}
                    <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                        Bằng việc đăng nhập, bạn đồng ý với{' '}
                        <span className="text-orange-600 dark:text-orange-400 hover:underline cursor-pointer">
                            Quy định bảo mật
                        </span>{' '}
                        và{' '}
                        <span className="text-orange-600 dark:text-orange-400 hover:underline cursor-pointer">
                            Điều khoản sử dụng
                        </span>{' '}
                        của hệ thống CIC.
                    </p>
                </div>

                {/* Bottom Branding */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-400/70 dark:text-slate-500/70 font-medium">
                        © 2024 CIC Corporation. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
