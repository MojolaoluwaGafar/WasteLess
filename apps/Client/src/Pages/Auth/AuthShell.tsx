import type { ReactNode } from "react";
import { Leaf, ShieldCheck, Users } from "lucide-react";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { impactService } from "../../API/services/impactService";
import { formatKg } from "../../utils/format";

// The two-column frame around the sign-in forms: the form on one side, a
// reminder of why it matters on the other (hidden on phones).
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  const { data: stats } = useApiQuery(() => impactService.community(), [], "");

  return (
    <div className="mx-auto grid max-w-[1100px] gap-8 px-4 pt-8 md:px-8 md:pt-14 lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden rounded-[36px] bg-forest p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sprout/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sprout">WasteLess</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight">Every meal shared is one less thrown away.</h2>
        </div>
        <ul className="relative space-y-4 text-white/80">
          {stats && (
            <li className="flex items-center gap-3">
              <Leaf className="h-5 w-5 text-sprout" /> {formatKg(stats.kgSaved)} of food saved so far
            </li>
          )}
          <li className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-sprout" /> Contact details stay private until you accept
          </li>
          <li className="flex items-center gap-3">
            <Users className="h-5 w-5 text-sprout" /> Neighbours, restaurants and food banks
          </li>
        </ul>
      </aside>

      <div className="mx-auto w-full max-w-md py-4">
        <h1 className="font-serif text-4xl font-semibold text-forest">{title}</h1>
        <p className="mt-2 text-on-surface-variant">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
