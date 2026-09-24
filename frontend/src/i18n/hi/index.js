// Merges every Hindi dictionary file. Add a new area by dropping a JSON file
// here and adding it to the list below.
import common from './common.json';
import home from './home.json';
import products from './products.json';
import booking from './booking.json';
import portal from './portal.json';
import pages1 from './pages1.json';
import pages2 from './pages2.json';

const HI = { ...common, ...home, ...products, ...booking, ...portal, ...pages1, ...pages2 };
export default HI;
