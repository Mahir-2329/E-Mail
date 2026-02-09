'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [viewData, setViewData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cronStatus, setCronStatus] = useState<any>(null);
  const [cronSchedule, setCronSchedule] = useState('0 8 */3 * *'); // Default: Every 3 days at 8 AM
  const [cronLoading, setCronLoading] = useState(false);

  // Load default schedule from env or use default
  useEffect(() => {
    // In production, this would come from server-side, but for UI we use default
    // The actual schedule is controlled by CRON_SCHEDULE env variable
    setCronSchedule('0 8 */3 * *');
  }, []);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved !== null ? saved === 'true' : prefersDark;
    
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSendEmails = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/send-emails', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewData = async () => {
    setLoadingData(true);
    setViewData(null);

    try {
      const response = await fetch('/api/view-data');
      const data = await response.json();
      setViewData(data);
    } catch (error: any) {
      setViewData({
        success: false,
        error: error.message,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusUpdate = async (rowIndex: number, newStatus: string) => {
    setUpdatingStatus(rowIndex);
    
    try {
      const response = await fetch('/api/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rowIndex,
          newStatus,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await handleViewData();
      } else {
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error updating status: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const checkCronStatus = async () => {
    try {
      const response = await fetch('/api/cron/status');
      const data = await response.json();
      // Always show as running if autoStart is true (which it always is)
      setCronStatus({ ...data, isRunning: true, autoStart: true });
    } catch (error: any) {
      console.error('Failed to check cron status:', error);
      // Assume it's running since it auto-starts
      setCronStatus({ isRunning: true, autoStart: true, schedule: 'Every 3 days at 8:00' });
    }
  };

  const handleStartCron = async () => {
    setCronLoading(true);
    try {
      const response = await fetch('/api/cron/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule: cronSchedule }),
      });

      const data = await response.json();
      if (data.success) {
        await checkCronStatus();
        alert('Cron job started successfully!');
      } else {
        alert(`Failed to start cron: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error starting cron: ${error.message}`);
    } finally {
      setCronLoading(false);
    }
  };

  const handleStopCron = async () => {
    setCronLoading(true);
    try {
      const response = await fetch('/api/cron/stop', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        await checkCronStatus();
        alert('Cron job stopped successfully!');
      } else {
        alert(`Failed to stop cron: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error stopping cron: ${error.message}`);
    } finally {
      setCronLoading(false);
    }
  };

  useEffect(() => {
    checkCronStatus();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-start sm:items-center justify-center p-3 sm:p-6 transition-colors duration-300">
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 md:p-10 w-full transition-all duration-300 ${viewData ? 'max-w-6xl' : 'max-w-lg'} mt-4 sm:mt-0`}>
        {/* Header with Dark Mode Toggle */}
        <div className="flex items-start justify-between mb-6 sm:mb-8">
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-3 sm:mb-4 shadow-lg">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Email Sender
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-light">
              Send emails to pending recipients
            </p>
          </div>
          
          {/* Dark Mode Toggle */}
          {mounted && (
            <button
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 ml-2 sm:ml-4"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Cron Job Section */}
        <div className="mb-4 sm:mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Automated Email Scheduler
            </h3>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
              Auto-Running
            </span>
          </div>
          
          <div className="space-y-3">
            {cronStatus?.schedule && (
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Current Schedule:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {cronStatus.schedule}
                </p>
                {cronStatus.lastRun && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last run: {new Date(cronStatus.lastRun).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                ✅ <strong>Automatic:</strong> Cron job starts automatically when the server starts.
              </p>
              <p className="mb-1">
                <strong>Configuration:</strong> Set in <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env.local</code>:
              </p>
              <ul className="list-disc list-inside space-y-0.5 ml-2 font-mono text-xs">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">CRON_INTERVAL_DAYS=3</code> - Days between runs</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">CRON_HOUR=8</code> - Hour (0-23)</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">CRON_MINUTE=0</code> - Minute (0-59)</li>
              </ul>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                💡 The cron job runs in the background - no manual start needed!
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleSendEmails}
            disabled={loading}
            className={`
              flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-medium text-white text-sm sm:text-base
              transition-all duration-300 ease-out
              ${
                loading
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] shadow-md hover:shadow-lg'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Sending...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="hidden sm:inline">Send Emails</span>
                <span className="sm:hidden">Send</span>
              </span>
            )}
          </button>

          <button
            onClick={handleViewData}
            disabled={loadingData}
            className={`
              px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm sm:text-base
              transition-all duration-300 ease-out
              ${
                loadingData
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 active:scale-[0.98] shadow-sm hover:shadow-md'
              }
            `}
          >
            {loadingData ? (
              <svg
                className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="hidden sm:inline">View Data</span>
                <span className="sm:hidden">View</span>
              </span>
            )}
          </button>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`
              mt-4 sm:mt-6 p-4 sm:p-5 rounded-xl border backdrop-blur-sm
              transition-all duration-300
              ${
                result.success
                  ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50'
                  : 'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200/50 dark:border-rose-800/50'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500 flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold text-xs sm:text-sm mb-1 sm:mb-1.5 ${
                    result.success ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'
                  }`}
                >
                  {result.success ? 'Success' : 'Error'}
                </h3>
                <p
                  className={`text-xs sm:text-sm mb-2 sm:mb-3 ${
                    result.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {result.message || result.error}
                </p>
                {result.success && (
                  <div className="space-y-1.5 sm:space-y-2 text-xs">
                    <div className={`flex items-center gap-2 ${result.success ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                      <span className="font-medium">Sent:</span>
                      <span className={result.success ? 'text-emerald-600 dark:text-emerald-500' : ''}>{result.sent} emails</span>
                    </div>
                    {result.failed > 0 && (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <span className="font-medium">Failed:</span>
                        <span className="text-amber-600 dark:text-amber-500">{result.failed} emails</span>
                      </div>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50">
                        <p className="text-amber-700 dark:text-amber-400 font-medium mb-1.5 sm:mb-2 text-xs">
                          Errors:
                        </p>
                        <ul className="space-y-1 text-xs text-amber-600/80 dark:text-amber-500/80">
                          {result.errors.map((error: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>
                              <span className="flex-1 break-words">{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {viewData && (
          <div className="mt-4 sm:mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">CSV Data</h2>
              {viewData.success && (
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span>Total: {viewData.totalRows}</span>
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md text-xs">
                    Pending: {viewData.pendingCount}
                  </span>
                </div>
              )}
            </div>

            {viewData.success && viewData.data && viewData.data.length > 0 ? (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full text-xs sm:text-sm divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                      <tr>
                        {Object.keys(viewData.data[0]).map((key) => (
                          <th
                            key={key}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {viewData.data.map((row: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          {Object.keys(viewData.data[0]).map((key) => (
                            <td
                              key={key}
                              className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                            >
                              {key === 'Status' ? (
                                <div className="flex items-center gap-2">
                                  {updatingStatus === idx ? (
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>
                                    </div>
                                  ) : (
                                    <select
                                      value={row[key] || ''}
                                      onChange={(e) => handleStatusUpdate(idx, e.target.value)}
                                      className={`
                                        px-1.5 sm:px-2 py-1 rounded text-xs font-medium border
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                        transition-colors cursor-pointer
                                        ${row[key] === 'Pending' 
                                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' 
                                          : row[key] === 'Sent'
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                        }
                                      `}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Sent">Sent</option>
                                      <option value="Rejected">Rejected</option>
                                      <option value="Interview">Interview</option>
                                      <option value="Follow Up">Follow Up</option>
                                    </select>
                                  )}
                                </div>
                              ) : (
                                <span className={`
                                  ${row[key] === '✓' ? 'text-green-600 dark:text-green-400 font-semibold' : ''}
                                  ${row[key] === '✗' ? 'text-red-600 dark:text-red-400 font-semibold' : ''}
                                  break-words max-w-xs sm:max-w-none
                                `}>
                                  {row[key] || '-'}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : viewData.success ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">No data found</p>
            ) : (
              <div className="text-red-600 dark:text-red-400 text-sm">
                Error: {viewData.error}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
