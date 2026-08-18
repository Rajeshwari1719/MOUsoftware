export const formatDate = (date) => {
  if (!date) return 'N/A';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return 'N/A';
  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
