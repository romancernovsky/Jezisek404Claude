  // The site root shows the big screen. A phone that lands here (e.g. someone typed the base address)
  // is sent to the voting page instead. /screen itself is never redirected.
  if (location.pathname === '/' && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820) location.replace('/vote' + location.search);
