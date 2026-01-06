import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { googleAPI } from '@/lib/googleAPI';
import { STORAGE_KEYS, SHEETS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

// Parse trade row from Sheets
const parseTradeRow = (row) => {
  if (!row || row.length < 12) return null;
  
  return {
    tradeId: row[0],
    date: row[1],
    time: row[2],
    amount: parseFloat(row[3]) || 0,
    tagId: row[4],
    tagName: row[5],
    tagColor: row[6],
    tagEmoji: row[7],
    driveImageId: row[8] || null,
    notes: row[9] || '',
    createdAt: row[10],
    updatedAt: row[11]
  };
};

// Fetch all trades
const fetchTrades = async () => {
  // Use hardcoded sheet ID - guaranteed to work
  const sheetId = '1ruzm5D-ofifAU7d5oRChBT7DAYFTlVLgULSsXvYEtXU';
  
  console.log('🔍 Fetching all trades from sheet:', sheetId);

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEETS.TRADES}!A2:L`
    });

    const rows = response.result.values || [];
    console.log('📥 Received rows from sheet:', rows.length);
    
    const parsed = rows.map(parseTradeRow).filter(Boolean);
    console.log('✅ Parsed trades:', parsed.length);
    
    return parsed;
  } catch (error) {
    console.error('❌ Failed to fetch trades:', error);
    return [];
  }
};

// Fetch trades for specific month
const fetchMonthTrades = async (year, month) => {
  console.log(`📅 Fetching trades for: ${year}-${month} (month is 0-indexed, so ${month} = ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]})`);
  
  const allTrades = await fetchTrades();
  console.log(`📊 Total trades in sheet: ${allTrades.length}`);
  
  if (allTrades.length > 0) {
    console.log('📋 All trade dates:', allTrades.map(t => t.date));
  }
  
  const filtered = allTrades.filter(trade => {
    const [tradeYear, tradeMonth] = trade.date.split('-').map(Number);
    const matches = tradeYear === year && tradeMonth === month + 1;
    
    if (!matches) {
      console.log(`  ❌ Trade ${trade.date} doesn't match: tradeYear=${tradeYear} vs ${year}, tradeMonth=${tradeMonth} vs ${month + 1}`);
    } else {
      console.log(`  ✅ Trade ${trade.date} MATCHES!`);
    }
    
    return matches;
  });
  
  console.log(`✅ Filtered to ${filtered.length} trades for ${year}-${month + 1}`);
  return filtered;
};

