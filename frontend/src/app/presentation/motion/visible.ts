import type { DestroyRef } from '@angular/core';

/**
 * Llama a `callback` una sola vez, cuando el elemento entra en la pantalla.
 * Sin IntersectionObserver (navegadores muy antiguos), lo llama enseguida.
 */
export function onceVisible(
  element: Element,
  callback: () => void,
  destroyRef: DestroyRef,
  rootMargin = '0px 0px -15% 0px',
): void {
  if (typeof IntersectionObserver === 'undefined') {
    callback();
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      callback();
    },
    { rootMargin },
  );
  observer.observe(element);
  destroyRef.onDestroy(() => observer.disconnect());
}
