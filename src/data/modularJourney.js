const journeyModules = import.meta.glob(
  "../assets/images/modular-journey/*.{jpg,jpeg,png,webp,avif,svg}",
  { eager: true, import: "default" },
);

const numberOf = (path) => Number(path.match(/(\d+)\.(jpg|jpeg|png|webp|avif|svg)$/i)?.[1] || 0);

const images = Object.entries(journeyModules)
  .sort(([a], [b]) => numberOf(a) - numberOf(b))
  .map(([, src]) => src);

export const JOURNEY_STEPS = [
  {
    id: 1,
    // Was "Visit Our Experience Studio", which assumed a showroom. Removed
    // along with the Experience Center section.
    title: "Tell Us About The Space",
    description:
      "A call or a WhatsApp message to start: which rooms, roughly what size, what is not working about them now, and when you would like it finished.",
    image: images[0],
  },
  {
    id: 2,
    title: "On-Site Consultation",
    description:
      "We come to you, measure every wall and opening, and note where the plumbing, sockets and light switches already sit.",
    image: images[1],
  },
  {
    id: 3,
    title: "Material Selection",
    description:
      "Pick shutters, laminates, handles and hinges from samples you can hold, with the cost of each option written down.",
    image: images[2],
  },
  {
    id: 4,
    title: "Design & Planning",
    description:
      "You get plans and 3D views showing exactly what goes where. We keep adjusting until the layout suits how you cook, dress and store things.",
    image: images[3],
  },
  {
    id: 5,
    title: "Quotation & Final Approval",
    description:
      "One itemised quote and a final set of drawings. Nothing goes to the workshop until you have signed both.",
    image: images[4],
  },
  {
    id: 6,
    title: "Precision Manufacturing",
    highlight: true,
    badge: "IMOS Powered",
    description:
      "Approved drawings become machine instructions through IMOS, so panels are cut and edged to the exact dimensions on the plan.",
    image: images[5],
  },
  {
    id: 7,
    title: "Site Preparation & Delivery",
    description:
      "We check the site is ready, civil work finished and walls painted, then deliver the modules wrapped and in fitting order.",
    image: images[6],
  },
  {
    id: 8,
    title: "Professional Installation",
    description:
      "Our own fitters assemble on site, level every unit, align the shutter gaps and clean up behind themselves.",
    image: images[7],
  },
  {
    id: 9,
    title: "Final Quality Check & Handover",
    description:
      "We open every door and drawer with you, adjust anything that catches, and only then hand over.",
    image: images[8],
  },
  {
    id: 10,
    title: "Service & Usage Guidelines",
    description:
      "You get plain instructions on cleaning each finish, what to avoid, and who to call if something loosens.",
    image: images[9],
  },
  {
    id: 11,
    title: "Receipt & Documentation",
    description:
      "Final drawings, invoices and warranty papers together in one folder, plus a number that reaches a person.",
    image: images[10],
  },
];
