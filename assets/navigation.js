'use strict';
// Wrapped menu items and font resizing can change the header height on mobile.
// Native smooth scrolling is defined in CSS and respects reduced-motion settings.
const navigationHeader = document.querySelector('.site-header');
if (navigationHeader) {
  const updateNavigationOffset = () => {
    document.documentElement.style.setProperty(
      '--navigation-offset', `${Math.ceil(navigationHeader.getBoundingClientRect().height) + 16}px`
    );
  };
  updateNavigationOffset();
  new ResizeObserver(updateNavigationOffset).observe(navigationHeader);
}
