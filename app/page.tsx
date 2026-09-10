import Hero from '../components/Hero';
import StatsBand from '../components/StatsBand';
import MenuSection from '../components/MenuSection';
import AboutSection from '../components/AboutSection';
import CtaBand from '../components/CtaBand';
import IsoCertifications from '../components/IsoCertifications';
import PromiseAssistant from '../components/assistant/PromiseAssistant';

export default function HomePage() {
  return (
    <main id="top">
      <Hero />
      <PromiseAssistant />
      <StatsBand />
      <MenuSection />
      <AboutSection />
      <IsoCertifications />
      <CtaBand />
    </main>
  );
}
