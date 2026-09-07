import Hero from '../components/Hero';
import StatsBand from '../components/StatsBand';
import MenuSection from '../components/MenuSection';
import AboutSection from '../components/AboutSection';
import CtaBand from '../components/CtaBand';

export default function HomePage() {
  return (
    <main id="top">
      <Hero />
      <StatsBand />
      <MenuSection />
      <AboutSection />
      <CtaBand />
    </main>
  );
}
