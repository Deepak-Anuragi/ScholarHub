import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://scholarshub.in";
const API_SERVER =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

const SUPPORTED_CITIES = [
  "bhopal",
  "indore",
  "gwalior",
  "jabalpur",
  "ujjain",
  "sagar",
  "dewas",
  "satna",
  "ratlam",
  "rewa",
  "delhi",
  "mumbai",
  "bangalore",
  "pune",
  "hyderabad",
  "chennai",
  "kolkata",
  "ahmedabad",
  "jaipur",
  "lucknow",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/libraries`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/map`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/courses`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. City landing pages (/libraries/[city])
  const cityRoutes: MetadataRoute.Sitemap = SUPPORTED_CITIES.map((city) => ({
    url: `${BASE_URL}/libraries/${city}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // 3. Dynamic library detail pages (/library/[id])
  let libraryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_SERVER}/api/libraries?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        libraries?: { _id?: string; id?: string; updatedAt?: string }[];
      };
      const list = data.libraries ?? [];
      libraryRoutes = list.map((lib) => {
        const id = lib._id || lib.id;
        return {
          url: `${BASE_URL}/library/${id}`,
          lastModified: lib.updatedAt ? new Date(lib.updatedAt) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        };
      });
    }
  } catch {
    // If backend is unreachable during static builds, continue with static & city routes
  }

  return [...staticRoutes, ...cityRoutes, ...libraryRoutes];
}

