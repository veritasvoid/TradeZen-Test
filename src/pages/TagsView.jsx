import React, { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';
import { useTags, useAddTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags';
import { Loading } from '@/components/shared/Loading';
import { generateId } from '@/lib/utils';
import { TAG_COLORS, TAG_EMOJIS } from '@/lib/constants';

const TagsView = () => {
  const { data: tags = [], isLoading } = useTags();
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const handleAddTag = () => {
    setEditingTag(null);
    setShowTagForm(true);
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    setShowTagForm(true);
  };

  const handleCloseForm = () => {
    setShowTagForm(false);
    setEditingTag(null);
  };

  return (
    <>
      <Header 
        title="Strategy Tags"
        actions={
          <Button
            onClick={handleAddTag}
            size="sm"
          >
            <Plus size={18} className="mr-1" />
            New Tag
          </Button>
        }
      />
      
      <div className="p-4 max-w-3xl mx-auto">
        {isLoading ? (
          <Loading type="skeleton-card" />
        ) : tags.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">🏷️</div>
            <p className="text-text-secondary mb-4">
              No strategy tags yet
            </p>
            <p className="text-sm text-text-tertiary mb-6">
              Create tags to categorize your trades by setup type
            </p>
            <Button onClick={handleAddTag}>
              <Plus size={18} className="mr-2" />
              Create Your First Tag
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-text-tertiary text-sm">
              {tags.length} tag{tags.length !== 1 ? 's' : ''}
            </p>
            
            {tags.map(tag => (
              <TagCard
                key={tag.tagId}
                tag={tag}
                onEdit={handleEditTag}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tag Form Modal */}
      {showTagForm && (
        <TagForm
          tag={editingTag}
          existingTags={tags}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
};

const TagCard = ({ tag, onEdit }) => {
  const { showToast } = useToast();
  const deleteTag = useDeleteTag();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${tag.name}" tag?`)) return;
    
    try {
      setIsDeleting(true);
      await deleteTag.mutateAsync(tag.tagId);
      showToast('Tag deleted', 'success');
    } catch (error) {
      showToast('Failed to delete tag', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="card border-l-4 hover:bg-surface-hover transition-colors"
      style={{ borderLeftColor: tag.color }}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button className="p-2 cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary">
          <GripVertical size={20} />
        </button>

        {/* Tag Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{tag.emoji}</span>
            <span className="text-lg font-semibold">{tag.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: tag.color }}
            />
            <span className="text-sm text-text-tertiary">
              {TAG_COLORS.find(c => c.value === tag.color)?.name || 'Custom'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tag)}
            className="text-text-secondary hover:text-accent"
          >
            <Edit size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            loading={isDeleting}
            className="text-text-secondary hover:text-loss"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const TagForm = ({ tag, existingTags, onClose }) => {
  const { showToast } = useToast();
  const addTag = useAddTag();
  const updateTag = useUpdateTag();
  
  const isEditing = !!tag;
  
  const [name, setName] = useState(tag?.name || '');
  const [emoji, setEmoji] = useState(tag?.emoji || TAG_EMOJIS[0]);
  const [color, setColor] = useState(tag?.color || TAG_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showToast('Please enter a tag name', 'error');
      return;
    }
    
    // Check for duplicate names (excluding current tag when editing)
    const duplicate = existingTags.find(
      t => t.name.toLowerCase() === name.trim().toLowerCase() && t.tagId !== tag?.tagId
    );
    
    if (duplicate) {
      showToast('A tag with this name already exists', 'error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        await updateTag.mutateAsync({
          tagId: tag.tagId,
          updates: { name: name.trim(), emoji, color }
        });
        showToast('Tag updated', 'success');
      } else {
        const newTag = {
          tagId: generateId(),
          name: name.trim(),
          emoji,
          color,
          order: existingTags.length
        };
        await addTag.mutateAsync(newTag);
        showToast('Tag created', 'success');
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save tag:', error);
      showToast('Failed to save tag', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Tag' : 'Create Tag'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preview */}
        <div 
          className="card text-center py-6"
          style={{ 
            backgroundColor: `${color}20`,
            borderColor: color,
            borderWidth: '2px'
          }}
        >
          <div className="text-4xl mb-2">{emoji}</div>
          <div className="text-xl font-semibold" style={{ color }}>
            {name || 'Tag Name'}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Tag Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g., Break & Retest"
            maxLength={50}
            autoFocus
          />
        </div>

        {/* Emoji Picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Emoji</label>
          <div className="grid grid-cols-8 gap-2">
            {TAG_EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`
                  text-2xl p-2 rounded-lg transition-colors
                  ${emoji === e 
                    ? 'bg-accent text-white' 
                    : 'bg-surface hover:bg-surface-hover'
                  }
                `}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="grid grid-cols-4 gap-3">
            {TAG_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`
                  p-3 rounded-lg transition-all
                  ${color === c.value 
                    ? 'ring-2 ring-offset-2 ring-accent scale-105' 
                    : 'hover:scale-105'
                  }
                `}
                style={{ backgroundColor: c.value }}
              >
                <div className="text-white text-xs font-medium">
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={isSubmitting}
          >
            {isEditing ? 'Update Tag' : 'Create Tag'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TagsView;
