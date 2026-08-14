/**
 * Single source of truth for contact details.
 *
 * These used to be fetched from the API of the site this project was rebuilt
 * from, so the footer, contact page and WhatsApp button all showed another
 * studio's address, phone and email. That feed is gone; edit this file.
 */

export const COMPANY = {
  name: "Dreamy Spaces",

  email: "thakurrajkishor726@gmail.com",

  // Display form, and the digits used for tel: and wa.me links.
  phone: "+91 90711 02916",
  phoneDigits: "919071102916",
  whatsappDigits: "919071102916",

  // TODO: add the street address when you have it. Until then the map link
  // carries the precise location, so nothing here is invented.
  addressLines: ["Dreamy Space", "Bengaluru, Karnataka"],

  mapsUrl:
    "https://www.google.co.in/maps/place/Dreamy+Space/@12.8919327,77.3424276,12.92z/data=!4m10!1m2!2m1!1sdreamy+spaces!3m6!1s0x3bae414260f3f7b5:0x534ea7249c602010!8m2!3d12.8422731!4d77.4842877!15sCg1kcmVhbXkgc3BhY2VzkgESaW50ZXJpb3JfZGVjb3JhdG9y4AEA!16s%2Fg%2F11zg3sf3rj",

  hours: "Mon to Sat: 09.00 AM to 07.00 PM",

  socials: [
    { platform: "facebook", url: "#" },
    { platform: "instagram", url: "#" },
    { platform: "linkedin", url: "#" },
  ],
};

export const addressText = COMPANY.addressLines.join(", ");
export const telHref = `tel:+${COMPANY.phoneDigits}`;
export const mailHref = `mailto:${COMPANY.email}`;
export const whatsappHref = `https://wa.me/${COMPANY.whatsappDigits}`;
