import React from 'react';
import { Link } from 'react-router-dom';

const Subsidies = () => (
  <div className="min-h-screen">
    <section className="bg-gradient-to-r from-[#006948] to-[#059669] py-20 text-white text-center">
      <h1 className="text-5xl font-bold mb-4">PM Surya Ghar: Muft Bijli Yojana</h1>
      <p className="text-xl text-white/80 max-w-2xl mx-auto">Government of India's flagship rooftop solar scheme — get up to 300 units of free electricity every month</p>
    </section>

    <section className="py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">

        {/* Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#006948]/10 rounded-full text-[#006948] font-medium text-sm mb-6">✅ Government Initiative</div>
            <h2 className="text-4xl font-bold mb-6">What is PM Surya Ghar Yojana?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">The PM Surya Ghar Muft Bijli Yojana is the Government of India's flagship rooftop solar scheme launched to make solar energy affordable and accessible for residential households across the country.</p>
            <p className="text-gray-600 mb-4 leading-relaxed">The scheme encourages homeowners to install rooftop solar systems and generate their own clean electricity while significantly reducing monthly electricity bills.</p>
            <p className="text-gray-600 leading-relaxed">At Sologix Energy, we help homeowners take complete advantage of this initiative by providing end-to-end support — from consultation and system design to installation, subsidy assistance, and after-sales service.</p>
          </div>
          <div className="relative">
            <img src="https://res.cloudinary.com/dsiratycd/image/upload/v1780332120/Gemini_Generated_Image_3t00r93t00r93t00_jkpvx2.png" alt="PM Surya Ghar"
              className="rounded-3xl shadow-2xl border-8 border-white w-full"
              onError={e => { e.target.src='https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop'; }} />
          </div>
        </div>

        {/* Subsidy amounts */}
        <div className="bg-[#EFF6FF] rounded-3xl p-10 mb-16">
          <h3 className="text-3xl font-bold text-center mb-10">Subsidy Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { amount:'₹30,000', label:'Subsidy for 1 kW System', icon:'☀️' },
              { amount:'₹60,000', label:'Subsidy for 2 kW System', icon:'☀️☀️' },
              { amount:'₹78,000', label:'Subsidy for 3 kW+ System', icon:'☀️☀️☀️' },
              { amount:'300 Units', label:'Free Electricity / Month', icon:'⚡' },
            ].map(({ amount, label, icon }) => (
              <div key={label} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-blue-100">
                <div className="text-4xl mb-3">{icon}</div>
                <div className="text-3xl font-bold text-[#006948] mb-2">{amount}</div>
                <p className="text-sm text-gray-600">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">*Subsidy is directly transferred to the customer's bank account after successful installation and DISCOM approval.</p>
        </div>

        {/* Key benefits */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-10">Key Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Significant reduction in monthly electricity bills',
              'Up to 300 units of free electricity benefits every month',
              'Government financial assistance through direct subsidy',
              'Clean, renewable, and environment-friendly energy',
              'Solar panels with 25+ years lifespan',
              'Low maintenance and long-term savings',
              'Net-metering facility for additional electricity savings',
              'Increased energy independence for households',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <span className="text-[#006948] text-lg flex-shrink-0">✅</span>
                <p className="text-sm text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who can apply */}
        <div className="bg-gray-50 rounded-3xl p-10 mb-16">
          <h3 className="text-3xl font-bold mb-8">Who Can Apply?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Indian residential homeowners',
              'Houses with valid electricity connections',
              'Rooftops suitable for solar panel installation',
              'Customers who have not previously availed rooftop solar subsidy for the same electricity connection',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#006948] rounded-full text-white flex items-center justify-center text-xs flex-shrink-0">✓</span>
                <p className="text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simple process */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-10">Simple Process with Sologix Energy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num:'1', title:'Free Consultation & Site Survey', desc:'Our team analyzes your electricity usage, rooftop area, and energy requirements.' },
              { num:'2', title:'System Design & Quotation', desc:'We recommend the most suitable solar solution with subsidy benefits and estimated savings.' },
              { num:'3', title:'Documentation & Portal Registration', desc:'Sologix assists with registration on the official PM Surya Ghar portal and document submission.' },
              { num:'4', title:'DISCOM Approval & Installation', desc:'After approval, our trained professionals install the solar system safely and efficiently.' },
              { num:'5', title:'Net Metering & Inspection', desc:'We coordinate net meter installation and inspection procedures with the electricity department.' },
              { num:'6', title:'Subsidy Transfer', desc:'After successful commissioning and verification, the subsidy amount is transferred directly to your bank account.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-[#006948] text-white rounded-full flex items-center justify-center font-bold mb-4">{num}</div>
                <h4 className="font-bold mb-2">{title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/booking" className="inline-block bg-[#006948] text-white px-12 py-4 rounded-full font-semibold text-lg hover:bg-green-700 transition-all shadow-xl">
            Apply Subsidy Now — It's Free!
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default Subsidies;
