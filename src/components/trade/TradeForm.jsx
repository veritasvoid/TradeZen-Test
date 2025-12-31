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
  
  // Create default tag if none exist
  const defaultTag = {
    tagId: 'default',
    name: 'Trade',
    color: '#3b82f6',
    emoji: '📊'
  };
  
  const allTags = tags.length > 0 ? tags : [defaultTag];
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      date: trade?.date || defaultDateStr,
      time: trade?.time || defaultTime,
      amount: trade?.amount || '',
      tagId: trade?.tagId || allTags[0].tagId,
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
  
  const selectedTag = allTags.find(t => t.tagId === selectedTagId) || allTags[0];

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
    setImageDeleted(false); // Reset deletion flag when new image selected
  };

  const handleRemoveImage = () => {
    setScreenshot(null);
    setPreviewUrl(null);
    setImageDeleted(true); // Mark that user wants to delete the image
  };

  const onSubmit = async (data) => {
    if (!data.amount || data.amount === 0) {
      showToast('Please enter an amount', 'error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const tag = allTags.find(t => t.tagId === data.tagId) || allTags[0];
      
      if (isEditing) {
        // UPDATE existing trade
        const updates = {
          date: data.date,
          time: data.time,
          amount: parseFloat(data.amount),
          tagId: tag.tagId,
          tagName: tag.name,
          tagColor: tag.color,
          tagEmoji: tag.emoji,
          notes: data.notes
        };
        
        // Handle image changes
        if (imageDeleted) {
          // User explicitly deleted the image
          updates.driveImageId = ''; // Empty string to clear it
        } else if (screenshot) {
          // User uploaded a new image
          updates.screenshot = screenshot;
        }
        // If neither, keep existing image (don't send screenshot or driveImageId)
        
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
          tagId: tag.tagId,
          tagName: tag.name,
          tagColor: tag.color,
          tagEmoji: tag.emoji,
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time</label>
            <input
              type="time"
              {...register('time', { required: true })}
              className="input"
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text-tertiary">
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
                input pl-12 text-3xl font-bold text-center
                ${amount > 0 ? 'text-profit' : amount < 0 ? 'text-loss' : ''}
              `}
              placeholder="0.00"
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex gap-2 mt-2">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAmount(amt)}
                className={`
                  flex-1 py-2 px-3 rounded-md text-sm font-medium
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

        {/* Strategy Tag - MOVED UP with higher z-index */}
        <div className="relative z-20">
          <label className="block text-sm font-medium mb-2">
            Strategy Tag {tags.length === 0 && <span className="text-text-tertiary text-xs">(Create custom tags in Tags section)</span>}
          </label>
          <select
            {...register('tagId')}
            className="input w-full relative z-20"
          >
            {allTags.map(tag => (
              <option key={tag.tagId} value={tag.tagId}>
                {tag.emoji} {tag.name}
              </option>
            ))}
          </select>
          
          {selectedTag && (
            <div 
              className="mt-2 p-3 rounded-md text-sm"
              style={{ 
                backgroundColor: `${selectedTag.color}20`,
                color: selectedTag.color 
              }}
            >
              <span className="text-xl mr-2">{selectedTag.emoji}</span>
              <span className="font-medium">{selectedTag.name}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="relative z-10">
          <label className="block text-sm font-medium mb-2">
            Notes (optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="input resize-none w-full"
            placeholder="What happened? What did you learn?"
          />
        </div>

        {/* Screenshot - MOVED TO BOTTOM with lower z-index */}
        <div className="relative z-0">
          <label className="block text-sm font-medium mb-2">
            Screenshot (optional)
          </label>
          
          {!previewUrl ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="card border-2 border-dashed border-border hover:border-accent transition-colors text-center py-8">
                  <Camera size={32} className="mx-auto mb-2 text-text-secondary" />
                  <div className="text-sm text-text-secondary">Take Photo</div>
                </div>
              </label>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="card border-2 border-dashed border-border hover:border-accent transition-colors text-center py-8">
                  <Upload size={32} className="mx-auto mb-2 text-text-secondary" />
                  <div className="text-sm text-text-secondary">Upload</div>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
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
            {isEditing ? 'Update Trade' : 'Save Trade'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
