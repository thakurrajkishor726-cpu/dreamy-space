const bannerModules = import.meta.glob("../assets/images/banners/*.{jpg,jpeg,png,webp,avif,svg}", {
  eager: true,
  import: "default",
});

const numberOf = (path) => Number(path.match(/(\d+)\.(jpg|jpeg|png|webp|avif|svg)$/i)?.[1] || 0);

export const bannerImages = Object.entries(bannerModules)
  .filter(([path]) => /\/\d+\.(jpg|jpeg|png|webp|avif|svg)$/i.test(path))
  .sort(([a], [b]) => numberOf(a) - numberOf(b))
  .map(([, src]) => src);

export const innerBanner = bannerImages[0];
export const contactImage = bannerImages[4] || bannerImages[0];
