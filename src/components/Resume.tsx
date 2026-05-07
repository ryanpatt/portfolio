import { useEffect } from 'react'
import {
  experience,
  education,
  languages,
  skills,
  projects,
  apps,
  integrations,
} from '../data/content'

export default function Resume() {
  useEffect(() => {
    document.title = 'Ryan Patt — Resume'
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="resume">
      <header className="resume-header">
        <h1>Ryan Patt</h1>
        <p className="resume-tagline">
          Solutions Architect · Full-Stack Engineer
        </p>
        <p className="resume-contact">
          <a href="mailto:r.patt9134@gmail.com">r.patt9134@gmail.com</a>
          <span> · </span>
          <a href="https://www.linkedin.com/in/ryan-patt-9963956b/">linkedin.com/in/ryan-patt</a>
          <span> · </span>
          <a href="https://github.com/ryanpatt">github.com/ryanpatt</a>
          <span> · </span>
          <a href="https://ryanpatt.com">ryanpatt.com</a>
        </p>
      </header>

      <section>
        <h2>Summary</h2>
        <p>
          Solutions architect specialising in enterprise integrations, headless
          commerce, and cross-platform products — from global e-commerce platforms
          to published mobile apps. 10+ years of experience leading Adobe Commerce
          implementations across US, EMEA, and Asia-Pacific markets.
        </p>
      </section>

      <section>
        <h2>Experience</h2>
        {experience.map((job, i) => (
          <div key={i} className="resume-job">
            <div className="resume-row">
              <div>
                <strong>{job.title}</strong>
                <span className="resume-company"> · {job.company}</span>
              </div>
              <div className="resume-meta">{job.period}</div>
            </div>
            <div className="resume-location">{job.location}</div>
            <ul>
              {job.highlights.map((h, j) => (
                <li key={j}>{h}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2>Skills</h2>
        <div className="resume-skills">
          {Object.entries(skills).map(([category, items]) => (
            <div key={category} className="resume-skill-row">
              <strong>{category}:</strong> {items.join(', ')}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Enterprise Integrations</h2>
        <ul className="resume-integrations">
          {integrations.map((i) => (
            <li key={i.name}>
              <strong>{i.name}</strong> — {i.description}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Selected Projects</h2>
        <ul className="resume-projects">
          {projects.map((p) => (
            <li key={p.name}>
              <strong>{p.name}</strong>
              {p.url && (
                <>
                  {' '}
                  <a href={p.url}>({p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')})</a>
                </>
              )}
              {' — '}
              {p.tagline}. <span className="resume-tech">{p.tech.join(', ')}.</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Published Apps</h2>
        <ul className="resume-projects">
          {apps.map((a) => (
            <li key={a.name}>
              <strong>{a.name}</strong>
              {a.appStoreUrl && (
                <>
                  {' '}
                  <a href={a.appStoreUrl}>(App Store)</a>
                </>
              )}
              {' — '}
              {a.description}{' '}
              <span className="resume-tech">{a.tech.join(', ')}.</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="resume-bottom-row">
        <div>
          <h2>Education</h2>
          {education.map((ed) => (
            <div key={ed.school} className="resume-edu">
              <strong>{ed.school}</strong>
              <div>{ed.degree}</div>
              <div className="resume-meta">{ed.period} · {ed.location}</div>
            </div>
          ))}
        </div>
        <div>
          <h2>Languages</h2>
          <p>{languages.join(' · ')}</p>
        </div>
      </section>
    </div>
  )
}
