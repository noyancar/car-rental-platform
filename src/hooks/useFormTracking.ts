// ================================================
// useFormTracking Hook
// Purpose: Track form field interactions and validation errors
// ================================================

import { useEffect } from 'react';
import { tracker } from '../lib/analytics/tracker';

export function useFormTracking(formName: string) {
  useEffect(() => {
    const form = document.querySelector(`[data-form="${formName}"]`) as HTMLFormElement;

    if (!form) {
      console.warn(`[Analytics] Form not found: ${formName}`);
      return;
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      ) {
        tracker.trackFormInteraction({
          formName,
          fieldName: target.name || target.id || 'unknown',
          interactionType: 'focus',
        });
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      ) {
        tracker.trackFormInteraction({
          formName,
          fieldName: target.name || target.id || 'unknown',
          interactionType: 'blur',
          fieldValue: target.value ? 'filled' : 'empty',
        });
      }
    };

    const handleInvalid = (e: Event) => {
      const target = e.target as HTMLInputElement;
      tracker.trackFormInteraction({
        formName,
        fieldName: target.name || target.id || 'unknown',
        interactionType: 'validation_error',
        errorMessage: target.validationMessage,
      });
    };

    const handleSubmit = () => {
      tracker.trackFormInteraction({
        formName,
        fieldName: 'form',
        interactionType: 'submit',
      });
    };

    form.addEventListener('focusin', handleFocus);
    form.addEventListener('focusout', handleBlur);
    form.addEventListener('invalid', handleInvalid, true);
    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('focusin', handleFocus);
      form.removeEventListener('focusout', handleBlur);
      form.removeEventListener('invalid', handleInvalid, true);
      form.removeEventListener('submit', handleSubmit);
    };
  }, [formName]);
}
