import Link from "next/link";

import { STORE_NAME } from "@/lib/constants";
import { getCategories } from "@/lib/queries/catalog";

// Iconos de marca en SVG (lucide-react ya no incluye logos por marca registrada).
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function TiktokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" {...props}>
      <path d="M16.5 3h-2.9v12.4a2.6 2.6 0 1 1-2.6-2.6c.2 0 .5 0 .7.1V9.9a5.6 5.6 0 1 0 4.8 5.5V8.7a6.8 6.8 0 0 0 3.8 1.2V7a3.9 3.9 0 0 1-1.8-.5A3.9 3.9 0 0 1 16.5 3z" />
    </svg>
  );
}

export async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <span className="text-lg font-bold">{STORE_NAME}</span>
          <p className="text-sm text-muted-foreground">
            {/* Placeholder de copy de marca: edítalo cuando quieras. */}
            Ropa urbana de marca propia. Diseñada para la calle.
          </p>
          <div className="flex gap-3 pt-1 text-muted-foreground">
            <a href="#" aria-label="Instagram" className="hover:text-foreground">
              <InstagramIcon />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-foreground">
              <YoutubeIcon />
            </a>
            <a href="#" aria-label="TikTok" className="hover:text-foreground">
              <TiktokIcon />
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Tienda</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/tienda/${c.slug}`}
                  className="hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Información</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/envios" className="hover:text-foreground">
                Política de envíos
              </Link>
            </li>
            <li>
              <Link href="/devoluciones" className="hover:text-foreground">
                Devoluciones
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-foreground">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Contacto</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {/* Placeholders de contacto: sustitúyelos por los tuyos. */}
            <li>hola@gtshop.example</li>
            <li>+34 600 000 000</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {STORE_NAME}. Todos los derechos
        reservados.
      </div>
    </footer>
  );
}
