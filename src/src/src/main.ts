import './style.css'
import { boot } from './app'

boot().catch((err) => {
  console.error('[bakery-films] boot failed', err)
  const loader = document.getElementById('loader')
  if (loader) loader.classList.add('done')
  const html = document.documentElement
  html.classList.add('motion')
})
