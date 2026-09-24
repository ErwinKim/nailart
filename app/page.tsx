import AetherHero from '@/components/main/hero';

export default function Home() {
  return (
    <main>
      <AetherHero />
      <section id="about" className="landing-note">
        <p className="aurora-kicker">Built for the next upload</p>
        <h2>From rough idea to scroll-stopping thumbnail, without the blank canvas.</h2>
      </section>
      <div id="workspace" aria-hidden="true" />
    </main>
  );
}