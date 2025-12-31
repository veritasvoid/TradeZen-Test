import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { CURRENCIES } from '@/lib/constants';

const SettingsView = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettingsStore();
  const signOut = useAuthStore(state => state.signOut);

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      signOut();
      navigate('/');
    }
  };

  return (
    <div className="p-6 pb-20 max-w-3xl mx-auto space-y-6">
      {/* Appearance */}
      <Section title="Appearance">
        <SettingRow label="Theme">
          <div className="text-text-secondary text-sm">
            Dark (Always On)
          </div>
        </SettingRow>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <SettingRow label="Currency">
          <select
            value={settings.currency}
            onChange={(e) => updateSettings({ currency: e.target.value })}
            className="input py-2"
          >
            {CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.symbol}>
                {curr.symbol} {curr.code}
              </option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Data */}
      <Section title="Data">
        <SettingRow label="Storage">
          <div className="text-text-secondary text-sm">
            Google Sheets & Drive
          </div>
        </SettingRow>
      </Section>

      {/* Account */}
      <Section title="Account">
        <SettingRow label="Sign Out">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-loss/10 hover:bg-loss/20 text-loss rounded-lg transition-colors font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </SettingRow>
      </Section>

      {/* About */}
      <Section title="About">
        <SettingRow label="Version">
          <div className="text-text-secondary text-sm">1.0.0</div>
        </SettingRow>
        <SettingRow label="Source Code">
          <a
            href="https://github.com/veritasvoid/TradeZen"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent text-sm hover:underline"
          >
            GitHub →
          </a>
        </SettingRow>
      </Section>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <h2 className="text-xl font-bold mb-4 text-text-primary">{title}</h2>
    <div className="card divide-y divide-border">
      {children}
    </div>
  </div>
);

const SettingRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-4 px-1 first:pt-0 last:pb-0">
    <div className="font-medium text-text-primary">{label}</div>
    <div>{children}</div>
  </div>
);

export default SettingsView;