// Add trade
const addTrade = async (tradeData) => {
  const sheetId = await googleAPI.getOrCreateSpreadsheet();
  
  // Upload image if exists
  let driveImageId = null;
  if (tradeData.screenshot) {
    // Compress image
    const compressed = await imageCompression(tradeData.screenshot, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    });
    
    // FIX #2: Use date-time format for filename
    const timeStr = tradeData.time ? tradeData.time.replace(/:/g, '-') : 'no-time';
    const filename = `${tradeData.date}_${timeStr}.jpg`;
    driveImageId = await googleAPI.uploadImage(compressed, filename);
  }

  const now = new Date().toISOString();
  const rowData = [
    tradeData.tradeId,
    tradeData.date,
    tradeData.time,
    tradeData.amount,
    tradeData.tagId,
    tradeData.tagName,
    tradeData.tagColor,
    tradeData.tagEmoji,
    driveImageId || '',
    tradeData.notes || '',
    now,
    now
  ];

  await window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${SHEETS.TRADES}!A:L`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [rowData]
    }
  });

  return {
    ...tradeData,
    driveImageId,
    createdAt: now,
    updatedAt: now
  };
};

// Update trade
const updateTrade = async ({ tradeId, updates }) => {
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  
  // Find row index
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEETS.TRADES}!A:A`
  });

  const rows = response.result.values || [];
  const rowIndex = rows.findIndex(row => row[0] === tradeId);
  
  if (rowIndex === -1) {
    throw new Error('Trade not found');
  }

  // Get existing trade data
  const tradeResponse = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEETS.TRADES}!A${rowIndex + 1}:L${rowIndex + 1}`
  });

  const existingData = tradeResponse.result.values[0];
  const trade = parseTradeRow(existingData);

  // Handle image update
  let driveImageId = trade.driveImageId;
  if (updates.screenshot) {
    const compressed = await imageCompression(updates.screenshot, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    });
    
    // FIX #2: Use date-time format for filename
    const tradeDate = updates.date || trade.date;
    const tradeTime = updates.time || trade.time;
    const timeStr = tradeTime ? tradeTime.replace(/:/g, '-') : 'no-time';
    const filename = `${tradeDate}_${timeStr}.jpg`;
    driveImageId = await googleAPI.uploadImage(compressed, filename);
  }

  const now = new Date().toISOString();
  const updatedData = [
    tradeId,
    updates.date !== undefined ? updates.date : trade.date,
    updates.time !== undefined ? updates.time : trade.time,  // FIX #1: Allow empty string
    updates.amount !== undefined ? updates.amount : trade.amount,
    updates.tagId !== undefined ? updates.tagId : trade.tagId,
    updates.tagName !== undefined ? updates.tagName : trade.tagName,
    updates.tagColor !== undefined ? updates.tagColor : trade.tagColor,
    updates.tagEmoji !== undefined ? updates.tagEmoji : trade.tagEmoji,
    driveImageId !== undefined ? driveImageId : (trade.driveImageId || ''),
    updates.notes !== undefined ? updates.notes : trade.notes,
    trade.createdAt,
    now
  ];

  await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEETS.TRADES}!A${rowIndex + 1}:L${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [updatedData]
    }
  });

  return parseTradeRow(updatedData);
};

// Delete trade
const deleteTrade = async (tradeId) => {
  // FIX #5: Use hardcoded sheet ID
  const sheetId = '1ruzm5D-ofifAU7d5oRChBT7DAYFTlVLgULSsXvYEtXU';
  
  console.log('🗑️ Deleting trade:', tradeId);
  
  // Find row index
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEETS.TRADES}!A:A`
  });

  const rows = response.result.values || [];
  const rowIndex = rows.findIndex(row => row[0] === tradeId);
  
  if (rowIndex === -1) {
    throw new Error('Trade not found');
  }

  console.log('📍 Found trade at row:', rowIndex);

  // Get the actual sheet ID (not spreadsheet ID)
  const sheetMetadata = await window.gapi.client.sheets.spreadsheets.get({
    spreadsheetId: sheetId
  });
  
  const tradesSheet = sheetMetadata.result.sheets.find(s => s.properties.title === SHEETS.TRADES);
  const tradesSheetId = tradesSheet.properties.sheetId;

  // Delete row using correct sheetId
  await window.gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: tradesSheetId, // FIX: Use actual sheet ID, not 0
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  });
  
  console.log('✅ Trade deleted successfully');
};

// Custom hooks
export const useTrades = () => {
  return useQuery({
    queryKey: ['trades'],
    queryFn: fetchTrades,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });
};

export const useMonthTrades = (year, month) => {
  return useQuery({
    queryKey: ['trades', year, month],
    queryFn: () => fetchMonthTrades(year, month),
    staleTime: 5 * 60 * 1000
  });
};

export const useAddTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addTrade,
    onMutate: async (newTrade) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['trades'] });
      
      // Snapshot previous value
      const previousTrades = queryClient.getQueryData(['trades']);
      
      // Optimistically update
      if (previousTrades) {
        queryClient.setQueryData(['trades'], old => [...(old || []), newTrade]);
      }
      
      return { previousTrades };
    },
    onError: (err, newTrade, context) => {
      // Rollback on error
      if (context?.previousTrades) {
        queryClient.setQueryData(['trades'], context.previousTrades);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    }
  });
};

export const useUpdateTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    }
  });
};

export const useDeleteTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTrade,
    onMutate: async (tradeId) => {
      await queryClient.cancelQueries({ queryKey: ['trades'] });
      
      const previousTrades = queryClient.getQueryData(['trades']);
      
      if (previousTrades) {
        queryClient.setQueryData(['trades'], old => 
          (old || []).filter(t => t.tradeId !== tradeId)
        );
      }
      
      return { previousTrades };
    },
    onError: (err, tradeId, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(['trades'], context.previousTrades);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    }
  });
};
