/**
 * Icon creation utilities for Iran Amplifier extension.
 */

/**
 * Create Iran flag icon element as an img tag
 * @param {string} size - CSS size (e.g., '16px', '1em')
 * @returns {Element} img element
 */
export function createFlagIcon(size = '1em') {
  const img = document.createElement('img');
  img.src = browser.runtime.getURL('icons/iran.svg');
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.style.width = size;
  img.style.height = size;
  img.style.display = 'inline-block';
  img.style.verticalAlign = 'middle';
  return img;
}

/**
 * Create an SVG icon element
 * @param {string} name - Icon name: 'copy', 'check', 'reply', 'quote', 'refresh'
 * @param {string} size - CSS size (e.g., '14px', '1em')
 * @returns {Element} SVG element
 */
export function createIcon(name, size = '14px') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.style.display = 'inline-block';
  svg.style.verticalAlign = 'middle';

  // Refresh, quote, and reply icons use 24x24 viewBox, others use 14x14
  if (name === 'refresh' || name === 'quote' || name === 'reply') {
    svg.setAttribute('viewBox', '0 0 24 24');
  } else {
    svg.setAttribute('viewBox', '0 0 14 14');
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', name === 'refresh' ? '2' : '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  switch (name) {
    case 'copy':
      path.setAttribute(
        'd',
        'M8 4V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2m3-4h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z'
      );
      break;
    case 'check':
      path.setAttribute('d', 'M2 7l4 4 6-8');
      path.setAttribute('stroke-width', '2');
      break;
    case 'reply':
      // Speech bubble icon (X's reply style)
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('stroke', 'none');
      path.setAttribute(
        'd',
        'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z'
      );
      break;
    case 'quote':
      // Pencil/edit icon (X's repost-with-comment style)
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('stroke', 'none');
      path.setAttribute(
        'd',
        'M14.23 2.854c.98-.977 2.56-.977 3.54 0l3.38 3.378c.97.977.97 2.559 0 3.536L9.91 21H3v-6.914L14.23 2.854zm2.12 1.414c-.19-.195-.51-.195-.7 0L5 14.914V19h4.09L19.73 8.354c.2-.196.2-.512 0-.708l-3.38-3.378zM14.75 19l-2 2H21v-2h-6.25z'
      );
      break;
    case 'refresh':
      // Lucide rotate-ccw icon (two paths)
      path.setAttribute('d', 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('fill', 'none');
      path2.setAttribute('stroke', 'currentColor');
      path2.setAttribute('stroke-width', '2');
      path2.setAttribute('stroke-linecap', 'round');
      path2.setAttribute('stroke-linejoin', 'round');
      path2.setAttribute('d', 'M3 3v5h5');
      svg.appendChild(path2);
      break;
  }

  svg.appendChild(path);
  return svg;
}
