export default function About() {
  return (
    <section id="about" className="relative px-10 md:px-16 lg:px-20 py-24 border-t border-border-subtle">
      <span className="section-number">01</span>

      <div className="max-w-5xl">
        <div className="reveal">
          <h2 className="section-title">About</h2>
          <div className="section-divider" />
        </div>

        <div className="grid md:grid-cols-5 gap-12 items-start">
          <div className="md:col-span-3 space-y-5 reveal">
            <p className="text-ink/90 leading-relaxed text-base">
              I'm a full-stack engineer and solutions architect based in{' '}
              <span className="text-gold font-medium">Jamestown, Ohio</span>, with over a decade of
              experience building and shipping products across e-commerce, SaaS, and mobile platforms.
            </p>
            <p className="text-muted leading-relaxed text-base">
              My career has been defined by bridging the gap between complex enterprise systems and
              intuitive user experiences. As Lead Magento Architect at{' '}
              <span className="text-ink font-medium">Wacom</span>, I led Adobe Commerce Cloud
              implementations across the US, EMEA, and Southeast Asia — connecting storefronts with
              SAP, NetSuite, Salesforce, and the Best Buy marketplace.
            </p>
            <p className="text-muted leading-relaxed text-base">
              Outside enterprise work, I design and build SaaS platforms from the ground up — from the
              database schema to the deployed mobile app. I'm fluent in headless commerce architectures,
              React Native, and the full spectrum of modern JavaScript and PHP ecosystems.
            </p>
          </div>

          <div className="md:col-span-2 space-y-4 reveal">
            <div className="card space-y-4">
              <InfoRow icon="📍" label="Location" value="Jamestown, Ohio — Remote" />
              <InfoRow icon="🌍" label="Regions" value="US · EMEA · Southeast Asia" />
              <InfoRow icon="🗣️" label="Languages" value="English · Spanish" />
              <InfoRow icon="🎓" label="Education" value="St. Petersburg College, 2014–2017" />
              <InfoRow icon="📱" label="Published" value="iOS App Store · Google Play" />
              <InfoRow icon="✅" label="Status" value="Open to opportunities" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-muted uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-sm text-ink">{value}</div>
      </div>
    </div>
  )
}
