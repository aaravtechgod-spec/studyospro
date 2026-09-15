import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const EFFECTIVE_DATE = "25 July 2026";

interface Section {
  id: string;
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "basics",
    title: "1. The Basics 🤝",
    body: (
      <>
        <p>You gotta be 13+ to use this. If you're under 18, get a parent's thumbs up.</p>
        <p>
          By creating an account you confirm you meet this age requirement and that the details you
          give us are accurate. One account per person, please — don't share your login.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "2. AI is Smart, But Not Perfect 🧠",
    body: (
      <>
        <p>
          This AI is your study buddy, not a replacement for your brain. It might hallucinate or get
          things wrong. Always fact-check before turning in assignments! We aren't responsible for
          bad grades.
        </p>
        <p>
          AI-generated summaries, flashcards, quizzes and explanations are study aids only. They are
          not exam guidance, medical, legal, or financial advice.
        </p>
      </>
    ),
  },
  {
    id: "fair-use",
    title: "3. Play Fair (Acceptable Use) 🛑",
    body: (
      <ul>
        <li><strong>No cheating:</strong> Don't use this to plagiarize.</li>
        <li><strong>No spamming:</strong> Don't try to break the code, reverse-engineer, or spam our APIs.</li>
        <li><strong>Keep it legal:</strong> Only upload files you actually own or have the right to use.</li>
        <li><strong>No harmful content:</strong> No harassment, hate, sexual content involving minors, or anything illegal.</li>
        <li><strong>No resale:</strong> Don't resell, rebrand, or run a competing service off our AI credits.</li>
        <li><strong>No automation abuse:</strong> No bots, scrapers, or bulk automated requests.</li>
      </ul>
    ),
  },
  {
    id: "privacy",
    title: "4. The Tea on Your Data (Privacy) 🔒",
    body: (
      <>
        <ul>
          <li>
            <strong>What we collect:</strong> We process your chats and uploaded files strictly to
            make the app work and give you accurate answers.
          </li>
          <li>
            <strong>APIs:</strong> We route your prompts through secure third-party APIs to generate
            responses. We don't sell your personal info to randoms.
          </li>
          <li>
            <strong>Your stuff stays yours:</strong> Your notes, decks, and uploads belong to you. We
            don't claim ownership of anything you create.
          </li>
          <li>
            <strong>Storage:</strong> Your data is stored securely and is only readable by your own
            account.
          </li>
          <li>
            <strong>Deletion:</strong> You can delete your notes, decks and files at any time. Ask us
            to delete your whole account and we'll wipe it.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "liability",
    title: "5. Cover Our Backs (Liability) 🛡️",
    body: (
      <>
        <p>
          This app is provided "as-is." If the app glitches, you lose a file, or the server goes
          down, we aren't legally liable.
        </p>
        <p>
          We don't promise the service will always be available, bug-free, or that AI answers will be
          accurate. Keep your own backups of anything important.
        </p>
      </>
    ),
  },
  {
    id: "bans",
    title: "6. Account Bans 🔨",
    body: (
      <p>
        If you break these rules, we can delete your account and revoke your access without warning.
        Where it's reasonable, we'll give you a heads-up first — but for serious violations we won't.
      </p>
    ),
  },
  {
    id: "changes",
    title: "7. Changes to These Terms 📝",
    body: (
      <p>
        We may update these terms as the app grows. If something material changes, we'll show a
        notice in the app. Continuing to use StudyOS after an update means you accept the new terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "8. Contact 📮",
    body: (
      <p>
        Questions, data requests, or account deletion? Reach out through the in-app AI Coach or your
        account settings and we'll get back to you.
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-10 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="label-mono">Legal</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective {EFFECTIVE_DATE} · StudyOS Pro
          </p>
          <p className="text-sm text-foreground/80 mt-4 leading-relaxed">
            Here's the deal, in plain English. StudyOS is a study tool with AI built in. These terms
            explain what you can expect from us, what we expect from you, and what happens with your
            data. Read them once — they're short.
          </p>
        </header>

        <nav aria-label="Table of contents" className="surface p-4 mb-8">
          <div className="label-mono mb-2">On this page</div>
          <ol className="space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="surface p-5 scroll-mt-6">
              <h2 className="font-display text-lg font-extrabold mb-3">{s.title}</h2>
              <div className="text-sm text-foreground/80 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-foreground">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
          By using StudyOS you agree to these terms. Last updated {EFFECTIVE_DATE}.
        </footer>
      </div>
    </div>
  );
}
