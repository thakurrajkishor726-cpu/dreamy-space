/**
 * Single source of truth for contact details.
 *
 * These used to be fetched from the API of the site this project was rebuilt
 * from, so the footer, contact page and WhatsApp button all showed another
 * studio's address, phone and email. That feed is gone; edit this file.
 */

export const COMPANY = {
  name: "Dreamy Space",

  email: "dreamyspace26@gmail.com",

  // First entry is the primary: it is what the header bar shows, and it is
  // the number WhatsApp opens.
  phones: [
    { label: "Primary", display: "+91 90711 02916", digits: "919071102916", whatsapp: true },
    { label: "Alternate", display: "+91 94824 46928", digits: "919482446928" },
  ],

  addressLines: [
    "#126, Hosapalya, Tataguni Post",
    "Agara Main Road, Kengeri Hobli",
    "Kanakapura Road",
    "Bengaluru 560082",
  ],

  // Straight from the Google Maps place link, so the embedded map and the
  // "open in Maps" link point at the same pin.
  coords: { lat: 12.8422731, lng: 77.4842877 },

  mapsUrl:
    "https://www.google.co.in/maps/place/Dreamy+Space/@12.8919327,77.3424276,12.92z/data=!4m10!1m2!2m1!1sdreamy+spaces!3m6!1s0x3bae414260f3f7b5:0x534ea7249c602010!8m2!3d12.8422731!4d77.4842877!15sCg1kcmVhbXkgc3BhY2VzkgESaW50ZXJpb3JfZGVjb3JhdG9y4AEA!16s%2Fg%2F11zg3sf3rj",

  hours: "Mon to Sat: 09.00 AM to 07.00 PM",

  socials: [
    { platform: "facebook", url: "#" },
    { platform: "instagram", url: "#" },
    { platform: "linkedin", url: "#" },
  ],
};

const primary = COMPANY.phones[0];
const whatsappPhone = COMPANY.phones.find((phone) => phone.whatsapp) || primary;

/** One line, for a footer or a meta tag. */
export const addressText = COMPANY.addressLines.join(", ");

/** Kept for the places that only ever show one number. */
export const phone = primary.display;
export const telHref = `tel:+${primary.digits}`;
export const mailHref = `mailto:${COMPANY.email}`;
export const whatsappHref = `https://wa.me/${whatsappPhone.digits}`;

export const telHrefFor = (entry) => `tel:+${entry.digits}`;

/**
 * Google Maps embed. The `output=embed` form needs no API key and no billing
 * account, which matters for a site that should keep costing nothing to run.
 * Pinned by coordinate rather than by search text so it cannot drift onto a
 * different business with a similar name.
 */
export const mapEmbedUrl =
  `https://www.google.com/maps?q=${COMPANY.coords.lat},${COMPANY.coords.lng}` +
  `&z=15&hl=en&output=embed`;

/** Deep link that opens turn-by-turn directions in the user's map app. */
export const directionsUrl =
  `https://www.google.com/maps/dir/?api=1&destination=` +
  `${COMPANY.coords.lat},${COMPANY.coords.lng}`;
