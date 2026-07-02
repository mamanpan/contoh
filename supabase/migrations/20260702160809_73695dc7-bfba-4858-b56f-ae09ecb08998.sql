
ALTER TABLE public.branding
  ADD COLUMN IF NOT EXISTS brand_accent TEXT NOT NULL DEFAULT 'Hub',
  ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT 'Cuan dari setiap link';

UPDATE public.branding SET brand_name = 'Affili' WHERE id = 1 AND brand_name = 'AffiliHub';

INSERT INTO public.banners (title, subtitle, image_url, position, active)
SELECT * FROM (VALUES
  ('Diskon Besar-Besaran','Promo affiliate terbaik minggu ini','https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200&q=80&auto=format&fit=crop',0,true),
  ('Cashback 50%','Belanja lewat link affiliate creator','https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80&auto=format&fit=crop',1,true),
  ('Flash Sale 24 Jam','Produk pilihan harga spesial','https://images.unsplash.com/photo-1607083681678-52733140f93a?w=1200&q=80&auto=format&fit=crop',2,true),
  ('Gabung Jadi Creator','Dapatkan komisi dari setiap klik','https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&q=80&auto=format&fit=crop',3,true)
) AS v(title,subtitle,image_url,position,active)
WHERE NOT EXISTS (SELECT 1 FROM public.banners);
