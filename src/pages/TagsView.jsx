import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';

const TagsView = () => {
  const queryClient = useQueryClient();
  const { data: tags = [], isLoading, error, refetch } = useTags();

  useEffect(() => {
    console.log('=== TAGS VIEW DEBUG ===');
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('tags:', tags);
    console.log('tags array:', JSON.stringify(tags, null, 2));
    
    // Clear tags cache and refetch on mount
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    setTimeout(() => {
      refetch();
    }, 500);
  }, []);

  const handleRefresh = () => {
    queryClient.removeQueries({ queryKey: ['tags'] });
    setTimeout(() => refetch(), 100);
  };

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto" style={{ paddingTop: '100px' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Strategy Tags</h1>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div>
          <Loading type="skeleton-card" />
          <p className="text-center text-slate-400 mt-4">Loading tags...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12 bg-red-900/20">
          <p className="text-red-400 mb-4">Error: {error?.message || 'Unknown error'}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : !tags || tags.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-bold mb-2">No Tags Found</h3>
          <p className="text-slate-400 mb-4">
            Tags should appear here from your Google Sheet
          </p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Check Again
          </button>
          <div className="mt-4 p-4 bg-slate-800 rounded-lg text-left">
            <div className="text-xs text-slate-400">Debug Info:</div>
            <div className="text-xs text-slate-300 font-mono">
              isLoading: {isLoading.toString()}<br />
              tags.length: {tags?.length || 0}<br />
              error: {error ? error.message : 'none'}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm mb-4">Found {tags.length} tag(s)</p>
          {tags.map(tag => (
            <div 
              key={tag.tagId} 
              className="card hover:bg-surface-hover transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{tag.emoji}</span>
                <div className="flex-1">
                  <div className="text-xl font-bold" style={{ color: tag.color }}>
                    {tag.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    ID: {tag.tagId}
                  </div>
                </div>
                <div 
                  className="w-8 h-8 rounded-full shadow-lg" 
                  style={{ backgroundColor: tag.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagsView;
