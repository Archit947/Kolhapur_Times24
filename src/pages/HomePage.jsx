import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { HeroCard, FeaturedSmallCard, NewsCard, SkeletonCard, SkeletonHeroCard, SkeletonSmallCard } from '../components/ui/NewsCard';
import SEOHead from '../components/ui/SEOHead';
import AdBanner from '../components/ui/AdBanner';
import { useFeaturedNews, useNewsList, useNewsByCategory } from '../hooks/useNews';
import { useCategories } from '../hooks/useCategories';

// Categories to show on home page in section blocks
const HOME_CATEGORIES = ['politics', 'technology', 'sports', 'business', 'entertainment', 'health'];

function CategorySection({ categorySlug, categoryName }) {
  const { data: result, isLoading } = useNewsByCategory(categorySlug, { limit: 3, page: 1 });
  const items = result?.data || [];

  // Don't render the section if there are no articles in this category
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">{categoryName}</h2>
        <Link
          to={`/category/${categorySlug}`}
          className="text-sm text-red-700 font-semibold hover:underline"
        >
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map(item => <NewsCard key={item.id} news={item} />)
        }
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: featured = [], isLoading: featuredLoading } = useFeaturedNews();
  const { data: latestResult, isLoading: latestLoading } = useNewsList({ limit: 9 });
  const { data: categories = [] } = useCategories();

  const [heroIndex, setHeroIndex] = useState(0);

  // Auto-advance hero slider every 5 seconds
  useEffect(() => {
    if (featured.length < 2) return;
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % Math.min(featured.length, 4)), 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const heroNews = featured[heroIndex];
  const sideNews = featured.filter((_, i) => i !== heroIndex).slice(0, 3);

  return (
    <Layout>
      <SEOHead
        title="Kolhapur_Times24 – Latest News & Updates"
        description="Stay updated with the latest news from Kolhapur_Times24 covering politics, business, technology, sports, and more."
      />

      {/* ---- Hero / Featured Section ---- */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Featured News</h2>
          {featured.length > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: Math.min(featured.length, 4) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === heroIndex ? 'bg-red-700' : 'bg-gray-300 dark:bg-gray-600'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
          {/* Large hero */}
          {featuredLoading ? <SkeletonHeroCard /> : <HeroCard news={heroNews} />}

          {/* Side cards */}
          <div className="flex flex-col gap-3">
            {featuredLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonSmallCard key={i} />)
              : sideNews.map(item => <FeaturedSmallCard key={item.id} news={item} />)
            }
          </div>
        </div>
      </section>

      {/* ---- Ad Banner ---- */}
      <AdBanner position="header" />

      {/* ---- Latest News ---- */}
      <section className="mb-8 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Latest News</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : (latestResult?.data || []).map(item => <NewsCard key={item.id} news={item} />)
          }
        </div>
      </section>

      {/* ---- Category Sections ---- */}
      {categories
        .filter(c => HOME_CATEGORIES.includes(c.slug) || c.slug === 'education')
        .map(cat => (
          <CategorySection key={cat.id} categorySlug={cat.slug} categoryName={cat.name} />
        ))
      }
    </Layout>
  );
}
