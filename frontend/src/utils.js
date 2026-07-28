/*
 * RetailIQ Frontend Application
 * File: utils.js
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
export const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$ 0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(num).replace('$', '$ ').trim();
};
