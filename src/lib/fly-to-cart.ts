/**
 * "Fly to cart" micro-interaction: a small clone of the service thumbnail
 * flies from the clicked "Add" button to the header cart button and fades
 * out on arrival, which then fires `CART_FLY_ARRIVED_EVENT` so the cart
 * button can react (icon bounce) in sync with the animation instead of
 * waiting on the add-to-cart request's own timing. Pure DOM/Web Animations
 * API — no React tree to mount, so it works from any click handler without
 * a portal or shared context between unrelated components (the card and
 * the header aren't in the same component tree).
 */

export const CART_BUTTON_ID = "header-cart-button";
export const CART_FLY_ARRIVED_EVENT = "cart:fly-arrived";

const FLIGHT_DURATION_MS = 650;

export function flyToCart(sourceEl: HTMLElement, imageUrl?: string): void {
  const target = document.getElementById(CART_BUTTON_ID);
  if (!target || typeof window === "undefined") return;
  // Respect reduced-motion — just signal arrival immediately so the cart
  // icon still acknowledges the add, without the flight itself.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    window.dispatchEvent(new CustomEvent(CART_FLY_ARRIVED_EVENT));
    return;
  }

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const dx = endX - startX;
  const dy = endY - startY;

  const flyer = document.createElement("div");
  flyer.className = "fly-to-cart-dot";
  flyer.style.left = `${startX}px`;
  flyer.style.top = `${startY}px`;
  if (imageUrl) flyer.style.backgroundImage = `url(${imageUrl})`;
  document.body.appendChild(flyer);

  const animation = flyer.animate(
    [
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0 },
      // Arcs upward through the midpoint (lifted 60px above the straight
      // line) before dropping into the cart button — a plain linear
      // translate reads as sliding, not "tossed in".
      {
        transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.45 - 60}px)) scale(0.55)`,
        opacity: 1,
        offset: 0.6,
      },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.15)`,
        opacity: 0,
        offset: 1,
      },
    ],
    { duration: FLIGHT_DURATION_MS, easing: "cubic-bezier(0.3, 0, 0.2, 1)" }
  );

  animation.onfinish = () => {
    flyer.remove();
    window.dispatchEvent(new CustomEvent(CART_FLY_ARRIVED_EVENT));
  };
}
