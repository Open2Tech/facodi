
import React from 'react';

const CONTRIBUTORS = [
  { name: "Open2 Technology", role: "Founding Organization", location: "Portugal", impact: "Infrastructure & Vision" },
  { name: "ISE UAlg", role: "Academic Partner", location: "Algarve", impact: "Scientific Validation" },
  { name: "FACODI Core Team", role: "Content Curation", location: "Remote", impact: "Curriculum Design" },
  { name: "Open Source Guild", role: "Development", location: "Global", impact: "Web Platform & UI" },
  { name: "Alumni Network", role: "Mentorship", location: "Hybrid", impact: "Community Support" },
];

const Contributors: React.FC = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <div className="mb-24">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">
          The<br/>Community
        </h1>
        <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">
          FACODI is built and maintained by a borderless network of developers and educators.
        </p>
      </div>

      <div className="stark-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.3em]">
              <th className="px-8 py-6">Contributor</th>
              <th className="px-8 py-6">Role</th>
              <th className="px-8 py-6 hidden md:table-cell">Location</th>
              <th className="px-8 py-6 text-right">Primary Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {CONTRIBUTORS.map((c, idx) => (
              <tr key={idx} className="hover:bg-primary transition-colors group cursor-default">
                <td className="px-8 py-8 font-black uppercase text-lg tracking-tighter">{c.name}</td>
                <td className="px-8 py-8 text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">{c.role}</td>
                <td className="px-8 py-8 text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black hidden md:table-cell">{c.location}</td>
                <td className="px-8 py-8 text-right font-bold uppercase text-xs tracking-widest">{c.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-24 bg-brand-muted p-12 lg:p-24 text-center stark-border">
        <h3 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-8 italic">Want to help shape the future?</h3>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto mb-12 uppercase text-xs tracking-[0.2em] leading-loose">
          We are always looking for curriculum experts, software engineers, and community leads to join our mission.
        </p>
        <a
          href="https://github.com/open2tech"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary hover:text-black transition-all inline-flex items-center"
        >
          Join the GitHub Organization
        </a>
      </div>

      <div className="mt-12 stark-border p-10 lg:p-12 bg-white">
        <h4 className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-500 mb-6">How To Contribute</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest">Content Submission</p>
            <p className="text-xs text-gray-600 leading-relaxed">Publish educational videos through the FACODI V2 media pipeline.</p>
            <a href="/videos/submit" className="text-[10px] font-black uppercase tracking-widest underline decoration-primary decoration-2 underline-offset-4">Submit Video</a>
          </article>
          <article className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest">Technical Collaboration</p>
            <p className="text-xs text-gray-600 leading-relaxed">Help with frontend, data integration, QA and developer experience improvements.</p>
            <a href="https://github.com/open2tech" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest underline decoration-primary decoration-2 underline-offset-4">Explore Repositories</a>
          </article>
          <article className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest">Institutional Contact</p>
            <p className="text-xs text-gray-600 leading-relaxed">Talk to the Open2 team for partnerships, curriculum mapping and strategic initiatives.</p>
            <a href="https://open2.tech/contact" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest underline decoration-primary decoration-2 underline-offset-4">Contact Open2</a>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Contributors;
