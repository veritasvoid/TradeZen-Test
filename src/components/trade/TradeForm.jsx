import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Upload, X } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { useAddTrade, useUpdateTrade } from '@/hooks/useTrades';
import { useToast } from '@/components/shared/Toast';
import { generateId } from '@/lib/utils';
import { QUICK_AMOUNTS } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settingsStore';
import { googleAPI } from '@/lib/googleAPI';

export const TradeForm = ({ defaultDate = null, trade = null, tags = [], onClose }) => {
  const { showToast } = useToast();
  const addTrade = useAddTrade();
  const updateTrade = useUpdateTrade();
  const currency = useSettingsStore(state => state.settings.currency);
  
  const isEditing = !!trade;
  const today = new Date();
  const defaultDateStr = defaultDate || today.toISOString().split('T')[0];
  const defaultTime = today.toTimeString().slice(0, 5);
  
  // NO TAG option always available
  const noTagOption = {
    tagId: 'none',
    name: 'No Tag',
    color: '#6b7280',
    emoji: '—'
  };
  
  const allTags = [noTagOption, ...tags];
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      date: trade?.date || defaultDateStr,
      time: trade?.time || defaultTime,
      amount: trade?.amount || '',
      tagId: trade?.tagId || 'none',
      notes: trade?.notes || ''
    }
  });
  
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    trade?.driveImageId ? googleAPI.getImageUrl(trade.driveImageId) : null
  );
  const [imageDeleted, setImageDeleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const amount = watch('amount');
  const selectedTagId = watch('tagId');
  
  const selectedTag = allTags.find(t => t.tagId === selectedTagId);

  const handleQuickAmount = (value) => {
    setValue('amount', value);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image too large (max 10MB)', 'error');
      return;
    }
    
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageDeleted(false);
  };

  const handleRemoveImage = () => {
    setScreenshot(null);
    setPreviewUrl(null);
    setImageDeleted(true);
  };

  const onSubmit = async (data) => {
    if (!data.amount || data.amount === 0) {
      showToast('Please enter an amount', 'error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Handle "No Tag" selection
      let tagData = {};
      if (data.tagId !== 'none') {
        const tag = allTags.find(t => t.tagId === data.tagId);
        tagData = {
          tagId: tag.tagId,
          tagName: tag.name,
          tagColor: tag.color,
          tagEmoji: tag.emoji
        };
      } else {
        // No tag selected
        tagData = {
          tagId: 'none',
          tagName: 'No Tag',
          tagColor: '#6b7280',
          tagEmoji: '—'
        };
      }
      
      if (isEditing) {
        // UPDATE existing trade
        const updates = {
          date: data.date,
          time: data.time,
          amount: parseFloat(data.amount),
          ...tagData,
          notes: data.notes
        };
        
        // Handle image changes
        if (imageDeleted) {
          updates.driveImageId = '';
        } else if (screenshot) {
          updates.screenshot = screenshot;
        }
        
        await updateTrade.mutateAsync({
          tradeId: trade.tradeId,
          updates
        });
      } else {
        // ADD new trade
        const tradeData = {
          tradeId: generateId(),
          date: data.date,
          time: data.time,
          amount: parseFloat(data.amount),
          ...tagData,
          screenshot: screenshot,
          notes: data.notes
        };
        
        await addTrade.mutateAsync(tradeData);
      }
      
      showToast(
        isEditing ? 'Trade updated' : 'Trade added',
        'success'
      );
      
      onClose();
    } catch (error) {
      console.error('Failed to save trade:', error);
      showToast('Failed to save trade', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Trade' : 'Add Trade'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Date and Time - COMPACT */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">Date</label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="input text-sm py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Time</label>
            <input
              type="time"
              {...register('time', { required: true })}
              className="input text-sm py-2"
            />
          </div>
        </div>

        {/* Amount - COMPACT */}
        <div>
          <label className="block text-xs font-medium mb-1.5">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-text-tertiary">
              {currency}
            </span>
            <input
              type="number"
              step="0.01"
              {...register('amount', { 
                required: true,
                valueAsNumber: true 
              })}
              className={`
                input pl-10 text-2xl font-bold text-center py-2
                ${amount > 0 ? 'text-profit' : amount < 0 ? 'text-loss' : ''}
              `}
              placeholder="0.00"
            />
          </div>
          
          {/* Quick Amount Buttons - COMPACT */}
          <div className="flex gap-1.5 mt-2">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAmount(amt)}
                className={`
                  flex-1 py-1.5 px-2 rounded-md text-xs font-semibold
                  transition-colors
                  ${amt > 0 
                    ? 'bg-profit/10 text-profit hover:bg-profit/20' 
                    : 'bg-loss/10 text-loss hover:bg-loss/20'
                  }
                `}
              >
                {amt > 0 ? '+' : ''}{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Tag - COMPACT */}
        <div className="relative z-20">
          <label className="block text-xs font-medium mb-1.5">
            Strategy Tag
          </label>
          <select
            {...register('tagId')}
            className="input w-full relative z-20 text-sm py-2"
          >
            {allTags.map(tag => (
              <option key={tag.tagId} value={tag.tagId}>
                {tag.emoji} {tag.name}
              </option>
            ))}
          </select>
          
          {/* Tag preview - ONLY show if NOT "No Tag" */}
          {selectedTag && selectedTag.tagId !== 'none' && (
            <div 
              className="mt-2 p-2 rounded-md text-xs"
              style={{ 
                backgroundColor: `${selectedTag.color}20`,
                color: selectedTag.color 
              }}
            >
              <span className="text-base mr-1.5">{selectedTag.emoji}</span>
              <span className="font-semibold">{selectedTag.name}</span>
            </div>
          )}
        </div>

        {/* Notes - COMPACT */}
        <div className="relative z-10">
          <label className="block text-xs font-medium mb-1.5">
            Notes (optional)
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            className="input resize-none w-full text-sm py-2"
            placeholder="What happened? What did you learn?"
          />
        </div>

        {/* Screenshot - ONLY if not already shown or editing with image */}
        {!previewUrl && (
          <div className="relative z-0">
            <label className="block text-xs font-medium mb-1.5">
              Screenshot (optional)
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="card border-2 border-dashed border-border hover:border-accent transition-colors text-center py-6">
                  <Camera size={24} className="mx-auto mb-1 text-text-secondary" />
                  <div className="text-xs text-text-secondary">Take Photo</div>
                </div>
              </label>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="card border-2 border-dashed border-border hover:border-accent transition-colors text-center py-6">
                  <Upload size={24} className="mx-auto mb-1 text-text-secondary" />
                  <div className="text-xs text-text-secondary">Upload</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Image Preview - COMPACT, shown separately */}
        {previewUrl && (
          <div className="relative z-0">
            <label className="block text-xs font-medium mb-1.5">Screenshot</label>
            <div className="relative">
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Actions - COMPACT */}
        <div className="flex gap-2 pt-2">
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
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
