import Image from "next/image";
import { handle, posts, profileUrl } from "@/data/instagram";
import { ArrowUpRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";

/**
 * Últimas publicaciones. Va al pie del archivo, deliberadamente quieto:
 * es el canal donde ella publica hoy, no una segunda galería.
 */
export default function InstagramFeed() {
  if (posts.length === 0) return null;

  return (
    <section className="shell mt-24 md:mt-32" aria-labelledby="instagram">
      <Reveal>
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <h2 id="instagram" className="display-section font-display text-xl tracking-tight md:text-2xl">
            Instagram
          </h2>
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <span className="link-underline">{handle}</span>
            <ArrowUpRight className="shrink-0" />
          </a>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <a
                href={post.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group block overflow-hidden bg-paper-deep"
              >
                <Image
                  src={post.src}
                  alt={post.alt}
                  width={post.width}
                  height={post.height}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
