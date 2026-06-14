'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ErrorState.module.css';

export default function ErrorState({
  title = 'Service temporarily unavailable',
  code = '500',
  message = 'We are having trouble loading the site right now. The team has been notified and things should be back shortly.',
  showDetails = false,
  error,
  reset,
}) {
  const router = useRouter();

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  const handleRetry = () => {
    if (typeof reset === 'function') {
      reset();
      return;
    }

    router.refresh();
  };

  return (
    <main className={styles.shell}>
      <section className={styles.card} role="alert" aria-live="polite">
        <div>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            System status
          </div>
          <h1 className={styles.title}>
            {title}
            <br />
            <span>{code}</span>
          </h1>
          <p className={styles.description}>{message}</p>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryAction} onClick={handleRetry}>
              Try again
            </button>
            <Link href="/" className={styles.secondaryAction}>
              Go to home
            </Link>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>If the issue continues, please retry in a few minutes.</div>
            {showDetails && error?.message ? (
              <div className={styles.metaItem}>Error details: {error.message}</div>
            ) : null}
          </div>
        </div>

        <div className={styles.illustration} aria-hidden="true">
          <div className={styles.ring} />
          <div className={styles.orb} />
          <div className={styles.panel}>
            <div className={styles.panelLabel}>Connection</div>
            <div className={styles.panelValue}>Down</div>
            <div className={styles.panelText}>
              Our kitchen is still open. The service layer needs a moment to recover.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
