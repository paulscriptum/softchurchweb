import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Manifesto } from '@/components/Manifesto';
import { ObjectsGrid } from '@/components/ObjectsGrid';
import { Statements } from '@/components/Statements';
import { getManifesto, getSiteData, getStatements } from '@/lib/data';

export default async function Home() {
  const [site, statements, manifesto] = await Promise.all([
    getSiteData(),
    getStatements(),
    getManifesto(),
  ]);

  return (
    <>
      <Header />
      <main>
        <Hero settings={site.settings} renderedAt={site.renderedAt} />
        <Statements statements={statements} />
        <ObjectsGrid
          artifacts={site.artifacts}
          settings={site.settings}
          renderedAt={site.renderedAt}
        />
        <Manifesto manifesto={manifesto} />
      </main>
      <Footer settings={site.settings} />
    </>
  );
}
