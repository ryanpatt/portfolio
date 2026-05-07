export const navItems = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'projects', label: 'Projects' },
  { id: 'apps', label: 'Published Apps' },
  { id: 'contact', label: 'Contact' },
]

export const stats = [
  { value: '11+', label: 'Years Experience' },
  { value: '6', label: 'Companies' },
  { value: '5', label: 'Enterprise Platforms' },
  { value: '2', label: 'Apps Published' },
]

export const skills: Record<string, string[]> = {
  Frontend: ['React', 'React Native', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
  Backend: ['PHP 8', 'Node.js', 'tRPC', 'REST APIs', 'MySQL', 'Redis'],
  Commerce: ['Adobe Commerce / Magento 2', 'Shopware 6', 'Headless Commerce', 'PWA Studio', 'Stripe', 'Square'],
  Enterprise: ['SAP', 'NetSuite / SuiteScript', 'Salesforce', 'Best Buy Marketplace', 'EDI'],
  Mobile: ['Expo', 'iOS', 'Android', 'Biometric Auth', 'Push Notifications', 'Secure Storage'],
  DevOps: ['Docker', 'Vercel', 'AWS S3', 'Turborepo', 'CI/CD', 'Git'],
}

export const experience = [
  {
    title: 'Senior Magento / Adobe Commerce Architect',
    company: 'Titan International / Carlstar Group',
    period: 'Apr 2025 — Present · 1 yr 2 mos',
    location: 'Remote',
    highlights: [
      'Maintained and evolved a Magento 2.4.x platform for US and Canada storefronts, ensuring optimal performance.',
      'Applied Adobe security patches and aligned the codebase with current PHP and Magento standards.',
      'Developed a local workflow using Warden and Docker, enhancing environment consistency and onboarding speed.',
      'Led custom module development and third-party ERP integrations, streamlining operations for Titan International.',
    ],
  },
  {
    title: 'Adobe Commerce Architect',
    company: 'Wacom',
    period: 'Aug 2020 — Mar 2025 · 4 yrs 8 mos',
    location: 'Remote',
    highlights: [
      'Designed RESTful APIs for Adobe Commerce Enterprise integrations, enhancing interoperability across various systems.',
      'Developed and maintained CI/CD pipelines, implementing secure coding practices to improve deployment operations.',
      'Created custom modules and middleware to meet product owner specifications, ensuring alignment with project requirements.',
    ],
  },
  {
    title: 'Full Stack Developer',
    company: 'ShelterLogic',
    period: 'Mar 2019 — Apr 2020 · 1 yr 2 mos',
    location: 'Remote',
    highlights: [
      'Managed the migration of Magento 2, ensuring seamless transition and minimal downtime.',
      'Developed custom modules to enhance functionality and user experience within the eCommerce platform.',
      'Integrated Visual ERP with Magento 2 using REST API endpoints for improved data synchronization.',
    ],
  },
  {
    title: 'Senior PHP Developer',
    company: 'Zaniboni Lighting',
    period: 'May 2017 — Aug 2018 · 1 yr 4 mos',
    location: 'United States',
    highlights: [
      'Developed and maintained PHP applications, enhancing functionality and user experience.',
      'Created a comprehensive task/ticket system to streamline feature requests and fixes, ensuring a consistent workflow.',
      'Authored technical documentation and disaster recovery policies to support operational continuity.',
      'Implemented NetSuite integrations and features, improving system efficiency and performance.',
    ],
  },
  {
    title: 'Magento / PHP Developer · I.T. Manager',
    company: 'BarProducts.com Inc',
    period: 'Nov 2014 — Dec 2016 · 2 yrs 2 mos',
    location: 'Largo, Florida',
    highlights: [
      'Developed and maintained four Magento 1 sites, managing over 20,000 SKUs to enhance e-commerce functionality.',
      'Spearheaded custom module development and integrated security measures, including WAF integrations, to protect sensitive data.',
      'Oversaw NetSuite integrations and conducted PCI auditing to ensure compliance and streamline operations.',
      'Managed a team of 2–3 developers, fostering collaboration and skill development within the team.',
    ],
  },
  {
    title: 'Product and Data Specialist',
    company: 'Awning Works Inc',
    period: 'Oct 2014 — Nov 2015 · 1 yr 2 mos',
    location: 'Clearwater, Florida',
    highlights: [
      'Managed the formatting and maintenance of over 90,000 SKUs in Magento 1, ensuring data accuracy and consistency.',
      'Streamlined the product data import process, significantly reducing manual labor by up to 80 hours weekly.',
      'Collaborated with CEOs and marketing managers to implement changes in catalog configurations and attributes, enhancing product visibility.',
    ],
  },
]

export const education = [
  {
    school: 'St. Petersburg College',
    period: '2014 — 2017',
    degree: 'Computer Science',
    location: 'Florida, USA',
  },
]

export const languages = ['English (Native)', 'Spanish']

export const integrations = [
  {
    name: 'Best Buy',
    description:
      'End-to-end marketplace integration handling product catalog sync, real-time inventory updates, and automated order management across Best Buy\'s seller platform.',
    tech: ['REST API', 'Webhooks', 'Magento', 'Node.js', 'Cron Automation'],
    icon: 'bestbuy',
  },
  {
    name: 'Adobe Commerce / Magento',
    description:
      'Enterprise-grade Magento 2 and Adobe Commerce Cloud implementations with custom modules, headless storefronts, performance optimization, and multi-region deployments.',
    tech: ['Magento 2', 'Adobe Commerce Cloud', 'PWA Studio', 'GraphQL', 'PHP'],
    icon: 'magento',
  },
  {
    name: 'NetSuite',
    description:
      'Bi-directional ERP synchronization for orders, inventory levels, customer records, and financial data using NetSuite SuiteScript and REST APIs.',
    tech: ['SuiteScript 2.x', 'REST API', 'Scheduled Scripts', 'Webhooks'],
    icon: 'netsuite',
  },
  {
    name: 'SAP',
    description:
      'Enterprise integration connecting SAP with e-commerce platforms for real-time inventory availability, order flow, and customer data across global regions.',
    tech: ['SAP APIs', 'Middleware', 'EDI', 'REST', 'Data Mapping'],
    icon: 'sap',
  },
  {
    name: 'Salesforce',
    description:
      'CRM integration enabling seamless customer data synchronization, automated lead capture from storefronts, and marketing workflow automation.',
    tech: ['Salesforce REST API', 'OAuth 2.0', 'Webhooks', 'Data Sync'],
    icon: 'salesforce',
  },
]

type Project = {
  name: string
  tagline: string
  description: string
  tech: string[]
  category: string
  highlights: string[]
  url?: string
}

export const projects: Project[] = [
  {
    name: 'ClockHQ',
    tagline: 'Time tracking & HR SaaS platform',
    description:
      'Full-featured time tracking and workforce management platform built as a Turborepo monorepo with separate hub and timeclock applications.',
    tech: ['Next.js', 'TypeScript', 'tRPC', 'Prisma', 'Stripe', 'NextAuth', 'AWS S3'],
    category: 'SaaS Platform',
    url: 'https://clock-hq.com',
    highlights: [
      'Turborepo monorepo with shared @clockhq/* packages',
      'Dual-app architecture: admin hub + employee timeclock',
      'Stripe subscription billing with feature flags',
      'Cloudflare R2 / S3 file storage',
    ],
  },
  {
    name: 'ClockHQ Platform',
    tagline: 'B2B partner & customer portal',
    description:
      'Multi-tenant B2B SaaS portal serving as the marketing site and customer-facing platform for ClockHQ subscribers.',
    tech: ['Next.js', 'TypeScript', 'Prisma', 'NextAuth.js v5', 'JWT'],
    category: 'B2B SaaS',
    url: 'https://platform.clock-hq.com/',
    highlights: [
      'Multi-tenant architecture with isolated customer data',
      'Integrated marketing site + customer portal',
      'NextAuth v5 with JWT and bcrypt',
      'Partner management and onboarding',
    ],
  },
  {
    name: 'Clear Choice Laundry',
    tagline: 'Full-stack laundry service platform + mobile app',
    description:
      'End-to-end laundry service management system with customer booking, subscription plans, route management, and a published native mobile app.',
    tech: ['PHP 8', 'MySQL', 'Redis', 'Stripe', 'React Native', 'Expo', 'Docker'],
    category: 'Full-Stack + Mobile',
    url: 'https://clearchoicelaundry.com',
    highlights: [
      'Custom PHP MVC framework with Stripe recurring billing',
      'Subscription plans: weekly, bi-weekly, monthly',
      'Published native iOS & Android app (Expo)',
      'Admin dashboard with route & workflow management',
    ],
  },
  {
    name: 'PrimeAir',
    tagline: 'Service platform monorepo',
    description:
      'Full-stack service platform built on a Turborepo monorepo with shared packages across hub management and timeclock applications.',
    tech: ['Next.js', 'TypeScript', 'tRPC', 'Prisma', 'Turborepo'],
    category: 'SaaS Platform',
    highlights: [
      'Turborepo with shared @primeair/* packages',
      'Hub + timeclock dual-app setup',
      'Database-first architecture with Prisma',
      'Centralized API layer with tRPC',
    ],
  },
  {
    name: 'Jamestown Cafe',
    tagline: 'POS & booking management system',
    description:
      'Full-stack POS and online booking system for a local cafe with real-time Square catalog sync and payment processing.',
    tech: ['PHP 8', 'Slim 4', 'MySQL', 'Square POS', 'Redis', 'Docker'],
    category: 'POS & Booking',
    url: 'https://thejamestowncafe.com',
    highlights: [
      'Square POS catalog and inventory sync',
      'Slim 4 REST API layer',
      'Online booking with table management',
      'Real-time order processing',
    ],
  },
  {
    name: 'Hatch Bag',
    tagline: 'Magento 2 e-commerce store',
    description:
      'Enterprise Magento 2.4 store with premium extensions, email marketing automation, and multiple payment integrations.',
    tech: ['Magento 2', 'PHP', 'Elasticsearch', 'Klaviyo', 'Mollie', 'GA4'],
    category: 'E-Commerce',
    url: 'https://www.hatchbag.us/',
    highlights: [
      'Magento 2.4.8 with Elasticsearch',
      'Klaviyo email marketing integration',
      'Mollie payment gateway',
      'SEO, blog, and shipping extensions',
    ],
  },
  {
    name: 'Watsco',
    tagline: 'Headless Shopware 6 commerce platform',
    description:
      'Multi-language Shopware 6 headless commerce platform with custom plugin development and multi-region support.',
    tech: ['Shopware 6', 'PHP', 'Symfony', 'Elasticsearch'],
    category: 'Headless Commerce',
    url: 'https://www.watsco.com/',
    highlights: [
      'Shopware 6.6 headless architecture',
      'Multi-language support (English, German, Dutch)',
      'Custom Shopware plugin development',
      'Symfony-based admin and storefront',
    ],
  },
]

export const apps = [
  {
    name: 'Clear Choice Laundry',
    description:
      'Customer-facing mobile app for booking laundry services, managing subscriptions, tracking orders, and making payments — built in React Native and published to both app stores.',
    platforms: ['iOS', 'Android'],
    appStoreUrl: 'https://apps.apple.com/us/app/clear-choice-laundry/id6764087033',
    tech: ['React Native', 'Expo', 'TypeScript', 'Stripe', 'Biometric Auth', 'Google Places'],
    highlights: [
      'Face ID / fingerprint authentication via Expo SecureStore',
      'Stripe React Native payment integration',
      'Google Places autocomplete for pickup address',
      'Real-time order status tracking',
      'Push notifications for order updates',
    ],
  },
]
