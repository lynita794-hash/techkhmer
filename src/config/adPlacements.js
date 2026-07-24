// Fixed ad placements available across the site. Admins pick one of these
// when creating an ad unit in Admin Panel > Ads Manager; the matching
// <AdSlot placement="..." /> on each page renders it.
export const AD_PLACEMENTS = [
  { key: 'dramastream_header', label: 'ក្បាល Site - ក្រោម Navbar (DramaStream Header)' },
  { key: 'home_top', label: 'ទំព័រដើម - ខាងលើ (Home Top)' },
  { key: 'top_hot_series', label: 'ទំព័រដើម - លើ Top Hot Series' },
  { key: 'top_latest', label: 'ទំព័រដើម - លើ Top Latest' },
  { key: 'home_bottom', label: 'ទំព័រដើម - ខាងក្រោម (Home Bottom)' },
  { key: 'single_post_top', label: 'ទំព័រមើលរឿង - ខាងលើទំព័រទាំងមូល (Single Post Top)' },
  { key: 'watch_above_player', label: 'ទំព័រមើលរឿង - លើ Video Player' },
  { key: 'watch_below_player', label: 'ទំព័រមើលរឿង - ក្រោម Video Player' },
  { key: 'watch_sidebar', label: 'ទំព័រមើលរឿង - Sidebar (ក្បែរ Episode List)' },
  { key: 'single_post_bottom', label: 'ទំព័រមើលរឿង - ខាងក្រោមទំព័រទាំងមូល (Single Post Bottom)' },
  { key: 'overlay_player', label: 'ត្រួតលើ Video Player (Overlay Player)' },
]

// "Floating" ad placements render fixed/positioned on top of the page
// content (not in the normal document flow like the placements above),
// with a close (×) button — matches the always-visible floating ad units
// common on drama/streaming theme sites (DramaStream, etc). Rendered by
// <FloatingAds /> mounted once globally in App.jsx, not per-page.
export const FLOATING_AD_PLACEMENTS = [
  { key: 'float_center', label: 'Float - កណ្តាលអេក្រង់ (Float Center)' },
  { key: 'float_top', label: 'Float - ខាងលើ (Float Top)' },
  { key: 'float_left', label: 'Float - ខាងឆ្វេង (Float Left)' },
  { key: 'float_right', label: 'Float - ខាងស្តាំ (Float Right)' },
  { key: 'float_bottom', label: 'Float - ខាងក្រោម (Float Bottom)' },
]
