import { Link } from 'react-router-dom'

const LAST_UPDATED = 'May 18, 2026'
const CONTACT_EMAIL = 'r.patt9134@gmail.com'
const OPERATOR_NAME = 'Ryan Patt'
const OPERATOR_WEBSITE = 'https://ryanpatt.com'

export default function PrivacyAndTerms() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14 leading-relaxed">
        {/* Header */}
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
            ← {OPERATOR_WEBSITE.replace(/^https?:\/\//, '')}
          </Link>
          <h1 className="mt-6 font-semibold text-4xl md:text-5xl text-zinc-50 leading-tight">
            Privacy Policy &amp; Terms of Service
          </h1>
          <p className="mt-3 text-zinc-400 text-sm">
            Last updated <time dateTime="2026-05-18">{LAST_UPDATED}</time> · Operated by {OPERATOR_NAME}
          </p>
        </div>

        {/* At a glance — plain-English summary */}
        <Callout title="At a glance">
          <ul className="space-y-2 text-sm">
            <li>
              These services are operated by <strong>{OPERATOR_NAME}</strong> in a
              <strong> development &amp; testing capacity</strong>. Any data submitted here is
              treated as test data.
            </li>
            <li>
              We <strong>never sell, rent, share, or trade</strong> any personally identifiable
              information (including names, phone numbers, or email addresses) with any third
              party for their own marketing or any other purpose.
            </li>
            <li>
              Test data is held briefly on the operator&apos;s development environment, is
              <strong> automatically wiped</strong> on each development cycle, and is not
              copied off the operator&apos;s local machine.
            </li>
            <li>
              You can opt out of any SMS at any time by replying <strong>STOP</strong> or
              email by clicking the unsubscribe link. Reply <strong>HELP</strong> to any
              SMS for assistance.
            </li>
            <li>
              Message and data rates may apply. Message frequency varies and is limited to
              transactional messages tied to test actions you initiate.
            </li>
          </ul>
        </Callout>

        {/* TOC */}
        <nav className="mt-8 mb-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Contents</div>
          <ol className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 list-decimal list-inside text-zinc-300">
            <li><a href="#privacy" className="hover:text-zinc-100">Privacy Policy</a></li>
            <li><a href="#data-collected" className="hover:text-zinc-100">Information we collect</a></li>
            <li><a href="#data-use" className="hover:text-zinc-100">How we use it</a></li>
            <li><a href="#no-sharing" className="hover:text-zinc-100">No third-party sharing</a></li>
            <li><a href="#service-providers" className="hover:text-zinc-100">Service providers</a></li>
            <li><a href="#retention" className="hover:text-zinc-100">Retention &amp; auto-wipe</a></li>
            <li><a href="#sms-terms" className="hover:text-zinc-100">SMS messaging terms</a></li>
            <li><a href="#email-terms" className="hover:text-zinc-100">Email communication terms</a></li>
            <li><a href="#prefs" className="hover:text-zinc-100">Communication preferences</a></li>
            <li><a href="#rights" className="hover:text-zinc-100">Your rights</a></li>
            <li><a href="#security" className="hover:text-zinc-100">Security</a></li>
            <li><a href="#contact" className="hover:text-zinc-100">Contact</a></li>
          </ol>
        </nav>

        {/* PRIVACY */}
        <Section id="privacy" title="Privacy Policy">
          <p>
            This policy describes how {OPERATOR_NAME} (the &ldquo;Operator,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) collects, uses, and protects information you provide to development &amp;
            testing services hosted under <code className="bg-zinc-800 px-1 rounded">ryanpatt.com</code>
            {' '}and any subdomains or projects operated by the Operator (collectively, the
            &ldquo;Services&rdquo;). The Services are operated solely for <strong>development, demonstration,
            and testing</strong> purposes.
          </p>
          <p>
            By using the Services or providing your phone number or email address, you consent to
            the practices described in this policy.
          </p>
        </Section>

        <Section id="data-collected" title="Information we collect">
          <p>The Services may collect the following categories of information:</p>
          <ul className="list-disc list-inside space-y-1 mt-3">
            <li>
              <strong>Contact information</strong>: name, mobile phone number, and email address you
              voluntarily provide (for example, when placing a test order or signing up for an
              account).
            </li>
            <li>
              <strong>Delivery address</strong>: street address provided when testing delivery
              functionality.
            </li>
            <li>
              <strong>Test transaction data</strong>: items selected, options chosen, test payment
              identifiers (Stripe test-mode PaymentIntent IDs only — no real card numbers ever
              touch our servers).
            </li>
            <li>
              <strong>Communication consent records</strong>: timestamp and source of your
              opt-in to SMS or email communications, per applicable telecommunications regulations.
            </li>
            <li>
              <strong>Basic technical information</strong>: IP address, user-agent, and request
              metadata necessary to deliver the Services and prevent abuse.
            </li>
          </ul>
          <p className="mt-3">
            We do not knowingly collect information from anyone under the age of 13. If you
            believe a minor has provided information, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">{CONTACT_EMAIL}</a>{' '}
            and we will remove it.
          </p>
        </Section>

        <Section id="data-use" title="How we use information">
          <p>We use the information collected solely to:</p>
          <ul className="list-disc list-inside space-y-1 mt-3">
            <li>
              Deliver the requested transactional communications, such as confirming a test
              order placed through the Services and sending status updates about that test
              order (received → preparing → ready → delivered).
            </li>
            <li>Process test-mode payments through Stripe.</li>
            <li>Respond to support requests you initiate.</li>
            <li>Detect, prevent, and address abuse, fraud, or technical problems.</li>
            <li>Comply with applicable legal obligations.</li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> use any information collected for marketing, advertising,
            profiling, or targeted promotional purposes.
          </p>
        </Section>

        <Section id="no-sharing" title="No third-party sharing">
          <p className="font-medium text-zinc-50">
            We do not sell, rent, lease, share, or trade your personally identifiable information,
            including but not limited to your mobile phone number and SMS opt-in consent, to any
            third party for their own marketing purposes or for any other purpose.
          </p>
          <p className="mt-3">
            Mobile information &mdash; including phone numbers and the consent you provide to
            receive text messages &mdash; is <strong>not shared with any third parties or
            affiliates for marketing or promotional purposes</strong>. The only parties that may
            receive your information are the service providers listed below, and only to the
            extent strictly necessary to deliver the communications you request.
          </p>
          <p className="mt-3">
            We may disclose information when required by law (for example, in response to a valid
            subpoena) or to protect our rights, property, or safety.
          </p>
        </Section>

        <Section id="service-providers" title="Service providers">
          <p>
            We use the following third-party processors to deliver the Services. Each processor
            handles information only on our behalf and is contractually limited to performing
            the function for which it was engaged.
          </p>
          <div className="mt-4 grid gap-3">
            <Provider name="Twilio" purpose="SMS message delivery for transactional order updates and verification codes." privacy="https://www.twilio.com/legal/privacy" />
            <Provider name="Resend" purpose="Transactional email delivery (order confirmation receipts, support replies)." privacy="https://resend.com/legal/privacy-policy" />
            <Provider name="Stripe" purpose="Test-mode payment processing. No real card data is stored by us." privacy="https://stripe.com/privacy" />
            <Provider name="Supabase" purpose="Database, authentication, and realtime infrastructure for the Services." privacy="https://supabase.com/privacy" />
            <Provider name="Vercel" purpose="Web application hosting." privacy="https://vercel.com/legal/privacy-policy" />
            <Provider name="Cloudflare" purpose="DNS and (where applicable) content delivery." privacy="https://www.cloudflare.com/privacypolicy/" />
          </div>
        </Section>

        <Section id="retention" title="Retention and auto-wipe">
          <p>
            Because the Services are operated for development and testing, data lifecycle is
            intentionally short:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3">
            <li>
              Test transaction records (orders, contact info, addresses, delivery notes) are
              retained only as long as necessary for active testing and are <strong>automatically
              wiped on each development cycle</strong>, typically within days of submission.
            </li>
            <li>
              Source data is held in the operator&apos;s development environment and is not exported
              or copied off of the operator&apos;s local machine outside of routine, encrypted
              cloud backups for the operator&apos;s personal use.
            </li>
            <li>
              SMS opt-in and opt-out consent records are retained as long as legally required by
              applicable telecommunications regulations, separately from operational data.
            </li>
            <li>
              You may request earlier deletion of any data you provided at any time by emailing{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">{CONTACT_EMAIL}</a>.
            </li>
          </ul>
        </Section>

        {/* SMS TERMS */}
        <Section id="sms-terms" title="SMS messaging terms">
          <p className="font-medium text-zinc-50">
            By providing your mobile phone number to the Services and agreeing to receive
            messages, you consent to receive transactional SMS messages from the Operator.
          </p>

          <SmsRow label="Program description">
            Transactional SMS messages tied to test actions you initiate, including order status
            updates (received, preparing, ready, out for delivery, delivered), and one-time
            verification codes for sign-in.
          </SmsRow>
          <SmsRow label="Message frequency">
            Message frequency varies and depends on the actions you take. Typical usage is
            <strong> 1&ndash;5 messages per test order</strong>. We do not send recurring
            promotional or marketing messages.
          </SmsRow>
          <SmsRow label="Message and data rates">
            <strong>Message and data rates may apply.</strong> Your wireless carrier&apos;s standard
            rates apply to all messages sent or received.
          </SmsRow>
          <SmsRow label="Opt-in (consent)">
            You opt in to receive SMS by voluntarily providing your mobile phone number during
            checkout or sign-up and confirming you wish to receive status updates. Consent is
            not a condition of any purchase.
          </SmsRow>
          <SmsRow label="Opt-out — reply STOP">
            You can opt out at any time by replying <strong>STOP</strong> to any message we send.
            After replying STOP you will receive a single confirmation message and no further
            SMS will be sent from the program. You may also email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">{CONTACT_EMAIL}</a>{' '}
            to be removed.
          </SmsRow>
          <SmsRow label="Help — reply HELP">
            Reply <strong>HELP</strong> to any message for support. You can also email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">{CONTACT_EMAIL}</a>.
          </SmsRow>
          <SmsRow label="Supported carriers">
            T-Mobile, AT&amp;T, Verizon Wireless, Sprint, Boost, Cricket, MetroPCS, U.S. Cellular,
            and most other US mobile carriers. <strong>Carriers are not liable for delayed
            or undelivered messages.</strong>
          </SmsRow>
          <SmsRow label="Mobile information sharing">
            <strong>
              No mobile information will be shared with third parties or affiliates for
              marketing or promotional purposes.
            </strong>{' '}
            Information sharing to subcontractors in support of the program (for example, Twilio,
            our SMS gateway) is permitted only as necessary to operate the service.
          </SmsRow>
          <SmsRow label="Privacy">
            See the <a href="#privacy" className="underline">Privacy Policy</a> above for how
            information related to messaging is collected, used, and stored.
          </SmsRow>
        </Section>

        {/* EMAIL TERMS */}
        <Section id="email-terms" title="Email communication terms">
          <p>
            By providing your email address to the Services, you consent to receive transactional
            emails directly related to test actions you initiate (such as order receipts and
            replies to support inquiries).
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3">
            <li>
              Email frequency is limited to transactional messages; we do not send promotional
              or marketing email.
            </li>
            <li>
              Every email contains a means to opt out (either an unsubscribe link or instructions
              to reply with the word UNSUBSCRIBE). You may also email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">{CONTACT_EMAIL}</a>{' '}
              to opt out of all communications.
            </li>
            <li>
              We comply with the CAN-SPAM Act of 2003 and applicable email regulations in the
              United States.
            </li>
          </ul>
        </Section>

        {/* PREFERENCES */}
        <Section id="prefs" title="Communication preferences">
          <p>You can manage your communication preferences at any time:</p>
          <ul className="list-disc list-inside space-y-1 mt-3">
            <li>
              <strong>SMS</strong>: reply <code className="bg-zinc-800 px-1 rounded">STOP</code> to
              opt out, <code className="bg-zinc-800 px-1 rounded">HELP</code> for assistance.
            </li>
            <li>
              <strong>Email</strong>: click the unsubscribe link in any message, or reply with the
              word <code className="bg-zinc-800 px-1 rounded">UNSUBSCRIBE</code>.
            </li>
            <li>
              <strong>All communications</strong>: email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">{CONTACT_EMAIL}</a>{' '}
              with the subject &ldquo;Remove me&rdquo; and we will delete your contact information from
              the Services and confirm in writing.
            </li>
          </ul>
        </Section>

        {/* RIGHTS */}
        <Section id="rights" title="Your rights">
          <p>
            Subject to applicable law (including CCPA/CPRA, GDPR, and similar regimes), you have
            the right to:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3">
            <li>Request access to the personal information we hold about you.</li>
            <li>Request correction of inaccurate personal information.</li>
            <li>Request deletion of your personal information.</li>
            <li>Withdraw consent to communications.</li>
            <li>Lodge a complaint with a supervisory authority.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">{CONTACT_EMAIL}</a>.
            We will respond within a reasonable time and at most within the periods required by
            applicable law.
          </p>
        </Section>

        <Section id="security" title="Security">
          <p>
            We apply reasonable administrative, technical, and physical safeguards to protect
            information against loss, theft, and unauthorized access. Data in transit is encrypted
            with TLS. Test transaction data is held in encrypted databases provided by our
            service providers (see <a href="#service-providers" className="underline">Service
            providers</a>). No method of transmission or storage is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </Section>

        <Section id="changes" title="Changes to this policy">
          <p>
            We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top
            of the page reflects the most recent revision. Material changes will be communicated
            through the Services or directly to active users.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Questions about this Privacy Policy or our messaging programs can be directed to:
          </p>
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
            <div>{OPERATOR_NAME}</div>
            <div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-100 underline">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div>
              <a href={OPERATOR_WEBSITE} className="text-zinc-100 underline">
                {OPERATOR_WEBSITE.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-800 text-xs text-zinc-500">
          <p>
            This document is provided by {OPERATOR_NAME} for the development and testing of
            software services. It is not legal advice. The Operator reserves the right to amend
            this document at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-8">
      <h2 className="font-semibold text-2xl text-zinc-50 mb-3">{title}</h2>
      <div className="space-y-3 text-zinc-300">{children}</div>
    </section>
  )
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
      <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold mb-2">
        {title}
      </div>
      <div className="text-zinc-200">{children}</div>
    </div>
  )
}

function SmsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 grid sm:grid-cols-[180px_1fr] gap-2 sm:gap-4 text-sm">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 sm:pt-0.5">{label}</div>
      <div className="text-zinc-300">{children}</div>
    </div>
  )
}

function Provider({ name, purpose, privacy }: { name: string; purpose: string; privacy: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-medium text-zinc-100">{name}</div>
        <a href={privacy} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-100 underline">
          their privacy policy ↗
        </a>
      </div>
      <div className="mt-1 text-zinc-400">{purpose}</div>
    </div>
  )
}
