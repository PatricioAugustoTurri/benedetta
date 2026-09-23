import { redirect } from "next/navigation";
import { isAuthenticated, passwordIsConfigured } from "@/lib/auth";
import LoginForm from "../components/LoginForm";

export const metadata = { title: "Accedi" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ desde?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  // Con una sessione aperta questa schermata non ha niente da chiedere.
  if (await isAuthenticated()) redirect("/admin");

  const configurada = passwordIsConfigured();
  const { desde } = await searchParams;

  return (
    <section className="shell flex min-h-screen max-w-md flex-col justify-center py-24">
      <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2rem)] leading-[1.15]">
        Archivio
      </h1>

      {configurada ? (
        <>
          <p className="mt-3 text-sm text-ink-soft">
            La schermata dove si carica l&apos;opera del sito.
          </p>
          {/*
            `desde` viaggia al server per tornare alla pagina che si chiedeva.
            L'azione lo accetta solo se comincia con /admin: senza quel filtro,
            un link preparato potrebbe usare questo modulo per mandare qualcuno
            ovunque dopo l'accesso.
          */}
          <LoginForm desde={desde ?? ""} />
        </>
      ) : (
        /*
          Senza password configurata l'admin non si apre. È deliberato: un
          pannello che si apre da solo perché mancava una variabile d'ambiente
          è peggio di uno che non si apre e dice perché.
        */
        <div className="mt-6 border-l border-accent bg-paper-deep/60 py-3 pl-4">
          <p className="text-sm text-ink">Manca la configurazione della password.</p>
          <p className="prose-measure mt-2 text-xs leading-relaxed text-ink-soft">
            Metti una riga{" "}
            <code className="bg-paper px-1 py-0.5 text-ink">ADMIN_PASSWORD=…</code> nel file{" "}
            <code className="bg-paper px-1 py-0.5 text-ink">.env.local</code> della radice
            del progetto e riavvia il server. Finché non c&apos;è, l&apos;admin resta
            chiuso.
          </p>
        </div>
      )}
    </section>
  );
}
