import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrades } from '@/hooks/useTrades';
import { CURRENCIES, SHEETS } from '@/lib/constants';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const SettingsView = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { data: allTrades = [] } = useTrades();
  const queryClient = useQueryClient();
  
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedYears, setSelectedYears] = useState([]);
  const [isClearing, setIsClearing] = useState(false);

  // Get all years that have data
  const yearsWithData = [...new Set(allTrades.map(t => {
    const year = parseInt(t.date.split('-')[0]);
    return year;
  }))].sort((a, b) => b - a);

  const handleClearData = async () => {
    if (selectedYears.length === 0) {
      alert('Please select at least one year to delete');
      return;
    }

    const confirmation = confirm(
      `Are you sure you want to delete ALL data for ${selectedYears.join(', ')}?\n\nThis will permanently delete:\n- All trades\n- All tags\n- All screenshots\n\nThis cannot be undone!`
    );

    if (!confirmation) return;

    setIsClearing(true);

    try {
      const sheetId = '1ruzm5D-ofifAU7d5oRChBT7DAYFTlVLgULSsXvYEtXU';

      // Get all trades
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${SHEETS.TRADES}!A2:L`
      });

      const rows = response.result.values || [];
      
      // Find rows to delete (trades from selected years)
      const rowsToDelete = [];
      rows.forEach((row, index) => {
        const tradeDate = row[1]; // date column
        const tradeYear = parseInt(tradeDate.split('-')[0]);
        if (selectedYears.includes(tradeYear)) {
          rowsToDelete.push(index + 2); // +2 because: 0-indexed + header row
        }
      });

      // Delete rows in reverse order (bottom to top) to maintain indices
      rowsToDelete.sort((a, b) => b - a);

      // Get sheet metadata to get actual sheetId
      const sheetMetadata = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: sheetId
      });
      
      const tradesSheet = sheetMetadata.result.sheets.find(s => s.properties.title === SHEETS.TRADES);
      const tradesSheetId = tradesSheet.properties.sheetId;

      // Delete rows in batches
      for (const rowIndex of rowsToDelete) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: tradesSheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex
                }
              }
            }]
          }
        });
      }

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['trades'] });

      alert(`Successfully deleted ${rowsToDelete.length} trades from ${selectedYears.join(', ')}!`);
      setShowClearModal(false);
      setSelectedYears([]);
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to delete data: ' + error.message);
    } finally {
      setIsClearing(false);
    }
  };

  const toggleYear = (year) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  return (
    <>
      <Header title="Settings" />
      <div className="p-[1vw] max-w-3xl mx-auto space-y-6">
        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow label="Theme">
            <div className="text-text-secondary text-[0.85vw]">
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
              className="input py-[0.5vw]"
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.symbol}>
                  {curr.symbol} {curr.code}
                </option>
              ))}
            </select>
          </SettingRow>
        </Section>

        {/* Data Management */}
        <Section title="Data Management">
          <SettingRow label="Storage">
            <div className="text-text-secondary text-[0.85vw]">
              Google Sheets & Drive
            </div>
          </SettingRow>

          <SettingRow label="Clear Data">
            <button
              onClick={() => setShowClearModal(true)}
              disabled={yearsWithData.length === 0}
              className="px-[1vw] py-[0.5vw] bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[0.5vw] transition-all flex items-center gap-[0.5vw] font-semibold"
            >
              <Trash2 size={16} />
              Delete Year Data
            </button>
          </SettingRow>
        </Section>

        {/* About */}
        <Section title="About">
          <SettingRow label="Version">
            <div className="text-text-secondary text-[0.85vw]">
              1.0.0
            </div>
          </SettingRow>
        </Section>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-[1vw]">
          <div className="bg-slate-900 rounded-[1vw] border border-red-500/50 max-w-md w-full p-[1.5vw]">
            <div className="flex items-center gap-[0.75vw] mb-[1.5vw]">
              <div className="p-[0.75vw] bg-red-600/20 rounded-full">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-[1.5vw] font-black text-red-500">Delete Data</h3>
            </div>

            <div className="mb-[1.5vw]">
              <p className="text-slate-300 mb-[1vw]">
                Select which year(s) you want to delete:
              </p>

              {yearsWithData.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No data to delete</p>
              ) : (
                <div className="space-y-2">
                  {yearsWithData.map(year => {
                    const yearTrades = allTrades.filter(t => 
                      parseInt(t.date.split('-')[0]) === year
                    );
                    
                    return (
                      <label
                        key={year}
                        className={`flex items-center gap-[0.75vw] p-[1vw] rounded-[0.5vw] border-2 cursor-pointer transition-all ${
                          selectedYears.includes(year)
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedYears.includes(year)}
                          onChange={() => toggleYear(year)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-[1.15vw]">{year}</div>
                          <div className="text-[0.85vw] text-slate-400">
                            {yearTrades.length} trade{yearTrades.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {selectedYears.includes(year) && (
                          <Trash2 size={20} className="text-red-500" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedYears.length > 0 && (
                <div className="mt-[1vw] p-[1vw] bg-red-500/10 border border-red-500/30 rounded-[0.5vw]">
                  <p className="text-red-400 text-[0.85vw] font-semibold">
                    ⚠️ This will permanently delete all trades, tags, and screenshots for {selectedYears.join(', ')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-[0.75vw]">
              <button
                onClick={() => {
                  setShowClearModal(false);
                  setSelectedYears([]);
                }}
                disabled={isClearing}
                className="flex-1 px-[1vw] py-[0.75vw] bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-[0.5vw] transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={selectedYears.length === 0 || isClearing}
                className="flex-1 px-[1vw] py-[0.75vw] bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-[0.5vw] transition-all font-semibold flex items-center justify-center gap-[0.5vw]"
              >
                {isClearing ? (
                  <>Deleting...</>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Section = ({ title, children }) => (
  <div className="card">
    <h2 className="text-[1.15vw] font-bold mb-[1vw] pb-3 border-b border-border">
      {title}
    </h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SettingRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-[0.5vw]">
    <span className="text-[0.85vw] font-medium">{label}</span>
    <div>{children}</div>
  </div>
);

export default SettingsView;
