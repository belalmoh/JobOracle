var content=(function(){function e(e){return e}var t=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome,n=class e{static isJobApplicationPage(){let e=window.location.href;return/greenhouse\.io\/[^/]+\/jobs\/\d+/.test(e)||/greenhouse\.io\/embed\/job_app/.test(e)}static getCompanyDetailsFromUrl(){let e=new URL(window.location.href),t=null,n=null;if(/greenhouse\.io\/embed\/job_app/.test(e.href))t=e.searchParams.get(`for`),n=e.searchParams.get(`jr_id`);else{let r=e.pathname.split(`/`);t=r[1]||null,n=r[3]||null}return{company:t,jobId:n}}static async extractFromAPI(){new URL(window.location.href);let{company:e,jobId:t}=this.getCompanyDetailsFromUrl(),n=`https://boards-api.greenhouse.io/v1/boards/${e}/jobs/${t}`;try{let e=await fetch(n);if(!e.ok)throw Error(`Network response was not ok`);let t=await e.json();return{company:this.capitalizeCompany(t.company_name),title:t.title,description:t.content,location:t.location.name,url:window.location.href,salary:t.salary?`${t.salary.currency} ${t.salary.value}`:void 0,source:`greenhouse`}}catch(e){return console.error(`Failed to fetch job details from Greenhouse API:`,e),null}}static extractFromDom(){let e=window.location.href,t=new URL(e),{company:n}=this.getCompanyDetailsFromUrl();n||=t.hostname.split(`.`)[0];let r=[`h1.app-title`,`.app-title`,`[data-testid="job-title"]`,`.posting-title`,`h1.job-title`,`h1.posting-headline`,`.job-title h1`,`h1[class*="title"]`,`.jobs-unified-top-card__job-title`,`h1`,`.posting-headline h2`,`h2.job-title`,`[data-automation-id="jobTitle"]`],i=`Unknown Position`;for(let e of r){let t=document.querySelector(e);if(t?.textContent){i=t.textContent.trim();break}}let a=[`[data-testid="job-description"]`,`.posting-description`,`#job-description`,`.app-description`,`#content .job-post-content`,`#content #gh_jid`,`.job__description`,`[class*="job-description"]`,`[class*="jobDescription"]`,`[id*="job-description"]`,`[id*="jobDescription"]`,`[class*="posting-description"]`,`article[class*="job"]`,`.job-details`,`.job-content`,`.description`],o=``;for(let e of a){let t=document.querySelector(e);if(t?.textContent){o=t.textContent.trim();break}}let s=[`.location`,`[data-testid="job-location"]`,`.posting-location`,`.job-post-location`],c=``;for(let e of s){let t=document.querySelector(e);if(t?.textContent){c=t.textContent.trim();break}}let l=[`.salary`,`[data-testid="job-salary"]`,`.posting-salary`,`.job-post-salary`,`[class*="salary"]`,`[class*="compensation"]`,`[class*="pay-range"]`,`[class*="pay_range"]`,`[data-field="salary"]`,`[data-automation-id="salary"]`],u=``;for(let e of l){let t=document.querySelector(e);if(t?.textContent){u=t.textContent.trim();break}}return{company:this.capitalizeCompany(n),title:i,description:o,location:c,url:e,salary:u,source:`greenhouse`}}static extractFromAI(){return{company:`Unknown Company`,title:`Unknown Position`,description:``,url:window.location.href,source:`greenhouse`}}static extractJobData(){return e.extractFromDom()}static capitalizeCompany(e){return e.split(`-`).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(` `)}static findApplicationForm(){for(let e of[`form#application-form`,`form[action*="/applications"]`,`[data-testid="application-form"]`,`form`]){let t=document.querySelector(e);if(t)return t}return null}},r=`joboracle-fab`,i=`joboracle-dismiss`,a=`joboracle-fab-wrapper`,o=`joboracle-popup`,s=e({matches:[`*://*.greenhouse.io/*`,`*://boards.greenhouse.io/*`,`*://job-boards.greenhouse.io/*`,`*://*.lever.co/*`,`*://jobs.lever.co/*`,`*://*.workday.com/*`,`*://*.myworkdayjobs.com/*`],main(){function e(){if(document.getElementById(`joboracle-styles`))return;let e=document.createElement(`style`);e.id=`joboracle-styles`,e.textContent=`
        #${a} {
          position: fixed;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          z-index: 2147483647;
          animation: jobOracleFabIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        #${r} {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: oklch(0.457 0.24 277.023);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px oklch(0.457 0.24 277.023 / 0.35), 0 1px 3px rgba(0,0,0,0.15);
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 13px;
          font-weight: 700;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
          position: relative;
        }
        #${r}:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px oklch(0.457 0.24 277.023 / 0.45), 0 2px 6px rgba(0,0,0,0.2);
        }
        #${r}:active {
          transform: scale(0.95);
        }
        #${r} svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        #${i} {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid white;
          background: oklch(0.552 0.016 285.938);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background 0.15s ease, transform 0.15s ease;
          line-height: 1;
          z-index: 1;
        }
        #${i}:hover {
          background: oklch(0.577 0.245 27.325);
          transform: scale(1.15);
        }
        #${i} svg {
          width: 8px;
          height: 8px;
          stroke: currentColor;
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
        }
        @keyframes jobOracleFabIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.5); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        .joboracle-wrapper-out {
          animation: jobOracleFabOut 0.2s ease both !important;
        }
        @keyframes jobOracleFabOut {
          from { opacity: 1; transform: translateY(-50%) scale(1); }
          to { opacity: 0; transform: translateY(-50%) scale(0.5); }
        }
        #${o} {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2147483646;
          width: 450px;
          height: 550px;
          border: none;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          animation: jobOraclePopupIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
        }
        #${o}-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483645;
          background: rgba(0,0,0,0.15);
          animation: jobOracleOverlayIn 0.2s ease both;
        }
        @keyframes jobOraclePopupIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.95); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        @keyframes jobOracleOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .joboracle-popup-closing {
          animation: jobOraclePopupOut 0.15s cubic-bezier(0.22,1,0.36,1) both !important;
        }
        .joboracle-overlay-closing {
          animation: jobOracleOverlayOut 0.15s ease both !important;
        }
        @keyframes jobOraclePopupOut {
          from { opacity: 1; transform: translateY(-50%) scale(1); }
          to { opacity: 0; transform: translateY(-50%) scale(0.95); }
        }
        @keyframes jobOracleOverlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `,document.head.appendChild(e)}function s(){let e=document.getElementById(a);return e?e.getBoundingClientRect().top+e.offsetHeight/2:window.innerHeight/2}function c(){if(document.getElementById(a))return;let e=document.createElement(`div`);e.id=a;let t=document.createElement(`button`);t.id=r,t.title=`Open JobOracle`,t.innerHTML=`<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l2 2 4-4"/></svg>`,t.addEventListener(`click`,u);let n=document.createElement(`button`);n.id=i,n.title=`Dismiss`,n.innerHTML=`<svg viewBox="0 0 10 10" stroke-linecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>`,n.addEventListener(`click`,e=>{e.stopPropagation(),l()}),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}function l(){let e=document.getElementById(a);e&&(e.classList.add(`joboracle-wrapper-out`),e.addEventListener(`animationend`,()=>e.remove(),{once:!0}))}function u(){if(document.getElementById(o))return;let e=document.createElement(`div`);e.id=`${o}-overlay`,e.addEventListener(`click`,d),document.body.appendChild(e);let n=s(),r=document.createElement(`iframe`);r.id=o,r.src=t.runtime.getURL(`/popup.html`),r.allow=`clipboard-write`,r.style.top=`${n}px`,r.style.right=`68px`,document.body.appendChild(r)}function d(){let e=document.getElementById(o),t=document.getElementById(`${o}-overlay`);e&&(e.classList.add(`joboracle-popup-closing`),e.addEventListener(`animationend`,()=>e.remove(),{once:!0})),t&&(t.classList.add(`joboracle-overlay-closing`),t.addEventListener(`animationend`,()=>t.remove(),{once:!0}))}function f(){let e=null,r=window.location.href;/greenhouse\.io/.test(r)&&(e=n.extractJobData()),e&&t.runtime.sendMessage({type:`JOB_DETECTED`,data:e}).catch(()=>{})}t.runtime.onMessage.addListener(e=>{e.type===`CHECK_FOR_JOB`&&f(),e.type===`CLOSE_POPUP`&&d()}),e(),c(),f()}}),c={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)},l=class e extends Event{static EVENT_NAME=u(`wxt:locationchange`);constructor(t,n){super(e.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function u(e){return`${t?.runtime?.id}:content:${e}`}var d=typeof globalThis.navigation?.addEventListener==`function`;function f(e){let t,n=!1;return{run(){n||(n=!0,t=new URL(location.href),d?globalThis.navigation.addEventListener(`navigate`,e=>{let n=new URL(e.destination.url);n.href!==t.href&&(window.dispatchEvent(new l(n,t)),t=n)},{signal:e.signal}):e.setInterval(()=>{let e=new URL(location.href);e.href!==t.href&&(window.dispatchEvent(new l(e,t)),t=e)},1e3))}}}var p=class e{static SCRIPT_STARTED_MESSAGE_TYPE=u(`wxt:content-script-started`);id;abortController;locationWatcher=f(this);constructor(e,t){this.contentScriptName=e,this.options=t,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return t.runtime?.id??this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener(`abort`,e),()=>this.signal.removeEventListener(`abort`,e)}block(){return new Promise(()=>{})}setInterval(e,t){let n=setInterval(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearInterval(n)),n}setTimeout(e,t){let n=setTimeout(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearTimeout(n)),n}requestAnimationFrame(e){let t=requestAnimationFrame((...t)=>{this.isValid&&e(...t)});return this.onInvalidated(()=>cancelAnimationFrame(t)),t}requestIdleCallback(e,t){let n=requestIdleCallback((...t)=>{this.signal.aborted||e(...t)},t);return this.onInvalidated(()=>cancelIdleCallback(n)),n}addEventListener(e,t,n,r){t===`wxt:locationchange`&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(t.startsWith(`wxt:`)?u(t):t,n,{...r,signal:this.signal})}notifyInvalidated(){this.abort(`Content script context invalidated`),c.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(e.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),window.postMessage({type:e.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},`*`)}verifyScriptStartedEvent(e){let t=e.detail?.contentScriptName===this.contentScriptName,n=e.detail?.messageId===this.id;return t&&!n}listenForNewerScripts(){let t=e=>{!(e instanceof CustomEvent)||!this.verifyScriptStartedEvent(e)||this.notifyInvalidated()};document.addEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t),this.onInvalidated(()=>document.removeEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t))}},m={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)};return(async()=>{try{let{main:e,...t}=s;return await e(new p(`content`,t))}catch(e){throw m.error(`The content script "content" crashed on startup!`,e),e}})()})();
content;