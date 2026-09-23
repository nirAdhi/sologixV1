import React from 'react';

const projects = [
  { id: 1, category: 'Industrial', title: 'MegaTech Manufacturing Plant', location: 'Pune, Maharashtra', capacity: '500 kWp', savings: '₹45 Lakhs', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4iLxwEu-WUr5Cb4TxzrCnr3YJwlJaJZf7dHvxtUjvnXwJ6PHkIPn_MlQQmSjnnOJE5Z_MdVqT4NUBKPQ25TCioskU404xLu9n4mmyAhjsF84rrgWDhs-DGlbWX9155vWM0wfLCtQcoJZTRBTce1s3q1X9tByfk1Un9OzzVccWklRJJRXDgnQVyzOF4q1F_jo56Opk7bDINGU3r5LCvvnLvnShtI_NgAjk2AzQYbAWHy423SvrPmWq_XZTbLmD-lz2nJ_9Ifv9vXY', tag: 'Industrial' },
  { id: 2, category: 'Commercial', title: 'Apex Business Hub', location: 'Bengaluru, Karnataka', capacity: '150 kWp', savings: '₹12 Lakhs', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQa_HRntdpQDr8mf22ifPjZUaROEYrjeDNu21olD-U2oYWjbfDQKtAW2400xO0o_p6CTyRH3FM1ngFPmq0TqFl_LGFm3EU5YJwjCfjhAtIHo_XUg-Eqb7u6Bf5EHdptbtPVMQ0Hgv_mfAZQFYvIyyxxUX2FM_-dX1UEIIYJ21XNVwZdD-pgQdSAEDVTD9To2PF3hj9hyiLjcoLhENs5kofG7q_z09yuWMWOLE1pmwT4Y-m5Ci8BcdGtDvNO46KFaDkJCUaRCmROPc', tag: 'Commercial' },
  { id: 3, category: 'Residential', title: 'The Sharma Residence', location: 'Ranchi, Jharkhand', capacity: '10 kWp', savings: '₹1.2 Lakhs', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdtAkQYe7AjDRyYX8VXdnTL3JiowGbcpGeS4o3kU0jMr_x5yHc-DY6j6V-WkqrxV258bwDhHBCUGebgJxD_oOlY5cGrpiuzu8P_IXfn_2ljLNePoc_CWM1ahLgD3ARQsnMU95MRgJpDfGsFY680M_jjJl9pryt0Qij3T-5aiWIHyQJTHF_IR8A6FvrIx6XtFYzhxciBdZSY4uXvYiFdGnR9XELZVSWiG85MpN704bszoQ4X0hzeqTUGbMxSgwahbXcLk-VkTWtdRQ', tag: 'Residential' },
  { id: 4, category: 'Industrial', title: 'Green Acres Farm', location: 'Nashik, Maharashtra', capacity: '250 kWp', savings: '₹20 Lakhs', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACPt39R9JEGvahstEWrsjbaO5Nfzggu-tDsdy82m4E26_lekmEAFVcHNtl0nry9UE_3BEmDlYzWyi_FoGapOuMRagUixquFAkS1hxhz_Y45lAOe82sDRojff_4P_Zxc1yC6SVpn7vMw3T7zw0gMl9xG1siOxeTLvd9iFsioaURvxzuQrH3og0XoAJiWseq3KL4zDimBBvfgIKxfJg64HeBRTBMMNTbvcW1lTrElEZqTcuw4kEZwfXZHTlvbrNcy7I3o9xWBIrDapc', tag: 'Industrial' },
  { id: 5, category: 'Commercial', title: 'City Care Hospital', location: 'Delhi, NCR', capacity: '300 kWp', savings: '₹28 Lakhs', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyCZe0HnXRYSmqXG_qk8mqfCCwYpnD5oMCLYwo3Nt2zGbPALZ4SiqKVg9QRZYKpGvp9Iu0B9IXdZhrYfXjgzpPzFhhZ8biHYUp1XilZQTdSkYTllJceELmM3FaxjYixWVsh3h08xnQBdNZNtKNJhI_Jpy12at36iZaPUakpKFv_Va01MKnDm7_H-iO9iV96fXrhHzmgFyJ-mbff7hWF7Iel-ncQR3poJ_d4NL0oFySusxyMCboiWKcd4hZNlCuR2wYGetvQ7c5MKY', tag: 'Commercial' },
  { id: 6, category: 'Residential', title: 'Palm Grove Villas', location: 'Goa', capacity: '25 kWp', savings: '₹2.5 Lakhs', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaUdCKINPZz6MzCQFl2hI-s82N3FTZjjMKLHooTXvFJ4GM2JkE33uo9HaAkBrVMLZuaaplezuhladLhcuXnUxh1jyzq2ce8D4m3bdqVQ8kVJbiGqJH0dh5B2uAGeWGX4dntFclWDRpkZitB0gF4NJ5zjiLICnfetggzbxtSn9j9dxfkoypmQB6rwjP-rx_piPlUPPwJH2vs9Xo_2jpjz8FWsaXeZaTuVPYNQetrwATb6IBKzSs18NR0XmrUdouwB7DI7qlwpaaH2s', tag: 'Residential' },
];

const Gallery = () => {
  return (
    <div>
      <div className="pt-24 pb-24">
        <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] mb-16 text-center">
          <h1 className="text-[48px] font-bold text-[#141b2b] mb-4" style={{ fontFamily: 'Manrope' }}>Powering the Future</h1>
          <p className="text-[18px] text-[#3d4a42] max-w-2xl mx-auto" style={{ fontFamily: 'Work Sans' }}>Explore our portfolio of successful solar installations across residential, commercial, and industrial sectors. See how we deliver reliable, forward-thinking energy solutions.</p>
        </section>

        <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] mb-12 flex justify-center gap-4 flex-wrap">
          <button className="px-6 py-2 rounded-full border border-[#006948] text-[#006948] font-medium hover:bg-[#006948] hover:text-white transition-colors bg-[#00855d]/10" style={{ fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' }}>All Projects</button>
          <button className="px-6 py-2 rounded-full border border-[#E5E7EB] text-[#3d4a42] font-medium hover:border-[#006948] hover:text-[#006948] transition-colors" style={{ fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' }}>Residential</button>
          <button className="px-6 py-2 rounded-full border border-[#E5E7EB] text-[#3d4a42] font-medium hover:border-[#006948] hover:text-[#006948] transition-colors" style={{ fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' }}>Commercial</button>
          <button className="px-6 py-2 rounded-full border border-[#E5E7EB] text-[#3d4a42] font-medium hover:border-[#006948] hover:text-[#006948] transition-colors" style={{ fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' }}>Industrial</button>
        </section>

        <section className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-[#ffffff] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#E5E7EB] group">
                <div className="relative h-64 overflow-hidden">
                  <img alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={project.img} />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-[#E5E7EB]">
                    <span className="text-[14px] font-medium text-[#006948]" style={{ fontFamily: 'Work Sans' }}>{project.tag}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-[20px] font-semibold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>{project.title}</h3>
                  <div className="flex items-center gap-2 text-[#3d4a42] mb-4">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    <span className="text-[16px]" style={{ fontFamily: 'Work Sans' }}>{project.location}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4">
                    <div>
                      <span className="text-[14px] text-[#3d4a42] block uppercase tracking-wider" style={{ fontFamily: 'Work Sans', fontWeight: 500 }}>System Capacity</span>
                      <span className="text-[16px] text-[#141b2b] font-semibold" style={{ fontFamily: 'Work Sans' }}>{project.capacity}</span>
                    </div>
                    <div>
                      <span className="text-[14px] text-[#3d4a42] block uppercase tracking-wider" style={{ fontFamily: 'Work Sans', fontWeight: 500 }}>Annual Savings</span>
                      <span className="text-[16px] text-[#006948] font-semibold" style={{ fontFamily: 'Work Sans' }}>{project.savings}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Gallery;
