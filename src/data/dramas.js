// Sample video used for every episode — replace with real episode URLs later
export const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export function buildEpisodes(count, existingEpisodes = []) {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    videoUrl: existingEpisodes[i]?.videoUrl || SAMPLE_VIDEO,
  }))
}

// Default detail info per category — used as a fallback for the info panel
export const defaultDetailsByCategory = {
  chinese: {
    country: 'China',
    genres: ['chinese', 'drama', 'romance'],
    studios: 'iQiyi',
    source: 'TMDB',
  },
  korean: {
    country: 'South Korea',
    genres: ['korean', 'drama', 'romance'],
    studios: 'Netflix',
    source: 'TMDB',
  },
  thai: {
    country: 'Thailand',
    genres: ['thai', 'drama', 'romance'],
    studios: 'GMMTV',
    source: 'TMDB',
  },
}

// Sample drama data — replace poster URLs with real images later
export const initialDramas = [
  {
    id: 1,
    title: 'Kumpy Yuthisil Banhchea Ke Ah Ka Cheat Khnhom',
    ep: 6,
    poster: 'https://picsum.photos/seed/drama1/300/450',
    category: 'chinese',
    status: 'ENDED',
    type: 'TV Series',
    premiered: 2023,
    broadcast: '2023-05-26',
    dateAired: '2023-05-26',
    duration: '35 min',
    producers: 'N/A',
    rating: 2.0,
    votes: 33,
    description:
      'An adventure begins with a mistaken identity after a nobody pretends to be the illegitimate daughter of the Murong family. Ever since Murong Zhuwan faked her identity to pretend to be from a prominent family, she is pulled into bloody disputes in the pugilistic world. Clueless about matters of the heart, she becomes enamoured by martial arts genius Murong Chong and also meets the gentle Fu Hong, whose love has turned to hate after thinking that he\'s been betrayed. Their experiences allow them to grow into chivalrous heroes who fight for the people.',
    genres: [
      'chinese',
      'martial arts',
      'based on novel or book',
      'romance',
      'mistaken identity',
      'school',
      'historical',
      'wuxia',
      'reverse harem',
      'web series',
      'student',
      'drama',
    ],
  },
  {
    id: 2,
    title: 'Chumrov Sneh Min Ach Bomplech',
    ep: 10,
    poster: 'https://picsum.photos/seed/drama2/300/450',
    category: 'chinese',
    hasSubtitle: false, // ឧទាហរណ៍រឿងគ្មាន Subtitle
  },
  {
    id: 3,
    title: 'Athkombang Samai Thang Vak Chhang Cheat',
    ep: 2,
    poster: 'https://picsum.photos/seed/drama3/300/450',
    category: 'thai',
  },
  {
    id: 4,
    title: 'Kampul Torb Akas',
    ep: 14,
    poster: 'https://picsum.photos/seed/drama4/300/450',
    category: 'chinese',
  },
  {
    id: 5,
    title: 'Kumleat Sneha',
    ep: 3,
    poster: 'https://picsum.photos/seed/drama5/300/450',
    category: 'korean',
  },
  {
    id: 6,
    title: 'Reung Ayutethor Robos Preah Neang',
    ep: 30,
    poster: 'https://picsum.photos/seed/drama6/300/450',
    category: 'chinese',
  },
  {
    id: 7,
    title: 'Run Theas Dav Angkarak Chit Dek',
    ep: 34,
    poster: 'https://picsum.photos/seed/drama7/300/450',
    category: 'chinese',
  },
  {
    id: 8,
    title: 'Nitean Sne Tong Keur',
    ep: 20,
    poster: 'https://picsum.photos/seed/drama8/300/450',
    category: 'chinese',
  },
  {
    id: 9,
    title: 'Phaka Sros Rus Rouy',
    ep: 6,
    poster: 'https://picsum.photos/seed/drama9/300/450',
    category: 'chinese',
  },
  {
    id: 10,
    title: 'Arth Kombang Robors Neray Meakea Ream',
    ep: 6,
    poster: 'https://picsum.photos/seed/drama10/300/450',
    category: 'thai',
  },
  {
    id: 11,
    title: 'Vithey Sneh Metheay',
    ep: 9,
    poster: 'https://picsum.photos/seed/drama11/300/450',
    category: 'thai',
  },
  {
    id: 12,
    title: 'Mun Sne Kromom Chhnas',
    ep: 7,
    poster: 'https://picsum.photos/seed/drama12/300/450',
    category: 'korean',
  },
]

const dramasWithEpisodes = initialDramas.map((d) => {
  const fallback = defaultDetailsByCategory[d.category] || {}
  return {
    status: 'ONGOING',
    type: 'TV Series',
    premiered: 2024,
    broadcast: 'N/A',
    dateAired: 'N/A',
    duration: '30 min',
    producers: 'N/A',
    rating: 0,
    votes: 0,
    description: `${d.title} — សេចក្តីសង្ខេបរឿងនឹងបានធ្វើបន្ទាន់ក្រោយ។`,
    country: fallback.country,
    genres: fallback.genres,
    studios: fallback.studios,
    source: fallback.source,
    ...d,
    hasSubtitle: d.hasSubtitle ?? true,
    episodes: buildEpisodes(d.ep),
  }
})

export default dramasWithEpisodes
