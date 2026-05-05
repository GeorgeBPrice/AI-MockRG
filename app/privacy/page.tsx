import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
          <CardDescription>Last Updated: May 2026</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold mt-4">1. Overview</h2>
          <p>
            This Privacy Policy explains what information AI Mocker (&quot;we&quot;, &quot;us&quot;, the &quot;Service&quot;) collects when you use the Mock Record Generator, why we collect it, how it is processed, and the choices you have. By using the Service you consent to the practices described here. If you do not agree, please do not use the Service.
          </p>

          <h2 className="text-xl font-semibold mt-4">2. Information We Collect</h2>

          <p>
            <strong>2.1. Account information.</strong> If you sign in with GitHub or Google (NextAuth.js), we receive the basic profile fields the provider returns &mdash; typically your name, email address, avatar URL, and provider account ID. We use this only to identify your account and associate your saved schemas, generation history, and API keys with you.
          </p>

          <p>
            <strong>2.2. Schemas, examples and generation history.</strong> When you save a schema or run a generation while signed in, we store the schema text, optional examples, output format and record count, plus a timestamp and a success/error flag. These are stored in our hosted Redis database (Upstash on Vercel) so you can review them on your dashboard. We do not sell or share this data.
          </p>

          <p>
            <strong>2.3. API keys you create on AI Mocker.</strong> If you generate an AI Mocker API key (for use against <code>/api/v1/generate</code>) we store a salted PBKDF2 hash of the key &mdash; never the plaintext &mdash; along with a label, creation date, expiry date, last-used timestamp, and usage counter. Once you copy the plaintext key during creation, we cannot retrieve it again. You can revoke a key at any time from the API Keys page.
          </p>

          <p>
            <strong>2.4. Anonymous usage.</strong> You can generate records without an account. For anonymous traffic we use the request IP address (read from <code>x-forwarded-for</code> / <code>x-real-ip</code>) only as a daily-rate-limit identifier (5 generations per IP per day). The IP is not stored against any user profile and is not used for tracking, profiling, or marketing.
          </p>

          <p>
            <strong>2.5. Operational logs.</strong> We keep short-retention server logs of generation events &mdash; user or anonymous identifier, schema name, record count, output format, success/error flag, and timestamp &mdash; capped at 1000 entries (trimmed to 500). These let you see your own generation history and let us debug failures. We do not log the full prompt content of normal traffic.
          </p>

          <p>
            <strong>2.6. Cookies.</strong> NextAuth.js sets a session cookie when you sign in. We do not use third-party advertising or analytics cookies on this Service.
          </p>

          <h2 className="text-xl font-semibold mt-4">3. Third-Party AI Provider Keys (Bring-Your-Own-Key)</h2>

          <p>
            The Service can call external AI providers (OpenAI, Anthropic, Google Gemini, Cohere, Mistral, Azure OpenAI). Two key paths are supported:
          </p>

          <p>
            <strong>3.1. Server-provided key (free tier).</strong> We use a single OpenAI API key configured server-side to process requests for the free tier. Your prompt content is sent to the provider; their privacy policy applies to that data once it leaves our servers.
          </p>

          <p>
            <strong>3.2. Bring-your-own (BYO) key.</strong> If you save your own provider API key in Settings:
          </p>
          <ul className="list-disc pl-8 my-2">
            <li>The plaintext key is stored only in your browser&apos;s <code>localStorage</code>. It is <strong>not</strong> persisted in our database.</li>
            <li>The key is transmitted to our server <em>only</em> when you trigger a generation, attached to that single request, and used in-memory to authenticate the outbound call to the AI provider.</li>
            <li>We do not log the key, do not write it to any persistent store on our servers, and do not associate it with your account or your generation history.</li>
            <li>You are responsible for any usage charges that the AI provider bills against your key.</li>
            <li>Clearing your browser storage, signing out, or using the &quot;delete my data&quot; option in Settings will remove the key from <code>localStorage</code>.</li>
          </ul>

          <p>
            <strong>3.3. Why we transmit your BYO key.</strong> The AI provider&apos;s API endpoint requires authentication on the request itself, and CORS rules prevent the browser from calling many of these endpoints directly. The key must therefore travel through our server to reach the provider. We have minimised the surface area of that transmission: it occurs only during an active generation request, the key is not echoed back, and a server-side guard refuses to forward your key to any caller-chosen URL or with caller-chosen headers unless you explicitly opt-in by also supplying that override on the same request.
          </p>

          <h2 className="text-xl font-semibold mt-4">4. Prompt Content and Generated Output</h2>

          <p>
            The schema, examples, and output you generate are sent to the chosen AI provider for processing. Generated output is returned to you in the response and, for signed-in users, stored in your generation history. Prompts are not logged in full as part of normal traffic; we only retain the metadata described in section 2.5.
          </p>

          <p>
            For abuse prevention, requests that trigger our pre-flight intent checks (jailbreak phrases or clearly off-topic wording) are rejected before reaching the AI provider. We may, in future, retain short-retention copies of rejected prompts to tune the abuse filters &mdash; if and when that is implemented, this policy will be updated.
          </p>

          <h2 className="text-xl font-semibold mt-4">5. How We Use Information</h2>
          <ul className="list-disc pl-8 my-2">
            <li>Authenticate you and personalise your dashboard, saved schemas, and API keys.</li>
            <li>Process generation requests and return results to you.</li>
            <li>Enforce per-user / per-IP rate limits and concurrency caps.</li>
            <li>Detect, investigate and prevent abuse (prompt injection, off-topic abuse, quota drain).</li>
            <li>Maintain the Service, debug failures and improve reliability.</li>
          </ul>
          <p>
            We do <strong>not</strong> use your prompts, schemas, or generated output to train any machine-learning model.
          </p>

          <h2 className="text-xl font-semibold mt-4">6. Sharing and Disclosure</h2>
          <p>
            We share information only with:
          </p>
          <ul className="list-disc pl-8 my-2">
            <li><strong>AI providers</strong> you choose to use (OpenAI, Anthropic, Google, Cohere, Mistral, Azure) &mdash; their handling is governed by their own privacy policies.</li>
            <li><strong>Hosting and infrastructure providers</strong> &mdash; Vercel (hosting and edge), Upstash Redis (storage of your account data, schemas, history, and hashed API keys).</li>
            <li><strong>Authentication providers</strong> &mdash; GitHub or Google when you choose to sign in with them.</li>
            <li><strong>Legal authorities</strong> where required by law.</li>
          </ul>
          <p>
            We do not sell your information to advertisers and we do not use it for marketing.
          </p>

          <h2 className="text-xl font-semibold mt-4">7. Data Retention</h2>
          <ul className="list-disc pl-8 my-2">
            <li>Generation event logs are capped at 1000 entries and trimmed to 500.</li>
            <li>Saved schemas and per-user history persist until you delete them or delete your account.</li>
            <li>API key records persist until you revoke them or until they expire (90 days).</li>
            <li>BYO provider keys live in your browser only; we never persist them.</li>
            <li>Anonymous-use IP rate-limit counters reset daily at 00:00 UTC.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-4">8. Your Choices and Rights</h2>
          <ul className="list-disc pl-8 my-2">
            <li><strong>Delete saved data.</strong> Use the option in Settings to remove your saved schemas, history and locally-stored BYO keys.</li>
            <li><strong>Revoke API keys.</strong> Manage and revoke AI Mocker API keys from the API Keys page.</li>
            <li><strong>Request account deletion.</strong> Contact us via our GitHub repository to delete your account record.</li>
            <li><strong>Use the Service anonymously.</strong> You can generate records without signing in, subject to the daily IP rate limit.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-4">9. Security</h2>
          <p>
            We use TLS for all traffic, store AI Mocker API keys only as PBKDF2 hashes with a unique salt per key, and apply per-user / per-IP rate limits, concurrency caps and prompt-injection defences on the generation endpoints. No system is perfectly secure, however; we cannot guarantee that information transmitted over the Internet is immune to interception.
          </p>

          <h2 className="text-xl font-semibold mt-4">10. Children</h2>
          <p>
            The Service is not directed at children under 13 (or under 16 in jurisdictions that apply that threshold). We do not knowingly collect personal information from children. If you believe a child has provided us information, please contact us so we can remove it.
          </p>

          <h2 className="text-xl font-semibold mt-4">11. International Use</h2>
          <p>
            The Service is hosted on infrastructure that may store and process data in multiple regions. By using the Service you consent to your information being processed in those regions, which may have different data-protection laws than your own.
          </p>

          <h2 className="text-xl font-semibold mt-4">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &quot;Last Updated&quot; date at the top of the page reflects the most recent revision. Material changes will be highlighted on this page; your continued use of the Service after a revision constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-xl font-semibold mt-4">13. Contact</h2>
          <p>
            For privacy questions or requests, please contact us through our GitHub repository.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
