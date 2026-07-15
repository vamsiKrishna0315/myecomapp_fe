import { redirect } from 'next/navigation';

export default function CheckoutPage({ searchParams }) {
  const query = new URLSearchParams(searchParams).toString();
  redirect(query ? `/new-checkout?${query}` : '/new-checkout');
}
