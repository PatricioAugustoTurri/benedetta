import { redirect } from "next/navigation";
import { isAuthenticated, passwordIsConfigured } from "@/lib/auth";
import LoginForm from "../components/LoginForm";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ desde?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  // Con sesión abierta esta pantalla no tiene nada que preguntar.
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
            La pantalla donde se carga la obra del sitio.
          </p>
          {/*
            `desde` viaja al servidor para volver a la página que se pedía.
            La acción sólo lo acepta si empieza con /admin: sin ese filtro,
            un link preparado podría usar este formulario para mandar a
            alguien a cualquier lado después de entrar.
          */}
          <LoginForm desde={desde ?? ""} />
        </>
      ) : (
        /*
          Sin clave configurada el admin no se abre. Es deliberado: un panel
          que se abre solo porque faltaba una variable de entorno es peor que
          uno que no se abre y dice por qué.
        */
        <div className="mt-6 border-l border-accent bg-paper-deep/60 py-3 pl-4">
          <p className="text-sm text-ink">Falta configurar la clave.</p>
          <p className="prose-measure mt-2 text-xs leading-relaxed text-ink-soft">
            Poné una línea{" "}
            <code className="bg-paper px-1 py-0.5 text-ink">ADMIN_PASSWORD=…</code> en el
            archivo <code className="bg-paper px-1 py-0.5 text-ink">.env.local</code> de la
            raíz del proyecto y reiniciá el servidor. Mientras no esté, el admin queda
            cerrado.
          </p>
        </div>
      )}
    </section>
  );
}
