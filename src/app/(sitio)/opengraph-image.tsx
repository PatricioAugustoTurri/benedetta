import { ImageResponse } from "next/og";
import { site } from "@/data/site";

/**
 * L'anteprima che esce quando si condivide un link del sito —WhatsApp,
 * Instagram, iMessage— per ogni pagina pubblica che non ne genera una
 * propria. Solo `opera/[slug]` la genera propria, dalla copertina
 * dell'opera: qui sotto è il fondo per home, `/studio` e `/contatti`, che
 * altrimenti condividerebbero un link senza nessuna immagine.
 *
 * Niente font da caricare: usa il font che porta di serie `next/og`, non
 * Caprasimo né Geist. Farlo con i font veri del sito vorrebbe dire scaricarli
 * in fase di build (Caprasimo viene da Google Fonts) o leggere il woff2 di
 * Geist, che `next/og` non legge. Il colore e la gerarchia restano quelli del
 * sito; il carattere no.
 */
export const alt = `${site.name} · ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "96px",
          backgroundColor: "#faf7f2",
        }}
      >
        <div
          style={{
            width: 64,
            height: 8,
            backgroundColor: "#b4552f",
            marginBottom: 40,
          }}
        />
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: "#1c1a16",
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 40,
            fontWeight: 400,
            color: "#55504a",
          }}
        >
          {site.role}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 30,
            fontWeight: 400,
            color: "#6f6861",
          }}
        >
          {site.tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
