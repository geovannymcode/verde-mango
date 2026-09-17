import { Leaf } from 'lucide-react'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { aboutContent, milestones, teamMembers } from '@/lib/content/about'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function AboutPage() {
  useDocumentTitle(
    'Nuestra Historia',
    'Conoce la historia, la cocina vegetal y el equipo de Verde Mango en Colombia.',
  )
  return (
    <div className="pb-20">
      <section className="about-hero relative isolate overflow-hidden bg-vm-cream px-6 py-24 text-center sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
        >
          <span className="whitespace-nowrap text-[clamp(5rem,15vw,15rem)] font-extrabold leading-none text-vm-green/10">
            {aboutContent.watermark}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 top-12 hidden text-vm-green md:block"
        >
          <Leaf size={150} strokeWidth={1} className="-rotate-45" />
          <Leaf size={100} strokeWidth={1} className="ml-8 rotate-12" />
        </div>
        <p className="font-hand text-3xl text-vm-orange">{aboutContent.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">{aboutContent.title}</h1>
        <p className="mx-auto mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-vm-muted sm:text-lg">
          {aboutContent.subtitle}
        </p>
      </section>
      <section
        aria-label="Nuestra historia en el tiempo"
        className="mx-auto max-w-6xl px-6 py-16 sm:py-20"
      >
        <p className="mb-12 text-center text-sm text-vm-muted">{aboutContent.editorialNotice}</p>
        <ol className="about-timeline grid gap-10 lg:grid-cols-4 lg:gap-0">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="relative pl-10 lg:px-5 lg:pt-10 lg:text-center">
              <span
                aria-hidden="true"
                className="timeline-dot absolute left-0 top-2 h-4 w-4 rounded-full border-2 border-vm-green bg-white lg:left-1/2 lg:top-0 lg:-translate-x-1/2"
              />
              <p className="font-hand text-3xl italic text-vm-orange">{milestone.year}</p>
              <h2 className="mt-2 text-xl font-bold">{milestone.title}</h2>
              <p className="mt-3 text-sm leading-7 text-vm-muted">{milestone.description}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mx-auto max-w-6xl px-6">
        <SectionTitle
          eyebrow={aboutContent.teamEyebrow}
          title={aboutContent.teamTitle}
          description={aboutContent.teamDescription}
          align="center"
          className="[&_h2]:text-4xl sm:[&_h2]:text-5xl [&_.font-hand]:text-3xl"
        />
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <article key={member.id} className="text-center">
              <div className="relative aspect-[4/5] overflow-hidden bg-vm-cream">
                <img
                  src={member.photo}
                  alt={member.photoAlt}
                  width={600}
                  height={750}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-4 border border-white/90"
                />
              </div>
              <h3 className="mt-5 text-xl font-bold">{member.name}</h3>
              <p className="mt-1 text-sm text-vm-muted">{member.role}</p>
              <div className="mt-4 flex justify-center gap-2">
                {member.socials.map((social) => {
                  const style =
                    'inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-vm-muted transition-colors hover:bg-vm-orange hover:text-white'
                  return social.url ? (
                    <a
                      key={social.network}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.label} de ${member.name}`}
                      className={style}
                    >
                      <svg width="16" height="16" aria-hidden="true">
                        <use href={`/icons.svg#vm-${social.network}`} />
                      </svg>
                    </a>
                  ) : (
                    <button
                      key={social.network}
                      type="button"
                      disabled
                      aria-label={`${social.label}: perfil por confirmar`}
                      title="Perfil por confirmar"
                      className={`${style} cursor-not-allowed`}
                    >
                      <svg width="16" height="16" aria-hidden="true">
                        <use href={`/icons.svg#vm-${social.network}`} />
                      </svg>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-vm-muted">Foto ilustrativa · equipo por confirmar</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
