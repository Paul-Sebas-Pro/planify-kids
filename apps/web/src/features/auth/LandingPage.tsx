import { Link, Navigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";

const features = [
  {
    icon: "📅",
    bg: "bg-primary/10",
    title: "Planning visuel",
    description:
      "Créez le planning de la semaine en quelques clics. Assignez chaque tâche à un enfant avec durée et points à gagner.",
  },
  {
    icon: "🏆",
    bg: "bg-accent/10",
    title: "Gamification",
    description:
      "Points, badges et récompenses personnalisées transforment les tâches du quotidien en défis excitants pour les enfants.",
  },
  {
    icon: "📊",
    bg: "bg-secondary/10",
    title: "Rapport hebdomadaire",
    description:
      "Suivez les progrès de chaque enfant semaine par semaine : tâches complétées, points gagnés, badges débloqués.",
  },
];

const previewChildren = [
  { name: "Emma", color: "#FF9800", pts: "320" },
  { name: "Léo", color: "#2196F3", pts: "285" },
  { name: "Tom", color: "#9C27B0", pts: "195" },
];

const previewTasks = [
  { emoji: "🛏", label: "Faire son lit", done: true },
  { emoji: "🍽", label: "Débarrasser la table", done: true },
  { emoji: "📚", label: "Réviser les maths", done: false, late: false },
  { emoji: "🗑", label: "Sortir la poubelle", done: false, late: true },
];

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-12 h-[72px] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
          <span className="font-title text-2xl font-bold text-gray-900">
            Planify Kids
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="font-body text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Fonctionnalités
          </a>
          <a
            href="#cta"
            className="font-body text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Comment ça marche
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="font-body text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Se connecter
          </Link>
          <Link
            to="/register"
            className="font-body text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-button hover:bg-primary/90 transition-colors"
          >
            Créer un compte
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex items-center gap-16 px-[120px] py-20 w-full max-w-[1440px] mx-auto">
        <div className="flex-1 flex flex-col gap-7 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 w-fit">
            <span className="font-body text-sm font-bold text-primary">
              ✨ 2 000+ familles organisées
            </span>
          </div>
          <h1 className="font-title text-6xl font-bold text-gray-900 leading-[1.1]">
            Planifiez.
            <br />
            Motivez.
            <br />
            Récompensez.
          </h1>
          <p className="font-body text-lg text-gray-500 leading-relaxed max-w-lg">
            L'agenda familial gamifié qui transforme les corvées quotidiennes en
            aventures pour vos enfants.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="font-body text-base font-bold bg-primary text-white px-7 py-3.5 rounded-button shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              Créer un compte gratuit
            </Link>
            <Link
              to="/login"
              className="font-body text-base font-semibold text-primary border-2 border-primary px-7 py-3.5 rounded-button hover:bg-primary/5 transition-colors"
            >
              Se connecter →
            </Link>
          </div>
          <p className="font-body text-sm text-gray-400">
            ✓ Gratuit pour démarrer &nbsp;·&nbsp; ✓ Sans carte bancaire
            &nbsp;·&nbsp; ✓ 2 min pour commencer
          </p>
        </div>

        {/* App preview */}
        <div className="w-[460px] bg-white rounded-[24px] shadow-2xl p-5 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-title text-xl font-bold text-gray-900">
              Planning
            </span>
            <span className="font-body text-xs font-semibold text-gray-500 bg-background px-3 py-1 rounded-xl">
              23 – 29 juin
            </span>
          </div>
          <div className="flex gap-4">
            {previewChildren.map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-1">
                <div
                  className="w-11 h-11 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="font-body text-xs text-gray-500">
                  {c.name}
                </span>
                <span className="font-score text-xs font-bold text-accent">
                  {c.pts} pts
                </span>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex flex-col gap-2">
            {previewTasks.map((t) => (
              <div
                key={t.label}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${
                  t.done
                    ? "bg-primary/10"
                    : t.late
                      ? "bg-danger/10"
                      : "bg-white border border-gray-100"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded shrink-0 ${
                    t.done
                      ? "bg-primary"
                      : t.late
                        ? "bg-danger"
                        : "bg-gray-200"
                  }`}
                />
                <span className="font-body text-sm text-gray-800">
                  {t.emoji} {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-[72px]">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-col gap-12">
          <div className="text-center flex flex-col gap-3">
            <h2 className="font-title text-4xl font-bold text-gray-900">
              Pourquoi les familles adorent Planify Kids ?
            </h2>
            <p className="font-body text-base text-gray-500">
              Un outil pensé pour motiver les enfants et simplifier la vie des
              parents.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-card p-7 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${f.bg}`}
                >
                  {f.icon}
                </div>
                <h3 className="font-title text-xl font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bg-primary py-20">
        <div className="max-w-[1200px] mx-auto px-8 text-center flex flex-col items-center gap-7">
          <h2 className="font-title text-5xl font-bold text-white">
            Prêt à transformer les corvées en aventures ?
          </h2>
          <p className="font-body text-lg text-white/70">
            Rejoignez 2 000+ familles. Gratuit pour commencer, sans carte
            bancaire.
          </p>
          <Link
            to="/register"
            className="font-body text-lg font-bold bg-white text-primary px-10 py-4 rounded-button shadow-lg hover:shadow-xl transition-shadow"
          >
            Commencer gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
}
