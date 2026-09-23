import React from 'react';
import { Link } from 'react-router-dom';

const About = () => (
  <div className="min-h-screen">
    {/* Hero */}
    <section className="bg-gradient-to-r from-[#006948] to-[#059669] py-20 text-white text-center">
      <h1 className="text-5xl font-bold mb-4">About Us</h1>
      <p className="text-xl text-white/80 max-w-2xl mx-auto">Building a cleaner, greener, and energy-efficient future through innovative solar power solutions</p>
    </section>

    {/* About content */}
    <section className="py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">Who We Are</span>
            <h2 className="text-4xl font-bold mb-6">Professional Renewable Energy Solutions Company</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">At Sologix Energy, we are committed to building a cleaner, greener, and energy-efficient future through innovative solar power solutions. Founded by a team of engineering graduates from premier institutions such as <strong>IIT, NIT, and DTU</strong>, Sologix was created with a vision to make renewable energy accessible, reliable, and affordable for everyone.</p>
            <p className="text-gray-600 mb-4 leading-relaxed">With growing concerns over climate change, rising electricity costs, and increasing greenhouse gas emissions, we recognized the urgent need for sustainable energy alternatives. Our mission is to empower homes, businesses, industries, schools, and institutions with smart solar solutions.</p>
            <p className="text-gray-600 leading-relaxed">At Sologix Energy, we believe solar is more than just technology — it is an <strong>investment in a sustainable tomorrow</strong>. Together, let's power a brighter future with clean and renewable energy.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop" alt="Solar" className="rounded-2xl w-full h-48 object-cover" />
            <img src="https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=400&h=300&fit=crop" alt="Solar" className="rounded-2xl w-full h-48 object-cover mt-8" />
            <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop" alt="Solar" className="rounded-2xl w-full h-48 object-cover" />
            <img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop" alt="Solar" className="rounded-2xl w-full h-48 object-cover mt-8" />
          </div>
        </div>

        {/* What we do */}
        <div className="bg-gray-50 rounded-3xl p-10 mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center">What We Do</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon:'🏠', title:'Residential & Commercial EPC', desc:'Design, engineering, procurement and installation services for solar PV systems to residential, institutional, industrial, and commercial consumers in both CAPEX and OPEX/RESCO models.' },
              { icon:'🔧', title:'End-to-End Care', desc:'We not only integrate the system, but also care for it with the endeavour to give you the fastest possible break-even on your investment through comprehensive O&M services.' },
              { icon:'⚡', title:'Open Access Power', desc:'We help large corporate and bulk power consumers to source green power (Solar/Wind/Hybrid PPA) through Open Access power procurement mechanism.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">{icon}</div>
                <h4 className="font-bold text-lg mb-3">{title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { num:'7+', label:'Years of Experience' },
            { num:'100+', label:'Satisfied Customers' },
            { num:'50+', label:'Projects Completed' },
            { num:'300 MWh', label:'Power Generated' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center bg-[#006948] text-white rounded-2xl p-8">
              <div className="text-4xl font-bold mb-2">{num}</div>
              <div className="text-sm text-white/80">{label}</div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold mb-4">Our Team</h3>
          <p className="text-gray-600 max-w-3xl mx-auto">Our core technical team comprises Engineering graduates from IIT, NIT, and DCE with a decade of hands-on experience in the solar energy sector. What makes us different is our customer-first approach, technical expertise, and commitment to quality.</p>
        </div>

        <div className="text-center mt-10">
          <Link to="/booking" className="inline-block bg-[#006948] text-white px-10 py-4 rounded-full font-medium hover:bg-green-700 transition-all">Get a Free Consultation</Link>
        </div>
      </div>
    </section>
  </div>
);

export default About;
