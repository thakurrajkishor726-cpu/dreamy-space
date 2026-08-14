import Hero from "../components/home/Hero";
import CategoryMarquee from "../components/home/CategoryMarquee";
import Intro from "../components/home/Intro";
import WhatWeOffer from "../components/home/WhatWeOffer";
import WhyUs from "../components/home/WhyUs";
import ModularJourneyTeaser from "../components/home/ModularJourneyTeaser";
import ProjectHighlights from "../components/home/ProjectHighlights";
import Voices from "../components/home/Voices";
import FinalCta from "../components/home/FinalCta";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <CategoryMarquee />
      <WhatWeOffer />
      <Intro />
      <WhyUs />
      <ModularJourneyTeaser />
      <ProjectHighlights />
      <Voices />
      <FinalCta />
    </div>
  );
}
