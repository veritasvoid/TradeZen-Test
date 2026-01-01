import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useClearAllData } from '@/hooks/useTrades';
import { CURRENCIES } from '@/lib/constants';

const SettingsView = () => {
  const { settings, updateSettings } = useSettingsStore();
  const clearAllData = useClearAllData();
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearAllData.mutateAsync();
      alert('✅ All data cleared successfully! Your trades, tags, and settings have been reset.');
      setShowClearModal(false);
    } catch (error) {
      alert('❌ Failed to clear data: ' + error.message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ paddingTop: '100px' }}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        
        {/* Trading Settings */}
        <Section title="Trading Settings">
          <SettingRow label="Starting Balance">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{settings.currency}</span>
              <input
                type="number"
                value={settings.startingBalance || 0}
                onChange={(e) => updateSettings({ startingBalance: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 w-40 text-right font-mono focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>
          </SettingRow>

          <SettingRow label="Currency">
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.symbol}>
                  {curr.symbol} {curr.code}
                </option>
              ))}
            </select>
          </SettingRow>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow label="Theme">
            <div className="text-slate-400 text-sm">
              Dark (Always On)
            </div>
          </SettingRow>
        </Section>

        {/* Data Management */}
        <Section title="Data Management">
          <SettingRow label="Storage">
            <div className="text-slate-400 text-sm">
              Google Sheets & Drive
            </div>
          </SettingRow>

          <SettingRow label="Clear All Data">
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-semibold"
            >
              <Trash2 size={16} />
              Clear Everything
            </button>
          </SettingRow>
        </Section>

        {/* About */}
        <Section title="About">
          <SettingRow label="Version">
            <div className="text-slate-400 text-sm">1.0.0</div>
          </SettingRow>
          <SettingRow label="Source Code">
            <a
              href="https://github.com/veritasvoid/TradeZen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline"
            >
              GitHub →
            </a>
          </SettingRow>
        </Section>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-red-500/50 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-black">Clear All Data?</h3>
            </div>

            <p className="text-slate-300 mb-2">
              This will permanently delete:
            </p>
            <ul className="text-slate-400 text-sm space-y-1 mb-6 ml-4">
              <li>• All trades</li>
              <li>• All tags/strategies</li>
              <li>• All screenshots</li>
              <li>• Starting balance & settings</li>
            </ul>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm font-semibold">
                ⚠️ This action cannot be undone!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Everything
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
    <h2 className="text-lg font-bold mb-4 text-center">{title}</h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SettingRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
    <div className="font-medium text-slate-300">{label}</div>
    <div>{children}</div>
  </div>
);

export default SettingsView;
