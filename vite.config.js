import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // यह पाथ को 'Relative' बना देगा, जिससे फाइल्स सबडोमेन फोल्डर के अंदर मिलेंगी
  plugins: [react()]
})