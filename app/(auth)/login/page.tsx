'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/lib/actions/auth.actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = await loginAction(formData);

    if (result && !result.success) {
      setErrorMessage(result.error || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest font-body-md text-on-surface flex items-center justify-center p-4 md:p-6">
      <main className="w-full max-w-[1100px] bg-white rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row min-h-[650px] border border-outline-variant">
        {/* Left Panel: Branding & Spice Imagery */}
        <div className="relative w-full md:w-1/2 bg-primary-container flex flex-col justify-between p-8 md:p-12 overflow-hidden min-h-[300px]">
          {/* Background overlay */}
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBHZVRE0_B-vjSshB-wvvDYWs962BhrgINBPDbcKo3TIAtSiy7VaWRcIf6qWqaQ4yVFMW6spMXKhjEESKNPP_ABWSEMDP5mfsLkH__ciAmY7G18G80nIU6LNnmeDX_u6j-gYIRg7AzdhOzl1tHeJaHus9ty06vO1ZAOs_iN5DVi3n_FvQ1J7NsLEUf25EiqXWgen3v47utOaNS_wcFPg0xOBTUQ_pAxntFTainfkcGLXmGSFis0Nl8p')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container to-primary/80 mix-blend-multiply" />
            <div className="absolute inset-0 bg-pattern opacity-30" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-container rounded flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-on-secondary-container text-[24px] icon-fill">
                  dataset
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-md text-white tracking-tight font-bold">
                HIPA Masala CRM
              </h1>
            </div>

            <div className="mt-auto pt-12">
              <h2 className="font-display-lg text-2xl md:text-3xl text-white mb-4 font-bold leading-tight">
                Manage your customers, enquiries and sales in one place.
              </h2>
              <p className="font-body-lg text-sm text-white/80 max-w-sm">
                Premium enterprise management system designed for operational excellence and high-density data handling.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full md:w-1/2 bg-surface-container-lowest p-8 md:p-12 flex flex-col justify-center relative">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6 text-center md:text-left">
              <h3 className="font-headline-lg text-headline-lg text-primary mb-2 font-bold">Sign In</h3>
              <p className="font-body-md text-on-surface-variant">Enter your credentials to access the secure portal.</p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-error-container/40 border border-error/30 text-on-error-container text-xs font-body-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1">
                <label className="block font-label-md text-on-surface uppercase text-[10px] tracking-wider text-on-surface-variant font-medium" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hipamasala.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-surface-bright border border-outline-variant rounded-md font-body-md text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:border-primary transition-colors hover:border-outline text-sm disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block font-label-md text-on-surface uppercase text-[10px] tracking-wider text-on-surface-variant font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-surface-bright border border-outline-variant rounded-md font-body-md text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:border-primary transition-colors hover:border-outline text-sm disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-bright cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block font-body-sm text-xs text-on-surface-variant cursor-pointer">
                    Remember me
                  </label>
                </div>
                <Link href="#" className="font-label-md text-xs text-primary hover:text-primary-container transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm font-label-md text-sm font-medium text-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin mr-2 text-[18px]">progress_activity</span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span className="material-symbols-outlined ml-2 text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="font-body-sm text-xs text-outline">Internal use only. Authorized personnel only.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
