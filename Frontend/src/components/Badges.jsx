export const STATUTS = ['Nouveau', 'En cours', 'En attente', 'Résolu', 'Clôturé'];
export const PRIORITES = ['Basse', 'Moyenne', 'Haute', 'Critique'];
export const CATEGORIES = ['Technique', 'Fonctionnel', 'Accès', 'Demande', 'Autre'];

export function StatusBadge({ value }) {
  const key = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
  return <span className={`badge badge-status status-${key}`}>{value}</span>;
}

export function PriorityBadge({ value }) {
  const key = String(value || '').toLowerCase();
  return <span className={`badge badge-priority priority-${key}`}>{value}</span>;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
