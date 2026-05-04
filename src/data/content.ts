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
  { value: '10+', label: 'Years Experience' },
  { value: '5', label: 'Enterprise Platforms' },
  { value: '2', label: 'Apps Published' },
  { value: '3', label: 'Global Regions' },
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
    title: 'Lead Magento Architect',
    company: 'Wacom',
    period: '2019 — Present',
    location: 'Remote · US, EMEA & Southeast Asia',
    highlights: [
      'Led Adobe Commerce Cloud implementations across US, European, and Asia-Pacific markets',
      'Built end-to-end enterprise integrations connecting Magento with SAP, NetSuite, and Salesforce',
      'Architected Best Buy marketplace integration for real-time catalog sync and order management',
      'Drove headless commerce adoption across global storefronts using PWA Studio and custom React front-ends',
      'Managed cross-functional teams across multiple time zones and regions',
    ],
  },
  {
    title: 'Full-Stack Engineer',
    company: 'Independent / Freelance',
    period: '2017 — Present',
    location: 'Remote',
    highlights: [
      'Built and launched SaaS platforms for time tracking, laundry services, and hospitality',
      'Developed and published native iOS and Android apps using React Native and Expo',
      'Delivered custom Shopware 6 and Magento 2 storefronts for international clients',
      'Architected Turborepo monorepos with shared packages for scalable multi-app platforms',
      'Integrated POS systems (Square), payment processors (Stripe, Mollie), and email platforms (Klaviyo)',
    ],
  },
]

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

export const projects = [
  {
    name: 'ClockHQ',
    tagline: 'Time tracking & HR SaaS platform',
    description:
      'Full-featured time tracking and workforce management platform built as a Turborepo monorepo with separate hub and timeclock applications.',
    tech: ['Next.js', 'TypeScript', 'tRPC', 'Prisma', 'Stripe', 'NextAuth', 'AWS S3'],
    category: 'SaaS Platform',
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
    highlights: [
      'Square POS catalog and inventory sync',
      'Slim 4 REST API layer',
      'Online booking with table management',
      'Real-time order processing',
    ],
  },
  {
    name: 'HATC Bag',
    tagline: 'Magento 2 e-commerce store',
    description:
      'Enterprise Magento 2.4 store with premium extensions, email marketing automation, and multiple payment integrations.',
    tech: ['Magento 2', 'PHP', 'Elasticsearch', 'Klaviyo', 'Mollie', 'GA4'],
    category: 'E-Commerce',
    highlights: [
      'Magento 2.4.8 with Elasticsearch',
      'Klaviyo email marketing integration',
      'Mollie payment gateway',
      'SEO, blog, and shipping extensions',
    ],
  },
  {
    name: 'Wastco',
    tagline: 'Headless Shopware 6 commerce platform',
    description:
      'Multi-language Shopware 6 headless commerce platform for waste management services with custom plugin development.',
    tech: ['Shopware 6', 'PHP', 'Symfony', 'Elasticsearch'],
    category: 'Headless Commerce',
    highlights: [
      'Shopware 6.6 headless architecture',
      'Multi-language support (English, German, Dutch)',
      'Custom Shopware plugin development',
      'Symfony-based admin and storefront',
    ],
  },
  {
    name: 'Loads of Love Laundry',
    tagline: 'Customer booking & subscription platform',
    description:
      'Full-featured laundry booking platform with subscription management, order tracking, and integrated staff-customer messaging.',
    tech: ['PHP 8', 'MySQL', 'Custom MVC', 'Stripe'],
    category: 'Service Platform',
    highlights: [
      'Subscription management with automated billing',
      'Real-time order tracking dashboard',
      'In-app messaging between staff and customers',
      'Admin reporting and analytics',
    ],
  },
]

export const apps = [
  {
    name: 'Clear Choice Laundry',
    description:
      'Customer-facing mobile app for booking laundry services, managing subscriptions, tracking orders, and making payments — built in React Native and published to both app stores.',
    platforms: ['iOS', 'Android'],
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
