import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { LibrariesExplorer } from "@/components/library/LibrariesExplorer";

type Props = {
  params: { city: string };
  searchParams: Record<string, string | string[] | undefined>;
};

const SUPPORTED_CITIES = [
  "bhopal", "indore", "gwalior", "jabalpur", "ujjain",
  "sagar", "dewas", "satna", "ratlam", "rewa",
  "delhi", "mumbai", "bangalore", "pune", "hyderabad",
  "chennai", "kolkata", "ahmedabad", "jaipur", "lucknow",
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = decodeURIComponent(params.city).toLowerCase();
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  
  return {
    title: `Best Library Seats in ${cityName} | Scholar's Hub`,
    description: `Find and book study library seats in ${cityName}. Compare prices, facilities, and ratings. AC, WiFi, CCTV security. Book hourly, daily, monthly library seats near you.`,
    keywords: `library in ${city}, study room ${city}, reading room ${city}, library booking ${city}, coworking space ${city}`,
    openGraph: {
      title: `Library Seats in ${cityName} - Scholar's Hub`,
      description: `Discover the best library seats in ${cityName}. Book now and study in comfort.`,
    },
  };
}

export async function generateStaticParams() {
  return SUPPORTED_CITIES.map((city) => ({ city }));
}

export default function CityLibrariesPage({ params, searchParams }: Props) {
  const city = decodeURIComponent(params.city).toLowerCase();
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);

  if (!SUPPORTED_CITIES.includes(city)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-sage-100/30">
      {/* Hero section */}
      <section className="border-b border-line bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#16a34a]/10">
              <MapPin className="size-6 text-[#16a34a]" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-forest-900 sm:text-4xl">
                Library Seats in {cityName}
              </h1>
              <p className="mt-2 text-sm text-forest-900/60 sm:text-base">
                Find the perfect study space. Compare prices, facilities, and book your seat instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Libraries explorer with city pre-filled */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <LibrariesExplorer initialFilters={{ city }} />
        </div>
      </section>

      {/* SEO content */}
      <section className="border-t border-line bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl text-forest-900">
            Why Book a Library Seat in {cityName}?
          </h2>
          <div className="mt-4 space-y-4 text-sm text-forest-900/70">
            <p>
              Scholar&apos;s Hub connects you with premium library and study spaces across {cityName}. 
              Whether you&apos;re preparing for competitive exams, working on projects, or need a quiet place to study, 
              find verified libraries with modern amenities.
            </p>
            <p>
              Our {cityName} library partners offer air-conditioned seating, high-speed WiFi, 24/7 CCTV security, 
              and flexible booking options. Filter by price, location, facilities, and reviews to find your ideal study environment.
            </p>
            <p>
              Book hourly, daily, or monthly seats online. Instant confirmation. Secure payments. Join thousands of students 
              studying smarter in {cityName}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}