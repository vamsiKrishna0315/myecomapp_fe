'use client';

import ErrorState from '../components/ErrorState/ErrorState';

export default function GlobalError({ error, reset }) {
  const showDetails = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#fffaf7',
        }}
      >
        <ErrorState
          code="500"
          title="System is down"
          message="The application is unavailable right now. We are working to restore service as quickly as possible."
          error={error}
          reset={reset}
          showDetails={showDetails}
        />
      </body>
    </html>
  );
}
