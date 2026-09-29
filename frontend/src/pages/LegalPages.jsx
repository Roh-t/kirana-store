import { useEffect } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const SUPPORT_EMAIL = '[ADD SUPPORT EMAIL]';
const EFFECTIVE_DATE = '[ADD LAST UPDATED DATE]';

const legalPages = {
  privacy: {
    title: 'Privacy Policy',
    description: 'Learn how Kirana Store collects, uses, protects, and stores information when you use our SaaS platform.',
    sections: [
      {
        heading: '1. About this policy',
        paragraphs: [
          'Kirana Store is a digital SaaS platform for kirana shopkeepers and small retail businesses. This Privacy Policy explains how information is handled when you visit our website, create an account, manage a store, or use our digital ordering and store-management features.',
          'Kirana Store is currently operated from Bhopal, Madhya Pradesh, India. The business registration details will be updated here after registration.'
        ]
      },
      {
        heading: '2. Information we may collect',
        paragraphs: [
          'Depending on how you use the platform, we may collect account and business information such as your name, phone number, login details, store name, store address, store hours, product catalog, inventory, customer records, orders, and payment-related status.',
          'When you use a customer storefront, information you submit for an order may include your name, phone number, delivery address, order notes, and order details.',
          'We also receive technical information such as browser type, device information, approximate usage information, log data, and information stored locally in your browser to keep you signed in or preserve a shopping cart.'
        ]
      },
      {
        heading: '3. How we use information',
        paragraphs: [
          'We use information to provide, maintain, secure, and improve the Kirana Store platform; authenticate users; manage stores, products, inventory, customers, and orders; process or coordinate payments through payment service providers; provide support; prevent misuse; and comply with applicable legal obligations.',
          'We do not sell personal information. We use information only for the purposes described in this policy or for purposes explained to you when the information is collected.'
        ]
      },
      {
        heading: '4. Service providers',
        paragraphs: [
          'We may use carefully selected service providers for hosting, databases, image storage, payment processing, communications, security, analytics, and other infrastructure needed to operate the service. These providers may process information only as needed to provide their services and under their own applicable terms and privacy policies.',
          'Payment card, UPI, and other payment credentials should be entered only through the payment provider’s secure checkout. Kirana Store does not intend to store full payment credentials.'
        ]
      },
      {
        heading: '5. Data retention and security',
        paragraphs: [
          'We retain information for as long as needed to provide the service, maintain business and transaction records, resolve disputes, enforce agreements, and meet legal or security requirements. Retention periods may vary by the type of information.',
          'We use reasonable technical and organizational safeguards. No internet service can guarantee absolute security, so please use a strong password and keep account credentials confidential.'
        ]
      },
      {
        heading: '6. Your choices and requests',
        paragraphs: [
          'You may request access to, correction of, or deletion of personal information associated with your account, subject to legal and operational requirements. You may also ask questions about our handling of information by contacting us at the support address below.',
          `Support contact: ${SUPPORT_EMAIL}`
        ]
      },
      {
        heading: '7. Changes to this policy',
        paragraphs: [
          'We may update this policy when the service, law, or our data practices change. The updated version will be published on this page with a revised effective date.'
        ]
      }
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    description: 'Read the terms that apply when you access or use the Kirana Store SaaS platform.',
    sections: [
      {
        heading: '1. Agreement',
        paragraphs: [
          'These Terms & Conditions govern your access to and use of Kirana Store, a SaaS platform intended to help kirana shopkeepers and small retail businesses manage store operations and digital orders.',
          'By creating an account, accessing the platform, or using a customer storefront, you agree to these terms. If you do not agree, please do not use the service.'
        ]
      },
      {
        heading: '2. Eligibility and account responsibility',
        paragraphs: [
          'You must provide accurate information and keep your account credentials confidential. You are responsible for activity performed through your account and for ensuring that people you authorize to use your store account have appropriate permissions.',
          'You must promptly update inaccurate information and notify us if you suspect unauthorized access.'
        ]
      },
      {
        heading: '3. Acceptable use',
        paragraphs: [
          'You may use the service only for lawful business and ordering activities. You must not misuse the service, interfere with its operation, attempt unauthorized access, upload malicious code, submit unlawful or infringing content, abuse payment or messaging features, or use the platform to violate another person’s rights.',
          'You are responsible for the accuracy, legality, and appropriate use of product information, prices, tax details, customer records, store policies, and other content you enter.'
        ]
      },
      {
        heading: '4. Store content and customer data',
        paragraphs: [
          'You retain responsibility for content and business data submitted to your store. You confirm that you have the necessary rights and permissions to use that content and to process customer information through the service.',
          'You must provide customers with accurate information about products, prices, availability, delivery, pickup, cancellations, and refunds applicable to your store.'
        ]
      },
      {
        heading: '5. Payments and third-party services',
        paragraphs: [
          'Some features may use third-party payment, communication, hosting, image, or other services. Their terms may also apply. Kirana Store may display payment status or transaction information received from those providers, but payment processing is subject to the provider’s systems and terms.',
          'You remain responsible for applicable taxes, licenses, regulatory requirements, and business obligations relating to your store.'
        ]
      },
      {
        heading: '6. Availability and changes',
        paragraphs: [
          'We aim to keep the service reliable, but availability may be affected by maintenance, updates, network issues, third-party services, or events outside our reasonable control. Features may change as the platform develops.',
          'We may suspend or restrict access where reasonably necessary for security, misuse prevention, legal compliance, or a material violation of these terms.'
        ]
      },
      {
        heading: '7. Disclaimer and limitation',
        paragraphs: [
          'Kirana Store provides software tools and does not act as a seller, retailer, delivery provider, tax adviser, legal adviser, or payment provider for your business. You are responsible for decisions and transactions made through your store.',
          'To the extent permitted by applicable law, the service is provided on an as-available basis and we are not responsible for losses caused by inaccurate store data, customer-provided information, third-party outages, or your failure to secure your account.'
        ]
      },
      {
        heading: '8. Contact',
        paragraphs: [
          `Questions about these terms can be sent to ${SUPPORT_EMAIL}. The business registration and formal legal entity details will be added after registration.`
        ]
      }
    ]
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    description: 'Understand how subscription and digital service cancellations and refunds are handled by Kirana Store.',
    sections: [
      {
        heading: '1. Digital service',
        paragraphs: [
          'Kirana Store is a digital SaaS service. There is no physical product shipment for a Kirana Store subscription or account. Access is provided electronically after account creation or successful payment, subject to the applicable plan and payment confirmation.'
        ]
      },
      {
        heading: '2. Cancellation',
        paragraphs: [
          'You may request cancellation of your subscription or account by contacting us at the support address below. The effective timing and access consequences depend on the plan and billing terms shown to you before purchase.',
          'Cancellation of a store account does not automatically cancel or reverse customer orders that have already been placed. Store owners remain responsible for communicating order-level cancellations or refunds to their customers.'
        ]
      },
      {
        heading: '3. Refund requests',
        paragraphs: [
          'Refund eligibility, if available, will depend on the plan, payment status, duplicate or erroneous charge, service issue, and any terms displayed at checkout. We do not state a fixed refund period here because the applicable commercial terms have not yet been finalized.',
          `Before enabling paid plans, replace this section with the approved refund period and conditions. For now, send requests to ${SUPPORT_EMAIL} with the account details, transaction reference, date, amount, and reason for the request.`
        ]
      },
      {
        heading: '4. Processing',
        paragraphs: [
          'Approved refunds will normally be initiated through the original payment method or the payment provider’s supported process. The time for the amount to appear depends on the payment provider and the customer’s bank.',
          'We may request reasonable information to verify a request and prevent fraud or duplicate refunds.'
        ]
      },
      {
        heading: '5. Customer orders',
        paragraphs: [
          'For products ordered from a store using a Kirana Store storefront, the relevant store owner is responsible for order acceptance, preparation, pickup or delivery, cancellations, product quality, and any customer-order refund. Customers should first contact the store using the contact details published by that store.'
        ]
      }
    ]
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    description: 'Learn how digital access and customer order fulfillment work on the Kirana Store platform.',
    sections: [
      {
        heading: '1. Digital SaaS access',
        paragraphs: [
          'Kirana Store is a software service and does not ship physical products to subscribers. After registration or successful payment, digital access is delivered by enabling your account and making the service available online.',
          'Access may depend on payment confirmation, account verification, service availability, and any plan conditions shown at the time of purchase.'
        ]
      },
      {
        heading: '2. Store customer orders',
        paragraphs: [
          'Kirana Store provides tools that allow an individual store to offer pickup or delivery options. The store owner, not Kirana Store, is responsible for confirming the order, preparing products, arranging delivery where offered, communicating timing, and handling delivery issues.',
          'Delivery areas, charges, estimated times, minimum order values, and pickup instructions may vary by store and should be displayed or communicated by that store before fulfillment.'
        ]
      },
      {
        heading: '3. Delays and unavailable items',
        paragraphs: [
          'A store may contact a customer if an item is unavailable, an order requires substitution, or delivery is delayed. Customers should use the store’s published contact information for order-specific questions.'
        ]
      },
      {
        heading: '4. Support',
        paragraphs: [
          `For questions about access to the Kirana Store software, contact ${SUPPORT_EMAIL}. For a specific grocery order, contact the store shown on the relevant storefront or order communication.`
        ]
      }
    ]
  },
  contact: {
    title: 'Contact Us',
    description: 'Contact the Kirana Store team for SaaS support, account questions, and payment assistance.',
    sections: [
      {
        heading: 'We are here to help',
        paragraphs: [
          'Kirana Store helps kirana shopkeepers and small retail businesses reduce paperwork and manage their business digitally. Contact us for questions about the platform, account access, subscriptions, payments, privacy, or legal policies.'
        ]
      },
      {
        heading: 'Support contact',
        paragraphs: [
          `Email: ${SUPPORT_EMAIL}`,
          'Please replace the placeholder above before publishing payment-gateway onboarding materials. Include your account or store name, a clear description of the issue, and relevant transaction information. Do not send passwords, card numbers, UPI PINs, or other secret credentials.'
        ]
      },
      {
        heading: 'Business location',
        paragraphs: [
          'Bhopal, Madhya Pradesh, India',
          'Kirana Store is currently not registered as a company or business entity. Registration and formal legal entity details will be added to this page after completion.'
        ]
      },
      {
        heading: 'Response expectations',
        paragraphs: [
          'We will make reasonable efforts to review support requests. A specific response-time commitment has not been published yet and should be added once the support process is finalized.'
        ]
      }
    ]
  },
  cookies: {
    title: 'Cookie Policy',
    description: 'Learn how Kirana Store uses browser storage and similar technologies.',
    sections: [
      {
        heading: '1. What we use',
        paragraphs: [
          'Kirana Store currently uses browser storage and similar technologies to operate the website. This includes local storage for keeping an authenticated session token and preserving a customer shopping cart for a store storefront.',
          'The website also uses a service worker for progressive web app behavior and may use essential technical storage required for security, performance, and reliable operation.'
        ]
      },
      {
        heading: '2. Essential operation',
        paragraphs: [
          'These technologies are used to provide features you request, such as keeping you signed in, retaining items in a shopping cart, loading the application, and maintaining a reliable user experience. If you block or clear them, some features may stop working or require you to sign in again.'
        ]
      },
      {
        heading: '3. Analytics and third parties',
        paragraphs: [
          'No separate advertising cookie program is described in this policy. If analytics, advertising, or other non-essential tracking is added later, this policy and any required consent experience will be updated before those technologies are used.'
        ]
      },
      {
        heading: '4. Your controls',
        paragraphs: [
          'You can clear browser storage through your browser settings. You can also use browser privacy controls to restrict storage, but doing so may affect login, cart persistence, or other essential features.',
          `Questions about browser storage can be sent to ${SUPPORT_EMAIL}.`
        ]
      }
    ]
  }
};

function setPageMetadata(title, description) {
  document.title = `${title} | Kirana Store`;
  let descriptionElement = document.querySelector('meta[name="description"]');
  if (!descriptionElement) {
    descriptionElement = document.createElement('meta');
    descriptionElement.name = 'description';
    document.head.appendChild(descriptionElement);
  }
  descriptionElement.content = description;
}

function LegalFooter() {
  return (
    <footer className="mt-12 border-t border-stone-200 pt-6 text-sm text-stone-500">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <a className="hover:text-emerald-700" href="/privacy-policy">Privacy</a>
        <a className="hover:text-emerald-700" href="/terms-and-conditions">Terms</a>
        <a className="hover:text-emerald-700" href="/refund-cancellation-policy">Refunds</a>
        <a className="hover:text-emerald-700" href="/shipping-delivery-policy">Shipping</a>
        <a className="hover:text-emerald-700" href="/cookie-policy">Cookies</a>
        <a className="hover:text-emerald-700" href="/contact-us">Contact</a>
      </div>
      <p className="mt-4 text-xs">© {new Date().getFullYear()} Kirana Store. All rights reserved.</p>
    </footer>
  );
}

function LegalPage({ pageKey }) {
  const page = legalPages[pageKey];

  useEffect(() => {
    setPageMetadata(page.title, page.description);
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6 text-stone-900 sm:px-6 sm:py-10">
      <main className="mx-auto max-w-4xl">
        <header className="rounded-3xl border border-emerald-100 bg-white px-5 py-6 shadow-sm sm:px-10 sm:py-8">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Kirana Store
          </a>
          <div className="mt-7 flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Kirana Store</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{page.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{page.description}</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-stone-400">Effective date: {EFFECTIVE_DATE}</p>
        </header>

        <article className="mt-5 rounded-3xl border border-stone-200 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
          <div className="space-y-8">
            {page.sections.map((section) => (
              <section key={section.heading} aria-labelledby={section.heading}>
                <h2 id={section.heading} className="text-lg font-extrabold text-stone-900 sm:text-xl">
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-stone-600">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <LegalFooter />
      </main>
    </div>
  );
}

export function LegalLinks() {
  return (
    <nav aria-label="Legal information" className="flex max-w-sm flex-wrap justify-center gap-x-3 gap-y-1 px-2 pb-2 text-[10px] text-stone-500">
      <a className="hover:text-emerald-700" href="/privacy-policy">Privacy</a>
      <a className="hover:text-emerald-700" href="/terms-and-conditions">Terms</a>
      <a className="hover:text-emerald-700" href="/refund-cancellation-policy">Refunds</a>
      <a className="hover:text-emerald-700" href="/shipping-delivery-policy">Shipping</a>
      <a className="hover:text-emerald-700" href="/cookie-policy">Cookies</a>
      <a className="hover:text-emerald-700" href="/contact-us">Contact</a>
    </nav>
  );
}

export function LegalRoute({ pageKey }) {
  return <LegalPage pageKey={pageKey} />;
}
