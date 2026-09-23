// Branding constants for consistent application-wide styling

export const BRANDING = {
  // Company Name
  name: 'Sologix Energy',
  shortName: 'Sologix',
  tagline: 'Energizing Naturally',
  missionTagline: 'We are on a mission to make this planet a better place to live and we are committed to make clean energy available to all which is, Renewable, Reliable, and Affordable.',

  // Website
  website: 'https://www.sologixenergy.in',
  email: 'info@sologixenergy.in',
  emailAlt: 'amit@sologixenergy.in',
  phone: '+91 8287766474',
  phoneAlt: '+91 9031018640',
  address: 'STPI Building, Plot-8, Namkum Industrial Area, Ranchi, Jharkhand - 834010',

  // Logo URL
  logoUrl: 'https://res.cloudinary.com/dsiratycd/image/upload/logo_yo5zg9.png',
  
  // Colors - matches tailwind.config.js
  colors: {
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    accent: {
      orange: '#f97316',
      yellow: '#fbbf24',
    }
  },
  
  // API URL - use relative path for same-domain deployment
  apiUrl: process.env.REACT_APP_API_URL || '/api',
  
  // Social Media
  social: {
    facebook: 'https://www.facebook.com/sologix/',
    linkedin: 'https://www.linkedin.com/company/m-s-sologix-energy/',
  }
};

// Helper functions for consistent styling
export const getBrandColor = (shade = 600) => BRANDING.colors.primary[shade];
export const getSecondaryColor = (shade = 600) => BRANDING.colors.secondary[shade];

export default BRANDING;
