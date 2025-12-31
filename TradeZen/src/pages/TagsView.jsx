import React from 'react';
import { Header } from '@/components/layout/Header';
import { useTags } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';

const TagsView = () => {
  const { data: tags = [], isLoading } = useTags();

  return (
    <>
      <Header title="Strategy Tags" />
      <div className="p-4 max-w-7xl mx-auto">
        {isLoading ? (
          <Loading type="skeleton-card" />
        ) : (
          <div className="space-y-3">
            {tags.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-text-secondary">
                  No tags yet. Add your first strategy tag!
                </p>
              </div>
            ) : (
              tags.map(tag => (
                <div key={tag.tagId} className="card flex items-center gap-3">
                  <span className="text-2xl">{tag.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium">{tag.name}</div>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TagsView;
