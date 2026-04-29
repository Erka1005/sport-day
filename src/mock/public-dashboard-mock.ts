export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge?: string;
  ctaLabel?: string;
};

export type QuickStat = {
  id: number;
  label: string;
  value: string;
  helper?: string;
};

export type FeaturedSport = {
  id: number;
  name: string;
  description: string;
  image: string;
  tag?: string;
};

export type GalleryItem = {
  id: number;
  title: string;
  image: string;
};

export type AnnouncementItem = {
  id: number;
  title: string;
  description: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "MMS Sports Day 2026",
    subtitle: "Нэгдсэн мэдээллийн самбар",
    description:
      "Хуваарь, үр дүн, лидер самбар болон онцлох мөчүүдийг нэг дороос хараарай.",
    image:
      "/images/cover.png",
    badge: "Live Event",
    ctaLabel: "Хуваарь харах",
  },
  {
    id: 2,
    title: "Team Spirit & Competition",
    subtitle: "Багийн уур амьсгал, өрсөлдөөний эрч",
    description:
      "Спорт бүрийн сүүлийн үеийн мэдээлэл, тоглолтын хуваарь, шилдэг багуудын үзүүлэлтийг шууд харна.",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1600&q=80",
    badge: "Featured",
    ctaLabel: "Үр дүн харах",
  },
  {
    id: 3,
    title: "Play Hard. Win Together.",
    subtitle: "Онцлох агшин, тоглолтын мэдээ",
    description:
      "Тэмцээний онцлох мөчүүд, photo highlights болон өнөөдрийн чухал мэдэгдлүүд.",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1600&q=80",
    badge: "Highlights",
    ctaLabel: "Онцлох хэсэг",
  },
];

export const quickStatsMock: QuickStat[] = [
  {
    id: 1,
    label: "Нийт спорт",
    value: "12",
    helper: "Төрөл бүрийн тэмцээн",
  },
  {
    id: 2,
    label: "Нийт баг",
    value: "8",
    helper: "Оролцож буй багууд",
  },
  {
    id: 3,
    label: "Өнөөдрийн тоглолт",
    value: "24",
    helper: "Хуваарьт тоглолт",
  },
  {
    id: 4,
    label: "Шинэ үр дүн",
    value: "16",
    helper: "Шинэчлэгдсэн мэдээлэл",
  },
];

export const featuredSportsMock: FeaturedSport[] = [
  {
    id: 1,
    name: "Basketball",
    description: "Хамгийн их үзэгчтэй, өрсөлдөөнтэй багийн спорт.",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    tag: "Popular",
  },
  {
    id: 2,
    name: "Volleyball",
    description: "Хурд, зохион байгуулалт, багийн уялдаа шаардсан тоглолт.",
    image:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80",
    tag: "Team Sport",
  },
  {
    id: 3,
    name: "Table Tennis",
    description: "Хурдтай, төвлөрөл их шаардсан сонирхолтой төрөл.",
    image:
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80",
    tag: "Indoor",
  },
  {
    id: 4,
    name: "Chess",
    description: "Стратеги, бодлого, анхаарал төвлөрлийн тулаан.",
    image:
      "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1200&q=80",
    tag: "Mind Sport",
  },
];

export const galleryMock: GalleryItem[] = [
  {
    id: 1,
    title: "Opening Ceremony",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Team Energy",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Competitive Spirit",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    title: "Awards & Celebration",
    image:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
  },
];

export const announcementsMock: AnnouncementItem[] = [
  {
    id: 1,
    title: "Нээлтийн ажиллагаа",
    description: "09:00 цагаас төв талбай дээр эхэлнэ.",
  },
  {
    id: 2,
    title: "Финалын тоглолтууд",
    description: "17:00 цагаас гол зааланд явагдана.",
  },
  {
    id: 3,
    title: "Шагнал гардуулах ёслол",
    description: "Өдрийн сүүлийн тоглолтын дараа шууд болно.",
  },
];