import{c as t,r as m,j as e,X as i}from"./index-1b_qrI34.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=t("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=t("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z",key:"1lpok0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=t("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]),k=({isOpen:s,onClose:r,title:a,children:c,showCloseButton:l=!0,size:o="md"})=>{if(m.useEffect(()=>(s?document.body.style.overflow="hidden":document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[s]),!s)return null;const n=d=>{d.target===d.currentTarget&&r()},x={sm:"max-w-md",md:"max-w-2xl",lg:"max-w-4xl",full:"max-w-6xl"};return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"modal-backdrop animate-fade-in",onClick:n}),e.jsxs("div",{className:`modal-content ${x[o]} w-full`,children:[(a||l)&&e.jsxs("div",{className:"flex items-center justify-between p-6 border-b border-border",children:[a&&e.jsx("h2",{className:"text-xl font-semibold text-text-primary",children:a}),l&&e.jsx("button",{onClick:r,className:"p-2 hover:bg-surface-hover rounded-lg transition-colors",children:e.jsx(i,{size:20,className:"text-text-secondary"})})]}),e.jsx("div",{className:"p-6",children:c})]})]})};export{k as M,h as P,y as S,f as T};
