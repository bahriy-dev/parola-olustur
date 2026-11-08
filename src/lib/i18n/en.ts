import { TranslationDictionary } from './tr';

export const en: TranslationDictionary = {
  guide: {
    title: 'What You Need to Know About Password Security',
    subtitle: 'Fundamental cybersecurity principles and modern best practices for safeguarding your accounts.',
    topics: [
      {
        title: 'Why is password length so important?',
        text: 'Length exponentially multiplies potential combinations. While an 8-character password might take seconds to crack, a 16 or 24-character password creates an astronomically large search space that resists modern supercomputing clusters.',
      },
      {
        title: 'Why should you use a unique password for every account?',
        text: 'If one online service suffers a data breach, attackers use credential stuffing to automatically try that credential across email, banking, and social networks. Unique credentials contain and neutralize the blast radius.',
      },
      {
        title: 'What does true randomness mean?',
        text: 'Humans naturally choose predictable patterns (dates, keyboard rows, pet names). Cryptographic randomness (CSPRNG) mathematically guarantees that future characters cannot be inferred or predicted.',
      },
      {
        title: 'What is password entropy?',
        text: 'Entropy measures the degree of unpredictability in bits. A 128-bit entropy password requires an average of 2¹²⁷ brute-force attempts to guess (about 1.7 × 10³⁸). At a trillion guesses per second that is hundreds of millions of times the age of the universe.',
      },
      {
        title: 'What is a passphrase?',
        text: 'A passphrase combines several randomly chosen words separated by a delimiter. It is easier to remember and type than a random character string and, with enough words, just as hard to guess.',
      },
      {
        title: 'What is the difference between a PIN and a password?',
        text: 'PINs consist solely of digits (0-9) with a compact search space. They rely on physical device hardware rate-limiting and lockout mechanisms; on public internet services, they are inadequate on their own.',
      },
      {
        title: 'Why is a password manager essential?',
        text: 'No human can memorize dozens of 24-character random passwords. A trusted password manager stores your credentials encrypted inside a single vault, maximizing both uncompromising defense and convenience.',
      },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about how Parola Oluştur works and security.',
    items: [
      {
        q: 'Is Parola Oluştur free?',
        a: 'Yes, Parola Oluştur is 100% free with no subscriptions, accounts, or hidden paywalls.',
      },
      {
        q: 'Are generated passwords saved anywhere?',
        a: 'Never. Passwords are never stored in databases, localStorage, sessionStorage, cookies, or server logs.',
      },
      {
        q: 'Are passwords sent to any server?',
        a: 'No. All algorithms execute strictly within your local browser JavaScript engine via Web Crypto API.',
      },
      {
        q: 'How to create a truly strong password?',
        a: 'Select at least 16-24 characters, balance uppercase, lowercase, numbers, and symbols, and rely on cryptographically unbiased random generators rather than personal words.',
      },
      {
        q: 'What is password entropy?',
        a: 'Entropy is a mathematical metric in bits representing how unpredictable a password is and how many brute-force guesses would be required to exhaust its search space.',
      },
      {
        q: 'Can I generate multiple passwords at once?',
        a: 'Yes. The bulk password page generates 5 to 500 passwords with the same settings; you can copy the whole list or download it as a TXT file.',
      },
      {
        q: 'What is a passphrase?',
        a: 'A sequence of random dictionary words separated by hyphens or dots. It is easy for humans to type and remember, but mathematically intractable for computers to break.',
      },
      {
        q: 'Can I generate numeric PINs?',
        a: 'Yes, our PIN generator produces 4 to 32-digit codes with options to prohibit repeated digits and predictable sequences like 1234.',
      },
      {
        q: 'Does it work seamlessly on mobile?',
        a: 'Yes, Parola Oluştur is engineered with a mobile-first, responsive, touch-friendly UI optimized for smartphones and tablets.',
      },
      {
        q: 'Why should I use different passwords for each service?',
        a: 'To prevent credential stuffing: a leak in one compromised website will never jeopardize your other personal or business logins.',
      },
      {
        q: 'How long should a password be?',
        a: 'Modern cybersecurity standards recommend at least 16 characters for standard consumer accounts and 20-32 characters for critical administrative or financial accounts.',
      },
      {
        q: 'Do I need to create an account?',
        a: 'No account, email, or sign-up is required. You can generate unlimited passwords immediately upon opening the page.',
      },
    ],
  },
};
