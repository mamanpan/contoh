export type Comment = {
  user: string;
  text: string;
  rating: number;
};

export type Product = {
  id: string;
  name: string;
  seller: string;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  platform: "Shopee" | "TikTok" | "Tokopedia" | "Lazada";
  link: string;
  comments: Comment[];
};

export const BANNERS = [
  {
    id: "b1",
    title: "Diskon Besar-Besaran",
    subtitle: "Promo affiliate terbaik minggu ini",
    image: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: "b2",
    title: "Cashback 50%",
    subtitle: "Belanja lewat link affiliate creator",
    image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: "b3",
    title: "Flash Sale 24 Jam",
    subtitle: "Produk pilihan harga spesial",
    image: "https://images.unsplash.com/photo-1607083681678-52733140f93a?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: "b4",
    title: "Gabung Jadi Creator",
    subtitle: "Dapatkan komisi dari setiap klik",
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&q=80&auto=format&fit=crop",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Sepatu Sneakers Pria Premium",
    seller: "@sneakerhub",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&auto=format&fit=crop",
    description: "Sneakers premium ringan & breathable. Cocok buat daily use, sekolah, atau olahraga santai. Sol empuk anti selip.",
    rating: 4.8,
    reviews: 1240,
    platform: "Shopee",
    link: "https://shopee.co.id/",
    comments: [
      { user: "Andi", rating: 5, text: "Bahan bagus, sesuai foto!" },
      { user: "Bella", rating: 4, text: "Nyaman dipakai jalan jauh." },
    ],
  },
  {
    id: "p2",
    name: "Skincare Glow Serum 30ml",
    seller: "@beautyid",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80&auto=format&fit=crop",
    description: "Serum brightening dengan Niacinamide 10% + Vitamin C. Bikin kulit cerah, glowing, dan bekas jerawat memudar.",
    rating: 4.9,
    reviews: 3820,
    platform: "TikTok",
    link: "https://vt.tiktok.com/",
    comments: [
      { user: "Sinta", rating: 5, text: "Kulit glowing dalam seminggu." },
      { user: "Rani", rating: 5, text: "Wangi enak, ga lengket." },
    ],
  },
  {
    id: "p3",
    name: "Earbuds Bluetooth Pro TWS",
    seller: "@gadgetkuy",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80&auto=format&fit=crop",
    description: "Earbuds TWS dengan ENC noise cancelling, bass mantap, dan latency rendah. Cocok buat gaming & meeting.",
    rating: 4.6,
    reviews: 890,
    platform: "Shopee",
    link: "https://shopee.co.id/",
    comments: [
      { user: "Doni", rating: 5, text: "Suaranya jernih banget!" },
      { user: "Eka", rating: 4, text: "Baterai awet seharian." },
    ],
  },
  {
    id: "p4",
    name: "Jam Tangan Digital Sport",
    seller: "@watchstore",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop",
    description: "Smartwatch sporty tahan air IP68, monitor detak jantung, tidur, dan 20+ mode olahraga. Baterai 7 hari.",
    rating: 4.5,
    reviews: 542,
    platform: "TikTok",
    link: "https://vt.tiktok.com/",
    comments: [
      { user: "Fajar", rating: 5, text: "Modelnya keren, tahan air." },
      { user: "Gina", rating: 4, text: "Value for money." },
    ],
  },
  {
    id: "p5",
    name: "Tas Ransel Kanvas Vintage",
    seller: "@bagoutlet",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80&auto=format&fit=crop",
    description: "Ransel kanvas gaya vintage muat laptop 14 inch. Banyak kompartemen, cocok buat kuliah & kerja.",
    rating: 4.7,
    reviews: 1102,
    platform: "Shopee",
    link: "https://shopee.co.id/",
    comments: [
      { user: "Hana", rating: 5, text: "Muat laptop 14 inch." },
      { user: "Iqbal", rating: 5, text: "Jahitan rapi, mantap!" },
    ],
  },
  {
    id: "p6",
    name: "Botol Minum Stainless 750ml",
    seller: "@livingood",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80&auto=format&fit=crop",
    description: "Botol stainless double wall, dingin 12 jam & panas 6 jam. BPA free, ringan, warna aesthetic.",
    rating: 4.9,
    reviews: 2050,
    platform: "Tokopedia",
    link: "https://www.tokopedia.com/",
    comments: [
      { user: "Joko", rating: 5, text: "Dingin awet 12 jam." },
      { user: "Kirana", rating: 5, text: "Warnanya cantik!" },
    ],
  },
];
