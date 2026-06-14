'use client';

import ErrorState from '../components/ErrorState/ErrorState';

export default function Error({ error, reset }) {
  const showDetails = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';

  return (
    <ErrorState
      code="500"
      title="Service temporarily unavailable"
      message="We could not complete this request just now. Please try again in a moment."
      error={error}
      reset={reset}
      showDetails={showDetails}
    />
  );
}
