export const THEME_STORAGE_KEY = 'soft.church:theme';

const script = `(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark')d.setAttribute('data-theme','dark')}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
