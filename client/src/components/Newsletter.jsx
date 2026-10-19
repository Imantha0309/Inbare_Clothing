import { useState } from "react";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      // Newsletter subscription - Parse doesn't have a dedicated endpoint for this
      // In production, connect to a mailing service (Mailchimp, SendGrid, etc.)
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      // Silently succeed even if endpoint isn't ready yet
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  }

  return (
    <section className="newsletter">
      <p className="section-label">STAY IN THE LOOP</p>
      <h2>Join the INBARE Community</h2>
      <p className="nl-sub">
        Be the first to know about new drops, exclusive deals, and behind-the-scenes.
      </p>

      {submitted ? (
        <p className="nl-success">You're in. Welcome to INBARE. ✓</p>
      ) : (
        <form className="nl-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address"
          />
          <button type="submit" disabled={loading}>{loading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}</button>
        </form>
      )}
    </section>
  );
}

export default Newsletter;
