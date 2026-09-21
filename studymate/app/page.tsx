import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, FileCheck2, MessageSquareText, Trophy } from "lucide-react";

const flowSteps = [
  {
    icon: BookOpen,
    badge: "/studymate-assets/badge-beginner.png",
    title: "Upload notes",
    text: "Drop course material or use the judge demo pack.",
  },
  {
    icon: MessageSquareText,
    badge: "/studymate-assets/badge-apprentice.png",
    title: "Learn as a story",
    text: "Matey turns the topic into a guided role-play.",
  },
  {
    icon: Trophy,
    badge: "/studymate-assets/icon-xp-star.png",
    title: "Earn XP",
    text: "Answer, improve, and see progress instantly.",
  },
  {
    icon: FileCheck2,
    badge: "/studymate-assets/badge-master.png",
    title: "Unlock PDF",
    text: "Leave with an exam-ready revision answer.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf4e5] text-[#13231f]">
      <section className="relative min-h-[92vh] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            StudyMate
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#13231f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[#244239]"
          >
            Try
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 pt-16 lg:grid-cols-[1fr_0.95fr] lg:pt-20">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#0f7a5f] shadow-sm">
              Judge-ready demo
            </p>
            <h1 className="mt-6 max-w-4xl text-6xl font-black leading-[0.9] tracking-normal text-[#13231f] sm:text-7xl lg:text-8xl">
              StudyMate
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-bold leading-9 text-[#29463f] sm:text-2xl">
              Upload boring school material, learn it with Matey, practice exam questions, earn XP, and unlock a revision PDF.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f06f45] px-8 py-5 text-lg font-black text-white shadow-xl shadow-[#c95b38]/25 transition hover:-translate-y-1 hover:bg-[#df5f36]"
              >
                Try it
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="max-w-xs text-sm font-bold leading-6 text-[#5d726b]">
                One button. One demo path. No dashboard detours.
              </p>
            </div>
          </div>

          <div className="relative min-h-[480px] lg:min-h-[620px]" aria-label="Animated StudyMate reward preview">
            <div className="animate-drift-slow absolute left-0 top-10 w-[86%] max-w-[620px] rotate-[-4deg] sm:left-2 lg:left-0">
              <Image
                src="/studymate-assets/reward-certificate.png"
                alt="StudyMate certificate of achievement from Matey"
                width={1360}
                height={909}
                priority
                className="w-full object-contain drop-shadow-2xl"
              />
            </div>

            <Image
              src="/studymate-assets/matey/matey-celebrate.png"
              alt="Matey celebrating a completed study session"
              width={560}
              height={620}
              priority
              className="matey-float absolute bottom-0 right-0 w-[56%] max-w-[360px] object-contain drop-shadow-2xl"
            />

            <Image
              src="/studymate-assets/badge-apprentice.png"
              alt=""
              width={220}
              height={220}
              className="xp-pop absolute right-28 top-2 h-20 w-20 rotate-6 object-contain drop-shadow-xl sm:right-36"
            />

            <Image
              src="/studymate-assets/icon-xp-star.png"
              alt=""
              width={180}
              height={180}
              className="animate-drift absolute left-0 bottom-36 h-16 w-16 rotate-[-10deg] object-contain drop-shadow-xl sm:left-8"
            />

            <div className="xp-pop absolute right-4 top-20 rounded-2xl bg-[#13231f] px-5 py-4 text-white shadow-xl shadow-emerald-950/20">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#91f0cd]">XP earned</p>
              <p className="mt-1 text-3xl font-black">200</p>
            </div>

            <div className="animate-drift absolute bottom-16 left-2 rounded-2xl bg-white px-5 py-4 shadow-xl shadow-[#765f2f]/15 sm:left-12">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f06f45]">Story Mode</p>
              <p className="mt-1 text-sm font-black text-[#13231f]">Answer as the lawyer</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-8 px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-3 rounded-[24px] border border-[#e8dcc1] bg-white/85 p-3 shadow-xl shadow-[#765f2f]/10 sm:grid-cols-2 lg:grid-cols-4">
          {flowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-[18px] bg-[#f8f0dd] p-5">
                <div className="flex items-center gap-3">
                  <Image src={step.badge} alt="" width={72} height={72} className="h-14 w-14 object-contain" />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#13231f] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-black text-[#13231f]">{step.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d726b]">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
