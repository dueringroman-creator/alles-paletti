// ID and number generators

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateBookingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = Math.floor(Math.random() * 9999) + 1;
  return `EB-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
}

export function generateStopNumber(index: number): string {
  return `STP-${String(index + 1).padStart(3, '0')}`;
}

export function generateTransactionNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = Math.floor(Math.random() * 99999) + 1;
  return `TXN-${year}${month}${day}-${String(sequence).padStart(5, '0')}`;
}

export function generateReconciliationNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = Math.floor(Math.random() * 9999) + 1;
  return `REC-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
}

export function generateDisputeNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = Math.floor(Math.random() + 9999) + 1;
  return `DSP-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
}

export function generateDocumentNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = Math.floor(Math.random() * 9999) + 1;
  return `DOC-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
