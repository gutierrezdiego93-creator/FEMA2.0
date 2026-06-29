export function formatearFecha(fechaISO) {
  if (!fechaISO) return '-';
  const fecha = new Date(fechaISO);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();
  return `${dia} ${mes} ${anio}`;
}

export function formatearHora(segundos) {
  if (!segundos) return '00:10';
  const h = Math.floor(segundos / 3600).toString().padStart(2, '0');
  const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function colorPrioridad(prioridad) {
  const p = (prioridad || '').toUpperCase();
  if (p === 'VERY_HIGH' || p === 'MUY_ALTA') return '#e53e3e';
  if (p === 'HIGH' || p === 'ALTA') return '#dd6b20';
  if (p === 'MEDIUM' || p === 'MEDIA') return '#d69e2e';
  if (p === 'LOW' || p === 'BAJA') return '#38a169';
  if (p === 'VERY_LOW' || p === 'MUY_BAJA') return '#3182ce';
  return '#718096';
}

export function etiquetaPrioridad(prioridad) {
  const p = (prioridad || '').toUpperCase();
  if (p === 'VERY_HIGH') return 'MUY ALTA';
  if (p === 'HIGH') return 'ALTA';
  if (p === 'MEDIUM') return 'MEDIA';
  if (p === 'LOW') return 'BAJA';
  if (p === 'VERY_LOW') return 'MUY BAJA';
  return prioridad || 'MEDIA';
}

export function extraerCodigoActivo(nombre) {
  const match = nombre.match(/\{\s*([^}]+)\s*\}/);
  return match ? match[1].trim() : '';
}

export function extraerNombreActivo(nombre) {
  return nombre.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
}

export function esAtrasada(fechaISO, delay) {
  if (delay > 0) return true;
  if (!fechaISO) return false;
  return new Date(fechaISO) < new Date();
}

export function formatearTaller(taller) {
  if (!taller) return '';
  const partes = taller.split('/').filter(p => p.trim());
  return partes[partes.length - 1]?.trim() || taller;
}
