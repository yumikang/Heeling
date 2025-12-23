import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import AppPreview from '@/components/landing/AppPreview';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <Hero />
      <Features />
      <AppPreview />
      <Footer />
    </main>
  );
}

