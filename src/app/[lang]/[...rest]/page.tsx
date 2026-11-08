import { notFound } from 'next/navigation';

// Any path no other route matches renders the localized not-found page inside the [lang] root layout.
export default function CatchAll() {
  notFound();
}
