/**
 * Utility function for merging Tailwind CSS classes
 *
 * Combines clsx (conditional class concatenation) with tailwind-merge
 * (intelligent Tailwind class conflict resolution).
 *
 * USE THIS FUNCTION FOR ALL className ATTRIBUTES.
 * Do NOT use template literals or string concatenation for classes.
 *
 * @example
 * // Basic usage
 * cn('bg-white', 'p-4', className)
 *
 * // Conditional classes
 * cn('base-class', { 'active-class': isActive, 'disabled-class': isDisabled })
 *
 * // Array of classes
 * cn(['class-1', 'class-2'], conditionalClass && 'class-3')
 *
 * // Resolves Tailwind conflicts (last one wins)
 * cn('p-4', 'p-2') // → 'p-2'
 * cn('bg-red-500', 'bg-blue-500') // → 'bg-blue-500'
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
