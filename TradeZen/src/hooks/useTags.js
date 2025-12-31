import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { googleAPI } from '@/lib/googleAPI';
import { STORAGE_KEYS, SHEETS } from '@/lib/constants';

// Parse tag row from Sheets
const parseTagRow = (row) => {
  if (!row || row.length < 5) return null;
  
  return {
    tagId: row[0],
    name: row[1],
    color: row[2],
    emoji: row[3],
    order: parseInt(row[4]) || 0
  };
};

// Fetch all tags
const fetchTags = async () => {
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  if (!sheetId) {
    // Return default tags if no sheet exists yet
    return [];
  }

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEETS.TAGS}!A2:E`
    });

    const rows = response.result.values || [];
    const tags = rows.map(parseTagRow).filter(Boolean);
    
    // Sort by order
    return tags.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return [];
  }
};

// Add tag
const addTag = async (tagData) => {
  const sheetId = await googleAPI.getOrCreateSpreadsheet();
  
  const rowData = [
    tagData.tagId,
    tagData.name,
    tagData.color,
    tagData.emoji,
    tagData.order || 0
  ];

  await window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${SHEETS.TAGS}!A:E`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [rowData]
    }
  });

  return tagData;
};

// Update tag
const updateTag = async ({ tagId, updates }) => {
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  
  // Find row index
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEETS.TAGS}!A:A`
  });

  const rows = response.result.values || [];
  const rowIndex = rows.findIndex(row => row[0] === tagId);
  
  if (rowIndex === -1) {
    throw new Error('Tag not found');
  }

  // Get existing tag data
  const tagResponse = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEETS.TAGS}!A${rowIndex + 1}:E${rowIndex + 1}`
  });

  const existingData = tagResponse.result.values[0];
  const tag = parseTagRow(existingData);

  const updatedData = [
    tagId,
    updates.name || tag.name,
    updates.color || tag.color,
    updates.emoji || tag.emoji,
    updates.order !== undefined ? updates.order : tag.order
  ];

  await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEETS.TAGS}!A${rowIndex + 1}:E${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [updatedData]
    }
  });

  return parseTagRow(updatedData);
};

// Delete tag
const deleteTag = async (tagId) => {
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  
  // Find row index
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEETS.TAGS}!A:A`
  });

  const rows = response.result.values || [];
  const rowIndex = rows.findIndex(row => row[0] === tagId);
  
  if (rowIndex === -1) {
    throw new Error('Tag not found');
  }

  // Delete row
  await window.gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 1, // Tags sheet
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  });
};

// Reorder tags
const reorderTags = async (tags) => {
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  
  // Update order for each tag
  const updates = tags.map((tag, index) => ({
    tagId: tag.tagId,
    updates: { order: index }
  }));

  for (const update of updates) {
    await updateTag(update);
  }

  return tags;
};

// Custom hooks
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 60 * 60 * 1000 // 1 hour
  });
};

export const useAddTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });
};

export const useReorderTags = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reorderTags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });
};
