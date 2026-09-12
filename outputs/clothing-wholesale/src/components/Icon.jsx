const P = {
  home: <><path d="M3.2 10.6 12 3.4l8.8 7.2" /><path d="M5.6 9.4V19a1.6 1.6 0 0 0 1.6 1.6h9.6A1.6 1.6 0 0 0 18.4 19V9.4" /></>,
  'home-fill': <path d="M11.1 3.2a1.4 1.4 0 0 1 1.8 0l8 6.6a1 1 0 0 1-.6 1.8h-.9V19a2 2 0 0 1-2 2h-3.4v-5.4h-4V21H6.6a2 2 0 0 1-2-2v-7.4h-.9a1 1 0 0 1-.6-1.8z" fill="currentColor" stroke="none" />,
  grid: <><rect x="3.6" y="3.6" width="7" height="7" rx="2" /><rect x="13.4" y="3.6" width="7" height="7" rx="2" /><rect x="3.6" y="13.4" width="7" height="7" rx="2" /><rect x="13.4" y="13.4" width="7" height="7" rx="2" /></>,
  'grid-fill': <><rect x="3.6" y="3.6" width="7" height="7" rx="2" fill="currentColor" stroke="none" /><rect x="13.4" y="3.6" width="7" height="7" rx="2" fill="currentColor" stroke="none" /><rect x="3.6" y="13.4" width="7" height="7" rx="2" fill="currentColor" stroke="none" /><rect x="13.4" y="13.4" width="7" height="7" rx="2" fill="currentColor" stroke="none" /></>,
  spark: <path d="m12 3.6 1.9 4.6 4.6 1.9-4.6 1.9L12 16.6l-1.9-4.6L5.5 10.1l4.6-1.9z" />,
  'spark-fill': <path d="m12 3.2 2.1 5 5 2.1-5 2.1-2.1 5-2.1-5-5-2.1 5-2.1z" fill="currentColor" stroke="none" />,
  cart: <><circle cx="9.6" cy="19.4" r="1.4" /><circle cx="17" cy="19.4" r="1.4" /><path d="M2.8 4h2.4l2.3 10.4a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7.4H6.1" /></>,
  user: <><circle cx="12" cy="8.4" r="3.6" /><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" /></>,
  search: <><circle cx="11" cy="11" r="6.4" /><path d="m15.8 15.8 4.7 4.7" /></>,
  scan: <><path d="M4 9V6.2A2.2 2.2 0 0 1 6.2 4H9M20 9V6.2A2.2 2.2 0 0 0 17.8 4H15M4 15v2.8A2.2 2.2 0 0 0 6.2 20H9M20 15v2.8A2.2 2.2 0 0 1 17.8 20H15" /><path d="M8 12h8" /></>,
  camera: <><path d="M4 8.8h2.9l1.3-2h7.6l1.3 2H20a1.4 1.4 0 0 1 1.4 1.4v8a1.4 1.4 0 0 1-1.4 1.4H4a1.4 1.4 0 0 1-1.4-1.4v-8A1.4 1.4 0 0 1 4 8.8z" /><circle cx="12" cy="14" r="3.2" /></>,
  heart: <path d="M12 20.2c-.4 0-7.4-4.5-7.4-9.6A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.4 3.1c0 5.1-7 9.6-7.4 9.6z" />,
  'heart-fill': <path d="M12 20.2c-.4 0-7.4-4.5-7.4-9.6A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.4 3.1c0 5.1-7 9.6-7.4 9.6z" fill="currentColor" stroke="none" />,
  star: <path d="m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z" />,
  'star-fill': <path d="m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z" fill="currentColor" stroke="none" />,
  back: <path d="M14.6 5 8 12l6.6 7" />,
  right: <path d="m9.6 5.4 6.6 6.6-6.6 6.6" />,
  down: <path d="m5.6 9.2 6.4 6.4 6.4-6.4" />,
  up: <path d="m5.6 14.8 6.4-6.4 6.4 6.4" />,
  plus: <path d="M12 5.6v12.8M5.6 12h12.8" />,
  minus: <path d="M5.6 12h12.8" />,
  close: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  check: <path d="m5.2 12.8 4.6 4.4L18.8 6.6" />,
  location: <><path d="M12 20.8s6.6-5.6 6.6-10.4A6.6 6.6 0 0 0 5.4 10.4C5.4 15.2 12 20.8 12 20.8z" /><circle cx="12" cy="10.2" r="2.4" /></>,
  service: <><path d="M4.4 15v-3.4a7.6 7.6 0 0 1 15.2 0V15" /><rect x="2.6" y="13.4" width="4" height="6.2" rx="1.6" /><rect x="17.4" y="13.4" width="4" height="6.2" rx="1.6" /><path d="M19.4 19.6c0 1.4-1.8 2.4-4 2.4" /></>,
  coupon: <><path d="M3.6 7.4h16.8v2.9a1.7 1.7 0 0 0 0 3.4v2.9H3.6v-2.9a1.7 1.7 0 0 0 0-3.4z" /><path d="M12 8.6v6.8" strokeDasharray="2 2" /></>,
  truck: <><path d="M2.8 6.8h10.4v9.4H2.8z" /><path d="M13.2 9.8h3.6l3.4 3v3.4h-7z" /><circle cx="7" cy="18.2" r="1.8" /><circle cx="17" cy="18.2" r="1.8" /></>,
  fire: <path d="M12 21c3.4 0 5.6-2.2 5.6-5.2 0-3.8-4.2-5.4-3.2-10.8C11.4 6.4 8.4 9.6 8.4 12.6c0 1 .4 1.8 1 2.4-1 .4-1.8-.4-2.2-1.4-.8 1-1.2 2.2-1.2 3.4C6 18.8 8.6 21 12 21z" />,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.6V12l3.2 2" /></>,
  filter: <path d="M4 6.4h16M7 12h10M10 17.6h4" />,
  share: <><circle cx="6" cy="12" r="2.4" /><circle cx="17.4" cy="6.4" r="2.4" /><circle cx="17.4" cy="17.6" r="2.4" /><path d="m8.2 10.8 7-3.2M8.2 13.2l7 3.2" /></>,
  download: <path d="M12 4.4v10.2M8 10.8l4 3.8 4-3.8M5 19.6h14" />,
  live: <><rect x="3" y="7" width="13" height="10" rx="2.4" /><path d="m16 11.2 4.4-2.6v6.8L16 12.8z" /><circle cx="8.2" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
  shield: <><path d="M12 3.6 5.4 6v5.4c0 4 2.8 7.2 6.6 8.6 3.8-1.4 6.6-4.6 6.6-8.6V6z" /><path d="m9.2 12 2 2 3.8-4" /></>,
  box: <><path d="m12 3.6 7.4 3.8v9.4L12 20.4 4.6 16.8V7.4z" /><path d="M4.6 7.4 12 11.2l7.4-3.8M12 11.2v9.2" /></>,
  wallet: <><path d="M4 7.4h13.6A2.4 2.4 0 0 1 20 9.8v7a2.4 2.4 0 0 1-2.4 2.4H4A1.4 1.4 0 0 1 2.6 17.8V8.8A1.4 1.4 0 0 1 4 7.4z" /><path d="M16.2 12.6h3.4" /></>,
  edit: <><path d="M4 20h4.2L20 8.2 15.8 4 4 15.8z" /><path d="m14.6 5.2 4.2 4.2" /></>,
  copy: <><rect x="8.6" y="8.6" width="11" height="11" rx="2.2" /><path d="M15.4 5.6H6.4a2 2 0 0 0-2 2v9" /></>,
  trash: <path d="M4.6 7.2h14.8M9.6 7.2V4.8h4.8v2.4M6.6 7.2l.9 12.4h9l.9-12.4" />,
  tag: <><path d="M11.4 3.8H20v8.6l-9.4 9.4-8.6-8.6z" /><circle cx="16" cy="8.2" r="1.4" /></>,
  gift: <><path d="M4 9.6h16v2.6H4zM5.4 12.2h13.2v8H5.4zM12 9.6v10.6" /><path d="M12 9.6C10.4 6 8.8 4.6 7.4 5.2 6 5.8 6.4 8 8.6 9.6zM12 9.6c1.6-3.6 3.2-5 4.6-4.4 1.4.6 1 2.8-1.2 4.4z" /></>,
  bolt: <path d="M13.2 3 6 13.4h4.6L10.4 21 18 10.6h-4.8z" />,
  chart: <><path d="M4 19.4h16" /><path d="M7 16.4V9.6M12 16.4V5.6M17 16.4v-4.6" /></>,
  list: <><path d="M8.4 6.6h11.2M8.4 12h11.2M8.4 17.4h11.2" /><circle cx="4.4" cy="6.6" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.4" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.4" cy="17.4" r="1.2" fill="currentColor" stroke="none" /></>,
  dots: <><circle cx="5.6" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="18.4" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
  bell: <><path d="M6.6 10.4a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.4 1.6 5.4H5s1.6-1.4 1.6-5.4z" /><path d="M10.2 19a2 2 0 0 0 3.6 0" /></>,
}

export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.7, className, style }) {
  const content = P[name]
  if (!content) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: 'none', ...style }}
      aria-hidden="true"
    >
      {content}
    </svg>
  )
}
