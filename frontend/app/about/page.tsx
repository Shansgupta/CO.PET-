export default function AboutPage() {
  return (
    <section className="space-y-8">
      <div className="card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-200/30 via-pink-200/20 to-sky-200/30" />
        <div className="relative z-10 py-10 text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            About Co.pet
          </h1>
          <p className="mt-3 text-lg text-slate-700">Where companionship meets care.</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Co.pet connects caring pet owners with responsible pet lovers through a trusted,
          transparent lending model. We help people experience companionship while ensuring every
          booking respects each pet&apos;s comfort, safety, and routine.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="text-xl font-bold text-slate-900">How It Works for Lenders</h3>
          <p className="mt-2 text-slate-700">
            List your pet with availability slots, preferences, and care details. Review incoming
            requests transparently and keep control by enabling, disabling, or updating your
            listing anytime.
          </p>
        </div>
        <div className="card">
          <h3 className="text-xl font-bold text-slate-900">How It Works for Borrowers</h3>
          <p className="mt-2 text-slate-700">
            Browse available pets, choose a suitable time slot, and book with clear details.
            Co.pet keeps the process simple while helping you find meaningful, responsible
            companionship.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900">Safety &amp; Trust</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          We prioritize verified users, booking transparency, and secure platform systems.
          Interactions are designed to build confidence between owners and borrowers while
          protecting pet wellbeing.
        </p>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          We believe the future of companionship is community-driven, responsible, and accessible.
          Co.pet is building a trusted pet-sharing ecosystem where owners feel supported,
          borrowers feel welcomed, and pets receive thoughtful care every step of the way.
        </p>
      </div>
    </section>
  );
}
