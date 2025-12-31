import{c as t,b as l,u as x,j as e}from"./index-CxPWYOC1.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=t("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=t("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]),g=({title:a="TradeZen",showBack:r=!1,actions:n=null})=>{const s=l(),o=x(i=>i.signOut),c=()=>{confirm("Are you sure you want to sign out?")&&(o(),s("/"))};return e.jsx("header",{className:"sticky top-0 bg-background border-b border-border z-30",children:e.jsxs("div",{className:"flex items-center justify-between h-16 px-4 max-w-7xl mx-auto",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[r&&e.jsx("button",{onClick:()=>s(-1),className:"p-2 hover:bg-surface rounded-lg transition-colors",children:e.jsx(d,{size:20,className:"text-text-secondary"})}),e.jsx("h1",{className:"text-xl font-bold text-text-primary",children:a})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[n,e.jsx("button",{onClick:c,className:"p-2 hover:bg-surface rounded-lg transition-colors",title:"Sign out",children:e.jsx(u,{size:20,className:"text-text-secondary"})})]})]})})};export{g as H};
