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
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  if (!sheetId) return [];

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEETS.TRADES}!A2:L`
    });

    const rows = response.result.values || [];
    return rows.map(parseTradeRow).filter(Boolean);
  } catch (error) {
    console.error('Failed to fetch trades:', error);
    return [];
  }
};

// Fetch trades for specific month
const fetchMonthTrades = async (year, month) => {
  const allTrades = await fetchTrades();
  return allTrades.filter(trade => {
    const [tradeYear, tradeMonth] = trade.date.split('-').map(Number);
    return tradeYear === year && tradeMonth === month + 1;
  });
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
    
    const filename = `${tradeData.tradeId}_${tradeData.date}.jpg`;
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
    
    const filename = `${tradeId}_${updates.date || trade.date}.jpg`;
    driveImageId = await googleAPI.uploadImage(compressed, filename);
  }

  const now = new Date().toISOString();
  const updatedData = [
    tradeId,
    updates.date || trade.date,
    updates.time || trade.time,
    updates.amount !== undefined ? updates.amount : trade.amount,
    updates.tagId || trade.tagId,
    updates.tagName || trade.tagName,
    updates.tagColor || trade.tagColor,
    updates.tagEmoji || trade.tagEmoji,
    driveImageId || '',
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

  // Delete row
  await window.gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  });
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
