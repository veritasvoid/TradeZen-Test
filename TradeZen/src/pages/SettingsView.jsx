import React from 'react';
import { Header } from '@/components/layout/Header';
import { useSettingsStore } from '@/stores/settingsStore';
import { CURRENCIES } from '@/lib/constants';

const SettingsView = () => {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <>
      <Header title="Settings" />
      <div className="p-4 max-w-3xl mx-auto space-y-6">
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
    </>
  );
};

const Section = ({ title, children }) => (
  <div>
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    <div className="card divide-y divide-border">
      {children}
    </div>
  </div>
);

const SettingRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
    <div className="font-medium">{label}</div>
    <div>{children}</div>
  </div>
);

export default SettingsView;
