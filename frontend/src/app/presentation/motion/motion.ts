/** true si la persona pidió reducir el movimiento en su sistema (WCAG 2.3.3). En el servidor, siempre false. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** true con ratón o lápiz; false en pantallas táctiles, donde el efecto de inclinación no tiene sentido. */
export function hasFinePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
}
