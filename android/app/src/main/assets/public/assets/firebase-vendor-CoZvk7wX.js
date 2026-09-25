var Sp=Object.defineProperty;var Op=(r,e,t)=>e in r?Sp(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var G=(r,e,t)=>Op(r,typeof e!="symbol"?e+"":e,t);/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Np=()=>{};var Uc={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hh=function(r){const e=[];let t=0;for(let n=0;n<r.length;n++){let s=r.charCodeAt(n);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(s=65536+((s&1023)<<10)+(r.charCodeAt(++n)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},Fp=function(r){const e=[];let t=0,n=0;for(;t<r.length;){const s=r[t++];if(s<128)e[n++]=String.fromCharCode(s);else if(s>191&&s<224){const i=r[t++];e[n++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){const i=r[t++],o=r[t++],B=r[t++],u=((s&7)<<18|(i&63)<<12|(o&63)<<6|B&63)-65536;e[n++]=String.fromCharCode(55296+(u>>10)),e[n++]=String.fromCharCode(56320+(u&1023))}else{const i=r[t++],o=r[t++];e[n++]=String.fromCharCode((s&15)<<12|(i&63)<<6|o&63)}}return e.join("")},Jh={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let s=0;s<r.length;s+=3){const i=r[s],o=s+1<r.length,B=o?r[s+1]:0,u=s+2<r.length,c=u?r[s+2]:0,h=i>>2,f=(i&3)<<4|B>>4;let p=(B&15)<<2|c>>6,w=c&63;u||(w=64,o||(p=64)),n.push(t[h],t[f],t[p],t[w])}return n.join("")},encodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(r):this.encodeByteArray(Hh(r),e)},decodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(r):Fp(this.decodeStringToByteArray(r,e))},decodeStringToByteArray(r,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let s=0;s<r.length;){const i=t[r.charAt(s++)],B=s<r.length?t[r.charAt(s)]:0;++s;const c=s<r.length?t[r.charAt(s)]:64;++s;const f=s<r.length?t[r.charAt(s)]:64;if(++s,i==null||B==null||c==null||f==null)throw new Lp;const p=i<<2|B>>4;if(n.push(p),c!==64){const w=B<<4&240|c>>2;if(n.push(w),f!==64){const R=c<<6&192|f;n.push(R)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}};class Lp extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const kp=function(r){const e=Hh(r);return Jh.encodeByteArray(e,!0)},Bo=function(r){return kp(r).replace(/\./g,"")},jh=function(r){try{return Jh.decodeString(r,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vp(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xp=()=>Vp().__FIREBASE_DEFAULTS__,Mp=()=>{if(typeof process>"u"||typeof Uc>"u")return;const r=Uc.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},Gp=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=r&&jh(r[1]);return e&&JSON.parse(e)},So=()=>{try{return Np()||xp()||Mp()||Gp()}catch(r){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${r}`);return}},qh=r=>{var e,t;return(t=(e=So())==null?void 0:e.emulatorHosts)==null?void 0:t[r]},Kh=r=>{const e=qh(r);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const n=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),n]:[e.substring(0,t),n]},zh=()=>{var r;return(r=So())==null?void 0:r.config},Qh=r=>{var e;return(e=So())==null?void 0:e[`_${r}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Up{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wh(r,e){if(r.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},n=e||"demo-project",s=r.iat||0,i=r.sub||r.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${n}`,aud:n,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...r};return[Bo(JSON.stringify(t)),Bo(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $e(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Hp(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test($e())}function Jp(){var e;const r=(e=So())==null?void 0:e.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function jp(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function qp(){const r=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof r=="object"&&r.id!==void 0}function Kp(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function zp(){const r=$e();return r.indexOf("MSIE ")>=0||r.indexOf("Trident/")>=0}function Qp(){return!Jp()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Wp(){try{return typeof indexedDB=="object"}catch{return!1}}function $p(){return new Promise((r,e)=>{try{let t=!0;const n="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(n);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(n),r(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yp="FirebaseError";class zt extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=Yp,Object.setPrototypeOf(this,zt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ti.prototype.create)}}class ti{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],o=i?Xp(i,n):"Error",B=`${this.serviceName}: ${o} (${s}).`;return new zt(s,B,n)}}function Xp(r,e){try{let t=0,n="";for(;t<r.length;){const s=r.indexOf("{$",t);if(s===-1){n+=r.substring(t);break}const i=r.indexOf("}",s+2);if(i===-1){n+=r.substring(t);break}const o=r.substring(s+2,i),B=e[o];n+=r.substring(t,s)+(B!=null?String(B):`<${o}?>`),t=i+1}return n}catch{return r}}function Zp(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function Sn(r,e){if(r===e)return!0;const t=Object.keys(r),n=Object.keys(e);for(const s of t){if(!n.includes(s))return!1;const i=r[s],o=e[s];if(Hc(i)&&Hc(o)){if(!Sn(i,o))return!1}else if(i!==o)return!1}for(const s of n)if(!t.includes(s))return!1;return!0}function Hc(r){return r!==null&&typeof r=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ni(r){const e=[];for(const[t,n]of Object.entries(r))Array.isArray(n)?n.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function eg(r,e){const t=new tg(r,e);return t.subscribe.bind(t)}class tg{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let s;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");ng(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:n},s.next===void 0&&(s.next=Sa),s.error===void 0&&(s.error=Sa),s.complete===void 0&&(s.complete=Sa);const i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(n){typeof console<"u"&&console.error&&console.error(n)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function ng(r,e){if(typeof r!="object"||r===null)return!1;for(const t of e)if(t in r&&typeof r[t]=="function")return!0;return!1}function Sa(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ye(r){return r&&r._delegate?r._delegate:r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jn(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Oo(r){return(await fetch(r,{credentials:"include"})).ok}class On{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zn="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rg{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new Up;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&n.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),n=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(n)return null;throw s}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(ig(e))try{this.getOrInitializeService({instanceIdentifier:Zn})}catch{}for(const[t,n]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const i=this.getOrInitializeService({instanceIdentifier:s});n.resolve(i)}catch{}}}}clearInstance(e=Zn){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=Zn){return this.instances.has(e)}getOptions(e=Zn){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[i,o]of this.instancesDeferred.entries()){const B=this.normalizeInstanceIdentifier(i);n===B&&o.resolve(s)}return s}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(n)??new Set;s.add(e),this.onInitCallbacks.set(n,s);const i=this.instances.get(n);return i&&e(i,n),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const s of n)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:sg(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=Zn){return this.component?this.component.multipleInstances?e:Zn:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function sg(r){return r===Zn?void 0:r}function ig(r){return r.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class og{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new rg(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ae;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(ae||(ae={}));const ag={debug:ae.DEBUG,verbose:ae.VERBOSE,info:ae.INFO,warn:ae.WARN,error:ae.ERROR,silent:ae.SILENT},Bg=ae.INFO,ug={[ae.DEBUG]:"log",[ae.VERBOSE]:"log",[ae.INFO]:"info",[ae.WARN]:"warn",[ae.ERROR]:"error"},cg=(r,e,...t)=>{if(e<r.logLevel)return;const n=new Date().toISOString(),s=ug[e];if(s)console[s](`[${n}]  ${r.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class TB{constructor(e){this.name=e,this._logLevel=Bg,this._logHandler=cg,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in ae))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?ag[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,ae.DEBUG,...e),this._logHandler(this,ae.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,ae.VERBOSE,...e),this._logHandler(this,ae.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,ae.INFO,...e),this._logHandler(this,ae.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,ae.WARN,...e),this._logHandler(this,ae.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,ae.ERROR,...e),this._logHandler(this,ae.ERROR,...e)}}const lg=(r,e)=>e.some(t=>r instanceof t);let Jc,jc;function hg(){return Jc||(Jc=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Cg(){return jc||(jc=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const $h=new WeakMap,Xa=new WeakMap,Yh=new WeakMap,Oa=new WeakMap,AB=new WeakMap;function fg(r){const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("success",i),r.removeEventListener("error",o)},i=()=>{t(An(r.result)),s()},o=()=>{n(r.error),s()};r.addEventListener("success",i),r.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&$h.set(t,r)}).catch(()=>{}),AB.set(e,r),e}function dg(r){if(Xa.has(r))return;const e=new Promise((t,n)=>{const s=()=>{r.removeEventListener("complete",i),r.removeEventListener("error",o),r.removeEventListener("abort",o)},i=()=>{t(),s()},o=()=>{n(r.error||new DOMException("AbortError","AbortError")),s()};r.addEventListener("complete",i),r.addEventListener("error",o),r.addEventListener("abort",o)});Xa.set(r,e)}let Za={get(r,e,t){if(r instanceof IDBTransaction){if(e==="done")return Xa.get(r);if(e==="objectStoreNames")return r.objectStoreNames||Yh.get(r);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return An(r[e])},set(r,e,t){return r[e]=t,!0},has(r,e){return r instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in r}};function pg(r){Za=r(Za)}function gg(r){return r===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const n=r.call(Na(this),e,...t);return Yh.set(n,e.sort?e.sort():[e]),An(n)}:Cg().includes(r)?function(...e){return r.apply(Na(this),e),An($h.get(this))}:function(...e){return An(r.apply(Na(this),e))}}function mg(r){return typeof r=="function"?gg(r):(r instanceof IDBTransaction&&dg(r),lg(r,hg())?new Proxy(r,Za):r)}function An(r){if(r instanceof IDBRequest)return fg(r);if(Oa.has(r))return Oa.get(r);const e=mg(r);return e!==r&&(Oa.set(r,e),AB.set(e,r)),e}const Na=r=>AB.get(r);function Eg(r,e,{blocked:t,upgrade:n,blocking:s,terminated:i}={}){const o=indexedDB.open(r,e),B=An(o);return n&&o.addEventListener("upgradeneeded",u=>{n(An(o.result),u.oldVersion,u.newVersion,An(o.transaction),u)}),t&&o.addEventListener("blocked",u=>t(u.oldVersion,u.newVersion,u)),B.then(u=>{i&&u.addEventListener("close",()=>i()),s&&u.addEventListener("versionchange",c=>s(c.oldVersion,c.newVersion,c))}).catch(()=>{}),B}const _g=["get","getKey","getAll","getAllKeys","count"],Dg=["put","add","delete","clear"],Fa=new Map;function qc(r,e){if(!(r instanceof IDBDatabase&&!(e in r)&&typeof e=="string"))return;if(Fa.get(e))return Fa.get(e);const t=e.replace(/FromIndex$/,""),n=e!==t,s=Dg.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(s||_g.includes(t)))return;const i=async function(o,...B){const u=this.transaction(o,s?"readwrite":"readonly");let c=u.store;return n&&(c=c.index(B.shift())),(await Promise.all([c[t](...B),s&&u.done]))[0]};return Fa.set(e,i),i}pg(r=>({...r,get:(e,t,n)=>qc(e,t)||r.get(e,t,n),has:(e,t)=>!!qc(e,t)||r.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wg{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(Ig(t)){const n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}}function Ig(r){const e=r.getComponent();return(e==null?void 0:e.type)==="VERSION"}const eB="@firebase/app",Kc="0.16.2";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rn=new TB("@firebase/app"),yg="@firebase/app-compat",Tg="@firebase/analytics-compat",Ag="@firebase/analytics",Rg="@firebase/app-check-compat",vg="@firebase/app-check",Pg="@firebase/auth",bg="@firebase/auth-compat",Sg="@firebase/database",Og="@firebase/data-connect",Ng="@firebase/database-compat",Fg="@firebase/functions",Lg="@firebase/functions-compat",kg="@firebase/installations",Vg="@firebase/installations-compat",xg="@firebase/messaging",Mg="@firebase/messaging-compat",Gg="@firebase/performance",Ug="@firebase/performance-compat",Hg="@firebase/remote-config",Jg="@firebase/remote-config-compat",jg="@firebase/storage",qg="@firebase/storage-compat",Kg="@firebase/firestore",zg="@firebase/ai",Qg="@firebase/firestore-compat",Wg="firebase",$g="12.19.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tB="[DEFAULT]",Yg={[eB]:"fire-core",[yg]:"fire-core-compat",[Ag]:"fire-analytics",[Tg]:"fire-analytics-compat",[vg]:"fire-app-check",[Rg]:"fire-app-check-compat",[Pg]:"fire-auth",[bg]:"fire-auth-compat",[Sg]:"fire-rtdb",[Og]:"fire-data-connect",[Ng]:"fire-rtdb-compat",[Fg]:"fire-fn",[Lg]:"fire-fn-compat",[kg]:"fire-iid",[Vg]:"fire-iid-compat",[xg]:"fire-fcm",[Mg]:"fire-fcm-compat",[Gg]:"fire-perf",[Ug]:"fire-perf-compat",[Hg]:"fire-rc",[Jg]:"fire-rc-compat",[jg]:"fire-gcs",[qg]:"fire-gcs-compat",[Kg]:"fire-fst",[Qg]:"fire-fst-compat",[zg]:"fire-vertex","fire-js":"fire-js",[Wg]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fs=new Map,Xg=new Map,nB=new Map;function zc(r,e){try{r.container.addComponent(e)}catch(t){rn.debug(`Component ${e.name} failed to register with FirebaseApp ${r.name}`,t)}}function Cr(r){const e=r.name;if(nB.has(e))return rn.debug(`There were multiple attempts to register component ${e}.`),!1;nB.set(e,r);for(const t of Fs.values())zc(t,r);for(const t of Xg.values())zc(t,r);return!0}function ri(r,e){const t=r.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),r.container.getProvider(e)}function yt(r){return r==null?!1:r.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zg={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},$t=new ti("app","Firebase",Zg);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class em{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new On("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw $t.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Er=$g;function tm(r,e={}){let t=r;typeof e!="object"&&(e={name:e});const n={name:tB,automaticDataCollectionEnabled:!0,...e},s=n.name;if(typeof s!="string"||!s)throw $t.create("bad-app-name",{appName:String(s)});if(t||(t=zh()),!t)throw $t.create("no-options");const i=Fs.get(s);if(i)if(Sn(t,i.options)){if(Sn(n,i.config))return i;throw $t.create("duplicate-app",{appName:s,mismatchedParam:"config",oldValue:JSON.stringify(i.config),newValue:JSON.stringify(n)})}else throw $t.create("duplicate-app",{appName:s,mismatchedParam:"options",oldValue:JSON.stringify(i.options),newValue:JSON.stringify(t)});const o=new og(s);for(const u of nB.values())o.addComponent(u);const B=new em(t,n,o);return Fs.set(s,B),B}function RB(r=tB){const e=Fs.get(r);if(!e&&r===tB&&zh())return tm();if(!e)throw $t.create("no-app",{appName:r});return e}function HA(){return Array.from(Fs.values())}function xt(r,e,t){let n=Yg[r]??r;t&&(n+=`-${t}`);const s=n.match(/\s|\//),i=e.match(/\s|\//);if(s||i){const o=[`Unable to register library "${n}" with version "${e}":`];s&&o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),s&&i&&o.push("and"),i&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),rn.warn(o.join(" "));return}Cr(new On(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nm="firebase-heartbeat-database",rm=1,Ls="firebase-heartbeat-store";let La=null;function Xh(){return La||(La=Eg(nm,rm,{upgrade:(r,e)=>{switch(e){case 0:try{r.createObjectStore(Ls)}catch(t){console.warn(t)}}}}).catch(r=>{throw $t.create("idb-open",{originalErrorMessage:r.message})})),La}async function sm(r){try{const t=(await Xh()).transaction(Ls),n=await t.objectStore(Ls).get(Zh(r));return await t.done,n}catch(e){if(e instanceof zt)rn.warn(e.message);else{const t=$t.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});rn.warn(t.message)}}}async function Qc(r,e){try{const n=(await Xh()).transaction(Ls,"readwrite");await n.objectStore(Ls).put(e,Zh(r)),await n.done}catch(t){if(t instanceof zt)rn.warn(t.message);else{const n=$t.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});rn.warn(n.message)}}}function Zh(r){return`${r.name}!${r.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const im=1024,om=30;class am{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new um(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=Wc();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(o=>o.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>om){const o=cm(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){rn.warn(n)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Wc(),{heartbeatsToSend:n,unsentEntries:s}=Bm(this._heartbeatsCache.heartbeats),i=Bo(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return rn.warn(t),""}}}function Wc(){return new Date().toISOString().substring(0,10)}function Bm(r,e=im){const t=[];let n=r.slice();for(const s of r){const i=t.find(o=>o.agent===s.agent);if(i){if(i.dates.push(s.date),$c(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),$c(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}class um{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Wp()?$p().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await sm(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return Qc(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return Qc(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}}function $c(r){return Bo(JSON.stringify({version:2,heartbeats:r})).length}function cm(r){if(r.length===0)return-1;let e=0,t=r[0].date;for(let n=1;n<r.length;n++)r[n].date<t&&(t=r[n].date,e=n);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lm(r){Cr(new On("platform-logger",e=>new wg(e),"PRIVATE")),Cr(new On("heartbeat",e=>new am(e),"PRIVATE")),xt(eB,Kc,r),xt(eB,Kc,"esm2020"),xt("fire-js","")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */lm("");function eC(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const hm=eC,tC=new ti("auth","Firebase",eC());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uo=new TB("@firebase/auth");function $i(r,...e){uo.logLevel<=ae.WARN&&uo.warn(`Auth (${Er}): ${r}`,...e)}function Yi(r,...e){uo.logLevel<=ae.ERROR&&uo.error(`Auth (${Er}): ${r}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jt(r,...e){throw vB(r,...e)}function vt(r,...e){return vB(r,...e)}function No(r,e,t){const n={...hm(),[e]:t};return new ti("auth","Firebase",n).create(e,{appName:r.name})}function or(r){return No(r,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Cm(r,e,t){const n=t;if(!(e instanceof n))throw n.name!==e.constructor.name&&Jt(r,"argument-error"),No(r,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function vB(r,...e){if(typeof r!="string"){const t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=r.name),r._errorFactory.create(t,...n)}return tC.create(r,...e)}function te(r,e,...t){if(!r)throw vB(e,...t)}function Yt(r){const e="INTERNAL ASSERTION FAILED: "+r;throw Yi(e),new Error(e)}function sn(r,e){r||Yt(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rB(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.href)||""}function fm(){return Yc()==="http:"||Yc()==="https:"}function Yc(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dm(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(fm()||qp()||"connection"in navigator)?navigator.onLine:!0}function pm(){if(typeof navigator>"u")return null;const r=navigator;return r.languages&&r.languages[0]||r.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class si{constructor(e,t){this.shortDelay=e,this.longDelay=t,sn(t>e,"Short delay should be less than long delay!"),this.isMobile=Hp()||Kp()}get(){return dm()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function PB(r,e){sn(r.emulator,"Emulator should always be set here");const{url:t}=r.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nC{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Yt("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Yt("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Yt("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gm={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mm=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],Em=new si(3e4,6e4);function bB(r,e){return r.tenantId&&!e.tenantId?{...e,tenantId:r.tenantId}:e}async function jr(r,e,t,n,s={}){return rC(r,s,async()=>{let i={},o={};n&&(e==="GET"?o=n:i={body:JSON.stringify(n)});const B=ni({...o,key:r.config.apiKey}).slice(1),u=await r._getAdditionalHeaders();u["Content-Type"]="application/json",r.languageCode&&(u["X-Firebase-Locale"]=r.languageCode);const c={method:e,headers:u,...i};return jp()||(c.referrerPolicy="strict-origin-when-cross-origin"),r.emulatorConfig&&jn(r.emulatorConfig.host)&&(c.credentials="include"),nC.fetch()(await sC(r,r.config.apiHost,t,B),c)})}async function rC(r,e,t){r._canInitEmulator=!1;const n={...gm,...e};try{const s=new Dm(r),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await i.json();if("needConfirmation"in o)throw ki(r,"account-exists-with-different-credential",o);if(i.ok&&!("errorMessage"in o))return o;{const B=i.ok?o.errorMessage:o.error.message,[u,c]=B.split(" : ");if(u==="FEDERATED_USER_ID_ALREADY_LINKED")throw ki(r,"credential-already-in-use",o);if(u==="EMAIL_EXISTS")throw ki(r,"email-already-in-use",o);if(u==="USER_DISABLED")throw ki(r,"user-disabled",o);const h=n[u]||u.toLowerCase().replace(/[_\s]+/g,"-");if(c)throw No(r,h,c);Jt(r,h)}}catch(s){if(s instanceof zt)throw s;Jt(r,"network-request-failed",{message:String(s)})}}async function _m(r,e,t,n,s={}){const i=await jr(r,e,t,n,s);return"mfaPendingCredential"in i&&Jt(r,"multi-factor-auth-required",{_serverResponse:i}),i}async function sC(r,e,t,n){const s=`${e}${t}?${n}`,i=r,o=i.config.emulator?PB(r.config,s):`${r.config.apiScheme}://${s}`;return mm.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(o).toString():o}class Dm{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(vt(this.auth,"network-request-failed")),Em.get())})}}function ki(r,e,t){const n={appName:r.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);const s=vt(r,e,n);return s.customData._tokenResponse=t,s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function wm(r,e){return jr(r,"POST","/v1/accounts:delete",e)}async function co(r,e){return jr(r,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Is(r){if(r)try{const e=new Date(Number(r));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function Im(r,e=!1){const t=ye(r),n=await t.getIdToken(e),s=SB(n);te(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const i=typeof s.firebase=="object"?s.firebase:void 0,o=i==null?void 0:i.sign_in_provider;return{claims:s,token:n,authTime:Is(ka(s.auth_time)),issuedAtTime:Is(ka(s.iat)),expirationTime:Is(ka(s.exp)),signInProvider:o||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function ka(r){return Number(r)*1e3}function SB(r){const[e,t,n]=r.split(".");if(e===void 0||t===void 0||n===void 0)return Yi("JWT malformed, contained fewer than 3 sections"),null;try{const s=jh(t);return s?JSON.parse(s):(Yi("Failed to decode base64 JWT payload"),null)}catch(s){return Yi("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function Xc(r){const e=SB(r);return te(e,"internal-error"),te(typeof e.exp<"u","internal-error"),te(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ks(r,e,t=!1){if(t)return e;try{return await e}catch(n){throw n instanceof zt&&ym(n)&&r.auth.currentUser===r&&await r.auth.signOut(),n}}function ym({code:r}){return r==="auth/user-disabled"||r==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tm{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sB{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Is(this.lastLoginAt),this.creationTime=Is(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function lo(r){var f;const e=r.auth,t=await r.getIdToken(),n=await ks(r,co(e,{idToken:t}));te(n==null?void 0:n.users.length,e,"internal-error");const s=n.users[0];r._notifyReloadListener(s);const i=(f=s.providerUserInfo)!=null&&f.length?iC(s.providerUserInfo):[],o=Rm(r.providerData,i),B=r.isAnonymous,u=!(r.email&&s.passwordHash)&&!(o!=null&&o.length),c=B?u:!1,h={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:o,metadata:new sB(s.createdAt,s.lastLoginAt),isAnonymous:c};Object.assign(r,h)}async function Am(r){const e=ye(r);await lo(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function Rm(r,e){return[...r.filter(n=>!e.some(s=>s.providerId===n.providerId)),...e]}function iC(r){return r.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function vm(r,e){const t=await rC(r,{},async()=>{const n=ni({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=r.config,o=await sC(r,s,"/v1/token",`key=${i}`),B=await r._getAdditionalHeaders();B["Content-Type"]="application/x-www-form-urlencoded";const u={method:"POST",headers:B,body:n};return r.emulatorConfig&&jn(r.emulatorConfig.host)&&(u.credentials="include"),nC.fetch()(o,u)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function Pm(r,e){return jr(r,"POST","/v2/accounts:revokeToken",bB(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fr{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){te(e.idToken,"internal-error"),te(typeof e.idToken<"u","internal-error"),te(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Xc(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){te(e.length!==0,"internal-error");const t=Xc(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(te(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:s,expiresIn:i}=await vm(e,t);this.updateTokensAndExpiration(n,s,Number(i))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){const{refreshToken:n,accessToken:s,expirationTime:i}=t,o=new Fr;return n&&(te(typeof n=="string","internal-error",{appName:e}),o.refreshToken=n),s&&(te(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),i&&(te(typeof i=="number","internal-error",{appName:e}),o.expirationTime=i),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Fr,this.toJSON())}_performRefresh(){return Yt("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dn(r,e){te(typeof r=="string"||typeof r>"u","internal-error",{appName:e})}class Rt{constructor({uid:e,auth:t,stsTokenManager:n,...s}){this.providerId="firebase",this.proactiveRefresh=new Tm(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new sB(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){const t=await ks(this,this.stsTokenManager.getToken(this.auth,e));return te(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return Im(this,e)}reload(){return Am(this)}_assign(e){this!==e&&(te(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new Rt({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){te(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await lo(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(yt(this.auth.app))return Promise.reject(or(this.auth));const e=await this.getIdToken();return await ks(this,wm(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const n=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,o=t.photoURL??void 0,B=t.tenantId??void 0,u=t._redirectEventId??void 0,c=t.createdAt??void 0,h=t.lastLoginAt??void 0,{uid:f,emailVerified:p,isAnonymous:w,providerData:R,stsTokenManager:k}=t;te(f&&k,e,"internal-error");const M=Fr.fromJSON(this.name,k);te(typeof f=="string",e,"internal-error"),dn(n,e.name),dn(s,e.name),te(typeof p=="boolean",e,"internal-error"),te(typeof w=="boolean",e,"internal-error"),dn(i,e.name),dn(o,e.name),dn(B,e.name),dn(u,e.name),dn(c,e.name),dn(h,e.name);const K=new Rt({uid:f,auth:e,email:s,emailVerified:p,displayName:n,isAnonymous:w,photoURL:o,phoneNumber:i,tenantId:B,stsTokenManager:M,createdAt:c,lastLoginAt:h});return R&&Array.isArray(R)&&(K.providerData=R.map(ee=>({...ee}))),u&&(K._redirectEventId=u),K}static async _fromIdTokenResponse(e,t,n=!1){const s=new Fr;s.updateFromServerResponse(t);const i=new Rt({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:n});return await lo(i),i}static async _fromGetAccountInfoResponse(e,t,n){const s=t.users[0];te(s.localId!==void 0,"internal-error");const i=s.providerUserInfo!==void 0?iC(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),B=new Fr;B.updateFromIdToken(n);const u=new Rt({uid:s.localId,auth:e,stsTokenManager:B,isAnonymous:o}),c={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new sB(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(u,c),u}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zc=new Map;function Xt(r){sn(r instanceof Function,"Expected a class definition");let e=Zc.get(r);return e?(sn(e instanceof r,"Instance stored in cache mismatched with class"),e):(e=new r,Zc.set(r,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oC{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}oC.type="NONE";const el=oC;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xi(r,e,t){return`firebase:${r}:${e}:${t}`}class ar{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:s,name:i}=this.auth;this.fullUserKey=Xi(this.userKey,s.apiKey,i),this.fullPersistenceKey=Xi("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t);try{this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}catch{}}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await co(this.auth,{idToken:e}).catch(()=>{});return t?Rt._fromGetAccountInfoResponse(this.auth,t,e):null}return Rt._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){try{this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}catch{}}static async create(e,t,n="authUser"){if(!t.length)return new ar(Xt(el),e,n);const s=(await Promise.all(t.map(async c=>{try{if(await c._isAvailable())return c}catch{return}}))).filter(c=>c);let i=s[0]||Xt(el);const o=Xi(n,e.config.apiKey,e.name);let B=null;for(const c of t)try{const h=await c._get(o);if(h){let f;if(typeof h=="string"){const p=await co(e,{idToken:h}).catch(()=>{});if(!p)break;f=await Rt._fromGetAccountInfoResponse(e,p,h)}else f=Rt._fromJSON(e,h);c!==i&&(B=f),i=c;break}}catch{}const u=s.filter(c=>c._shouldAllowMigration);return!i._shouldAllowMigration||!u.length?new ar(i,e,n):(i=u[0],B&&await i._set(o,B.toJSON()),await Promise.all(t.map(async c=>{if(c!==i)try{await c._remove(o)}catch{}})),new ar(i,e,n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tl(r){const e=r.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(cC(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(aC(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(hC(e))return"Blackberry";if(CC(e))return"Webos";if(BC(e))return"Safari";if((e.includes("chrome/")||uC(e))&&!e.includes("edge/"))return"Chrome";if(lC(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=r.match(t);if((n==null?void 0:n.length)===2)return n[1]}return"Other"}function aC(r=$e()){return/firefox\//i.test(r)}function BC(r=$e()){const e=r.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function uC(r=$e()){return/crios\//i.test(r)}function cC(r=$e()){return/iemobile/i.test(r)}function lC(r=$e()){return/android/i.test(r)}function hC(r=$e()){return/blackberry/i.test(r)}function CC(r=$e()){return/webos/i.test(r)}function OB(r=$e()){return/iphone|ipad|ipod/i.test(r)||/macintosh/i.test(r)&&/mobile/i.test(r)}function bm(r=$e()){var e;return OB(r)&&!!((e=window.navigator)!=null&&e.standalone)}function Sm(){return zp()&&document.documentMode===10}function fC(r=$e()){return OB(r)||lC(r)||CC(r)||hC(r)||/windows phone/i.test(r)||cC(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dC(r,e=[]){let t;switch(r){case"Browser":t=tl($e());break;case"Worker":t=`${tl($e())}-${r}`;break;default:t=r}const n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Er}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Om{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const n=i=>new Promise((o,B)=>{try{const u=e(i);o(u)}catch(u){B(u)}});n.onAbort=t,this.queue.push(n);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n==null?void 0:n.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Nm(r,e={}){return jr(r,"GET","/v2/passwordPolicy",bB(r,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fm=6;class Lm{constructor(e){var n;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??Fm,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((n=e.allowedNonAlphanumericCharacters)==null?void 0:n.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let s=0;s<e.length;s++)n=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class km{constructor(e,t,n,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new nl(this),this.idTokenSubscription=new nl(this),this.beforeStateQueue=new Om(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=tC,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=Xt(t)),this._initializationPromise=this.queue(async()=>{var n,s,i;if(!this._deleted){try{this.persistenceManager=await ar.create(this,e)}catch(o){$i(`Failed to initialize persistence: ${o}`),this.persistenceManager=await ar.create(this,[])}finally{(n=this._resolvePersistenceManagerAvailable)==null||n.call(this)}if(!this._deleted){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}try{await this.initializeCurrentUser(t)}catch(o){$i(`Failed to initialize current user: ${o}`),await this.directlySetCurrentUser(null).catch(()=>{})}this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await co(this,{idToken:e}),n=await Rt._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(yt(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(B=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(B,B))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let n=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(i=this.redirectUser)==null?void 0:i._redirectEventId,B=n==null?void 0:n._redirectEventId,u=await this.tryRedirectSignIn(e);(!o||o===B)&&(u!=null&&u.user)&&(n=u.user,s=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(n)}catch(o){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return te(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await lo(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=pm()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(yt(this.app))return Promise.reject(or(this));const t=e?ye(e):null;return t&&te(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&te(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return yt(this.app)?Promise.reject(or(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return yt(this.app)?Promise.reject(or(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(Xt(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await Nm(this),t=new Lm(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new ti("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await Pm(this,n)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&Xt(e)||this._popupRedirectResolver;te(t,this,"argument-error"),this.redirectPersistenceManager=await ar.create(this,[Xt(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((n=this.redirectUser)==null?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,s){if(this._deleted)return()=>{};const i=typeof t=="function"?t:t.next.bind(t);let o=!1;const B=this._isInitialized?Promise.resolve():this._initializationPromise;if(te(B,this,"internal-error"),B.then(()=>{o||i(this.currentUser)}).catch(u=>{if(!o)if(typeof t!="function"&&t.error)t.error(u);else if(n)n(u);else throw u}),typeof t=="function"){const u=e.addObserver(t,n,s);return()=>{o=!0,u()}}else{const u=e.addObserver(t);return()=>{o=!0,u()}}}async directlySetCurrentUser(e){if(this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,this.persistenceManager)try{e?await this.persistenceManager.setCurrentUser(e):await this.persistenceManager.removeCurrentUser()}catch(t){const n=(t==null?void 0:t.message)||String(t),s=No(this,"internal-error",`An internal AuthError has occurred: ${n}`);throw s.customData={originalError:t},s}}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return te(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=dC(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){var t;if(yt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&$i(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function Fo(r){return ye(r)}class nl{constructor(e){this.auth=e,this.observer=null,this.addObserver=eg(t=>this.observer=t)}get next(){return te(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let NB={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function Vm(r){NB=r}function xm(r){return NB.loadJS(r)}function Mm(){return NB.gapiScript}function Gm(r){return`__${r}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Um(r,e){const t=ri(r,"auth");if(t.isInitialized()){const s=t.getImmediate(),i=t.getOptions();if(Sn(i,e??{}))return s;Jt(s,"already-initialized")}return t.initialize({options:e})}function Hm(r,e){const t=(e==null?void 0:e.persistence)||[],n=(Array.isArray(t)?t:[t]).map(Xt);e!=null&&e.errorMap&&r._updateErrorMap(e.errorMap),r._initializeWithPersistence(n,e==null?void 0:e.popupRedirectResolver)}function Jm(r,e,t){const n=Fo(r);te(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");const s=!1,i=pC(e),{host:o,port:B}=jm(e),u=B===null?"":`:${B}`,c={url:`${i}//${o}${u}/`},h=Object.freeze({host:o,port:B,protocol:i.replace(":",""),options:Object.freeze({disableWarnings:s})});if(!n._canInitEmulator){te(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),te(Sn(c,n.config.emulator)&&Sn(h,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=c,n.emulatorConfig=h,n.settings.appVerificationDisabledForTesting=!0,jn(o)?Oo(`${i}//${o}${u}`):qm()}function pC(r){const e=r.indexOf(":");return e<0?"":r.substr(0,e+1)}function jm(r){const e=pC(r),t=/(\/\/)?([^?#/]+)/.exec(r.substr(e.length));if(!t)return{host:"",port:null};const n=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(n);if(s){const i=s[1];return{host:i,port:rl(n.substr(i.length+1))}}else{const[i,o]=n.split(":");return{host:i,port:rl(o)}}}function rl(r){if(!r)return null;const e=Number(r);return isNaN(e)?null:e}function qm(){function r(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",r):r())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gC{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return Yt("not implemented")}_getIdTokenResponse(e){return Yt("not implemented")}_linkToIdToken(e,t){return Yt("not implemented")}_getReauthenticationResolver(e){return Yt("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Lr(r,e){return _m(r,"POST","/v1/accounts:signInWithIdp",bB(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Km="http://localhost";class fr extends gC{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new fr(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Jt("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:s,...i}=t;if(!n||!s)return null;const o=new fr(n,s);return o.idToken=i.idToken||void 0,o.accessToken=i.accessToken||void 0,o.secret=i.secret,o.nonce=i.nonce,o.pendingToken=i.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return Lr(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,Lr(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Lr(e,t)}buildRequest(){const e={requestUri:Km,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=ni(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class FB{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ii extends FB{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class En extends ii{constructor(){super("facebook.com")}static credential(e){return fr._fromParams({providerId:En.PROVIDER_ID,signInMethod:En.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return En.credentialFromTaggedObject(e)}static credentialFromError(e){return En.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return En.credential(e.oauthAccessToken)}catch{return null}}}En.FACEBOOK_SIGN_IN_METHOD="facebook.com";En.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _n extends ii{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return fr._fromParams({providerId:_n.PROVIDER_ID,signInMethod:_n.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return _n.credentialFromTaggedObject(e)}static credentialFromError(e){return _n.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return _n.credential(t,n)}catch{return null}}}_n.GOOGLE_SIGN_IN_METHOD="google.com";_n.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dn extends ii{constructor(){super("github.com")}static credential(e){return fr._fromParams({providerId:Dn.PROVIDER_ID,signInMethod:Dn.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Dn.credentialFromTaggedObject(e)}static credentialFromError(e){return Dn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Dn.credential(e.oauthAccessToken)}catch{return null}}}Dn.GITHUB_SIGN_IN_METHOD="github.com";Dn.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wn extends ii{constructor(){super("twitter.com")}static credential(e,t){return fr._fromParams({providerId:wn.PROVIDER_ID,signInMethod:wn.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return wn.credentialFromTaggedObject(e)}static credentialFromError(e){return wn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return wn.credential(t,n)}catch{return null}}}wn.TWITTER_SIGN_IN_METHOD="twitter.com";wn.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vr{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,s=!1){const i=await Rt._fromIdTokenResponse(e,n,s),o=sl(n);return new Vr({user:i,providerId:o,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const s=sl(n);return new Vr({user:e,providerId:s,_tokenResponse:n,operationType:t})}}function sl(r){return r.providerId?r.providerId:"phoneNumber"in r?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ho extends zt{constructor(e,t,n,s){super(t.code,t.message),this.operationType=n,this.user=s,Object.setPrototypeOf(this,ho.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,s){return new ho(e,t,n,s)}}function mC(r,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(r):t._getIdTokenResponse(r)).catch(i=>{throw i.code==="auth/multi-factor-auth-required"?ho._fromErrorAndOperation(r,i,e,n):i})}async function zm(r,e,t=!1){const n=await ks(r,e._linkToIdToken(r.auth,await r.getIdToken()),t);return Vr._forOperation(r,"link",n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Qm(r,e,t=!1){const{auth:n}=r;if(yt(n.app))return Promise.reject(or(n));const s="reauthenticate";try{const i=await ks(r,mC(n,s,e,r),t);te(i.idToken,n,"internal-error");const o=SB(i.idToken);te(o,n,"internal-error");const{sub:B}=o;return te(r.uid===B,n,"user-mismatch"),Vr._forOperation(r,s,i)}catch(i){throw(i==null?void 0:i.code)==="auth/user-not-found"&&Jt(n,"user-mismatch"),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Wm(r,e,t=!1){if(yt(r.app))return Promise.reject(or(r));const n="signIn",s=await mC(r,n,e),i=await Vr._fromIdTokenResponse(r,n,s);return t||await r._updateCurrentUser(i.user),i}function $m(r,e,t,n){return ye(r).onIdTokenChanged(e,t,n)}function Ym(r,e,t){return ye(r).beforeAuthStateChanged(e,t)}function JA(r,e,t,n){return ye(r).onAuthStateChanged(e,t,n)}function jA(r){return ye(r).signOut()}const Co="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class EC{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Co,"1"),this.storage.removeItem(Co),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xm=1e3,Zm=10;class _C extends EC{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=fC(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),s=this.localCache[t];n!==s&&e(t,s,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,B,u)=>{this.notifyListeners(o,u)});return}const n=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const o=this.storage.getItem(n);!t&&this.localCache[n]===o||this.notifyListeners(n,o)},i=this.storage.getItem(n);Sm()&&i!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,Zm):s()}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},Xm)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}_C.type="LOCAL";const eE=_C;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DC extends EC{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}DC.type="SESSION";const wC=DC;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tE(r){return Promise.all(r.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lo{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const n=new Lo(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:s,data:i}=t.data,o=this.handlersMap[s];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:s});const B=Array.from(o).map(async c=>c(t.origin,i)),u=await tE(B);t.ports[0].postMessage({status:"done",eventId:n,eventType:s,response:u})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Lo.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function LB(r="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return r+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nE{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let i,o;return new Promise((B,u)=>{const c=LB("",20);s.port1.start();const h=setTimeout(()=>{u(new Error("unsupported_event"))},n);o={messageChannel:s,onMessage(f){const p=f;if(p.data.eventId===c)switch(p.data.status){case"ack":clearTimeout(h),i=setTimeout(()=>{u(new Error("timeout"))},3e3);break;case"done":clearTimeout(i),B(p.data.response);break;default:clearTimeout(h),clearTimeout(i),u(new Error("invalid_response"));break}}},this.handlers.add(o),s.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:c,data:t},[s.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mt(){return window}function rE(r){Mt().location.href=r}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function IC(){return typeof Mt().WorkerGlobalScope<"u"&&typeof Mt().importScripts=="function"}async function sE(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function iE(){var r;return((r=navigator==null?void 0:navigator.serviceWorker)==null?void 0:r.controller)||null}function oE(){return IC()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yC="firebaseLocalStorageDb",aE=1,fo="firebaseLocalStorage",TC="fbase_key";class oi{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function ko(r,e){return r.transaction([fo],e?"readwrite":"readonly").objectStore(fo)}function BE(){const r=indexedDB.deleteDatabase(yC);return new oi(r).toPromise()}function AC(){const r=indexedDB.open(yC,aE);return new Promise((e,t)=>{r.addEventListener("error",()=>{t(r.error)}),r.addEventListener("upgradeneeded",()=>{const n=r.result;try{n.createObjectStore(fo,{keyPath:TC})}catch(s){t(s)}}),r.addEventListener("success",async()=>{const n=r.result;n.objectStoreNames.contains(fo)?e(n):(n.close(),await BE(),e(await AC()))})})}async function il(r,e,t){const n=ko(r,!0).put({[TC]:e,value:t});return new oi(n).toPromise()}async function uE(r,e){const t=ko(r,!1).get(e),n=await new oi(t).toPromise();return n===void 0?null:n.value}function ol(r,e){const t=ko(r,!0).delete(e);return new oi(t).toPromise()}const cE=800,lE=3;class RC{registerLifecycleListeners(){typeof window<"u"&&typeof window.addEventListener=="function"&&(window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow))}unregisterLifecycleListeners(){typeof window<"u"&&typeof window.removeEventListener=="function"&&(window.removeEventListener("pagehide",this.onPageHide),window.removeEventListener("pageshow",this.onPageShow))}constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.isClosing=!1,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this.onPageHide=()=>{this.isClosing=!0,this.stopPolling(),this.dbPromise&&(this.dbPromise.then(e=>e.close()).catch(()=>{}),this.dbPromise=null)},this.onPageShow=()=>{this.isClosing&&(this.isClosing=!1,Object.keys(this.listeners).length>0&&this.startPolling())},this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.dbPromise?this.dbPromise:(this.dbPromise=AC(),this.dbPromise.catch(()=>{this.dbPromise=null}),this.dbPromise)}async _withRetries(e){let t=0;for(;;)try{const n=await this._openDb();return await e(n)}catch(n){if(t++>lE)throw n;if(this.dbPromise){const s=this.dbPromise;this.dbPromise=null;try{(await s).close()}catch{}}}}async initializeServiceWorkerMessaging(){return IC()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Lo._getInstance(oE()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await sE(),!this.activeServiceWorker)return;this.sender=new nE(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(n=e[0])!=null&&n.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||iE()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{return indexedDB?(await this._withRetries(async e=>{await il(e,Co,"1"),await ol(e,Co)}),!0):!1}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>il(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(n=>uE(n,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>ol(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){if(this.isClosing)return[];try{const e=await this._withRetries(s=>{const i=ko(s,!1).getAll();return new oi(i).toPromise()});if(this.isClosing)return[];if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],n=new Set;if(e.length!==0)for(const{fbase_key:s,value:i}of e)n.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(i)&&(this.notifyListeners(s,i),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!n.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}catch(e){return this.isClosing||$i(`Firebase Auth cross-tab polling failed with error: ${e}`),[]}}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const s of Array.from(n))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),cE)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.startPolling(),this.registerLifecycleListeners()),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.stopPolling(),this.unregisterLifecycleListeners())}}RC.type="LOCAL";const hE=RC;new si(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vC(r,e){return e?Xt(e):(te(r._popupRedirectResolver,r,"argument-error"),r._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kB extends gC{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Lr(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Lr(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Lr(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function CE(r){return Wm(r.auth,new kB(r),r.bypassAuthState)}function fE(r){const{auth:e,user:t}=r;return te(t,e,"internal-error"),Qm(t,new kB(r),r.bypassAuthState)}async function dE(r){const{auth:e,user:t}=r;return te(t,e,"internal-error"),zm(t,new kB(r),r.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class PC{constructor(e,t,n,s,i=!1){this.auth=e,this.resolver=n,this.user=s,this.bypassAuthState=i,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(n){this.reject(n)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:n,postBody:s,tenantId:i,error:o,type:B}=e;if(o){this.reject(o);return}const u={auth:this.auth,requestUri:t,sessionId:n,tenantId:i||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(B)(u))}catch(c){this.reject(c)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return CE;case"linkViaPopup":case"linkViaRedirect":return dE;case"reauthViaPopup":case"reauthViaRedirect":return fE;default:Jt(this.auth,"internal-error")}}resolve(e){sn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){sn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pE=new si(2e3,1e4);async function qA(r,e,t){if(yt(r.app))return Promise.reject(vt(r,"operation-not-supported-in-this-environment"));const n=Fo(r);Cm(r,e,FB);const s=vC(n,t);return new nr(n,"signInViaPopup",e,s).executeNotNull()}class nr extends PC{constructor(e,t,n,s,i){super(e,t,s,i),this.provider=n,this.authWindow=null,this.pollId=null,nr.currentPopupAction&&nr.currentPopupAction.cancel(),nr.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return te(e,this.auth,"internal-error"),e}async onExecution(){sn(this.filter.length===1,"Popup operations only handle one event");const e=LB();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(vt(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(vt(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,nr.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,n;if((n=(t=this.authWindow)==null?void 0:t.window)!=null&&n.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(vt(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,pE.get())};e()}}nr.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gE="pendingRedirect",Zi=new Map;class mE extends PC{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=Zi.get(this.auth._key());if(!e){try{const n=await EE(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}Zi.set(this.auth._key(),e)}return this.bypassAuthState||Zi.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function EE(r,e){const t=wE(e),n=DE(r);if(!await n._isAvailable())return!1;const s=await n._get(t)==="true";return await n._remove(t),s}function _E(r,e){Zi.set(r._key(),e)}function DE(r){return Xt(r._redirectPersistence)}function wE(r){return Xi(gE,r.config.apiKey,r.name)}async function IE(r,e,t=!1){if(yt(r.app))return Promise.reject(or(r));const n=Fo(r),s=vC(n,e),o=await new mE(n,s,t).execute();return o&&!t&&(delete o.user._redirectEventId,await n._persistUserIfCurrent(o.user),await n._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yE=10*60*1e3;class TE{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!AE(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!bC(e)){const s=((n=e.error.code)==null?void 0:n.split("auth/")[1])||"internal-error";t.onError(vt(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=yE&&this.cachedEventUids.clear(),this.cachedEventUids.has(al(e))}saveEventToCache(e){this.cachedEventUids.add(al(e)),this.lastProcessedEventTime=Date.now()}}function al(r){return[r.type,r.eventId,r.sessionId,r.tenantId].filter(e=>e).join("-")}function bC({type:r,error:e}){return r==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function AE(r){switch(r.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return bC(r);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function RE(r,e={}){return jr(r,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vE=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,PE=/^https?/;async function bE(r){if(r.config.emulator)return;const{authorizedDomains:e}=await RE(r);for(const t of e)try{if(SE(t))return}catch{}Jt(r,"unauthorized-domain")}function SE(r){const e=rB(),{protocol:t,hostname:n}=new URL(e);if(r.startsWith("chrome-extension://")){const o=new URL(r);return o.hostname===""&&n===""?t==="chrome-extension:"&&r.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===n}if(!PE.test(t))return!1;if(vE.test(r))return n===r;const s=r.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(n)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const OE=new si(3e4,6e4);function Bl(){const r=Mt().___jsl;if(r!=null&&r.H){for(const e of Object.keys(r.H))if(r.H[e].r=r.H[e].r||[],r.H[e].L=r.H[e].L||[],r.H[e].r=[...r.H[e].L],r.CP)for(let t=0;t<r.CP.length;t++)r.CP[t]=null}}function NE(r){return new Promise((e,t)=>{var s,i,o;function n(){Bl(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Bl(),t(vt(r,"network-request-failed"))},timeout:OE.get()})}if((i=(s=Mt().gapi)==null?void 0:s.iframes)!=null&&i.Iframe)e(gapi.iframes.getContext());else if((o=Mt().gapi)!=null&&o.load)n();else{const B=Gm("iframefcb");return Mt()[B]=()=>{gapi.load?n():t(vt(r,"network-request-failed"))},xm(`${Mm()}?onload=${B}`).catch(u=>t(u))}}).catch(e=>{throw eo=null,e})}let eo=null;function FE(r){return eo=eo||NE(r),eo}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const LE=new si(5e3,15e3),kE="__/auth/iframe",VE="emulator/auth/iframe",xE={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},ME=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function GE(r){const e=r.config;te(e.authDomain,r,"auth-domain-config-required");const t=e.emulator?PB(e,VE):`https://${r.config.authDomain}/${kE}`,n={apiKey:e.apiKey,appName:r.name,v:Er},s=ME.get(r.config.apiHost);s&&(n.eid=s);const i=r._getFrameworks();return i.length&&(n.fw=i.join(",")),`${t}?${ni(n).slice(1)}`}async function UE(r){const e=await FE(r),t=Mt().gapi;return te(t,r,"internal-error"),e.open({where:document.body,url:GE(r),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:xE,dontclear:!0},n=>new Promise(async(s,i)=>{await n.restyle({setHideOnLeave:!1});const o=vt(r,"network-request-failed"),B=Mt().setTimeout(()=>{i(o)},LE.get());function u(){Mt().clearTimeout(B),s(n)}n.ping(u).then(u,()=>{i(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const HE={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},JE=500,jE=600,qE="_blank",KE="http://localhost";class ul{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function zE(r,e,t,n=JE,s=jE){const i=Math.max((window.screen.availHeight-s)/2,0).toString(),o=Math.max((window.screen.availWidth-n)/2,0).toString();let B="";const u={...HE,width:n.toString(),height:s.toString(),top:i,left:o},c=$e().toLowerCase();t&&(B=uC(c)?qE:t),aC(c)&&(e=e||KE,u.scrollbars="yes");const h=Object.entries(u).reduce((p,[w,R])=>`${p}${w}=${R},`,"");if(bm(c)&&B!=="_self")return QE(e||"",B),new ul(null);const f=window.open(e||"",B,h);te(f,r,"popup-blocked");try{f.focus()}catch{}return new ul(f)}function QE(r,e){const t=document.createElement("a");t.href=r,t.target=e;const n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const WE="__/auth/handler",$E="emulator/auth/handler",YE=encodeURIComponent("fac");async function cl(r,e,t,n,s,i){te(r.config.authDomain,r,"auth-domain-config-required"),te(r.config.apiKey,r,"invalid-api-key");const o={apiKey:r.config.apiKey,appName:r.name,authType:t,redirectUrl:n,v:Er,eventId:s};if(e instanceof FB){e.setDefaultLanguage(r.languageCode),o.providerId=e.providerId||"",Zp(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[h,f]of Object.entries({}))o[h]=f}if(e instanceof ii){const h=e.getScopes().filter(f=>f!=="");h.length>0&&(o.scopes=h.join(","))}r.tenantId&&(o.tid=r.tenantId);const B=o;for(const h of Object.keys(B))B[h]===void 0&&delete B[h];const u=await r._getAppCheckToken(),c=u?`#${YE}=${encodeURIComponent(u)}`:"";return`${XE(r)}?${ni(B).slice(1)}${c}`}function XE({config:r}){return r.emulator?PB(r,$E):`https://${r.authDomain}/${WE}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Va="webStorageSupport";class ZE{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=wC,this._completeRedirectFn=IE,this._overrideRedirectResult=_E}async _openPopup(e,t,n,s){var o;sn((o=this.eventManagers[e._key()])==null?void 0:o.manager,"_initialize() not called before _openPopup()");const i=await cl(e,t,n,rB(),s);return zE(e,i,LB())}async _openRedirect(e,t,n,s){await this._originValidation(e);const i=await cl(e,t,n,rB(),s);return rE(i),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:i}=this.eventManagers[t];return s?Promise.resolve(s):(sn(i,"If manager is not set, promise should be"),i)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await UE(e),n=new TE(e);return t.register("authEvent",s=>(te(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:n.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Va,{type:Va},s=>{var o;const i=(o=s==null?void 0:s[0])==null?void 0:o[Va];i!==void 0&&t(!!i),Jt(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=bE(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return fC()||BC()||OB()}}const e_=ZE;var ll="@firebase/auth",hl="1.13.6";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t_{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(n=>{e((n==null?void 0:n.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){te(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function n_(r){switch(r){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function r_(r){Cr(new On("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:o,authDomain:B}=n.options;te(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});const u={apiKey:o,authDomain:B,clientPlatform:r,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:dC(r)},c=new km(n,s,i,u);return Hm(c,t),c},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),Cr(new On("auth-internal",e=>{const t=Fo(e.getProvider("auth").getImmediate());return(n=>new t_(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),xt(ll,hl,n_(r)),xt(ll,hl,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const s_=5*60,i_=Qh("authIdTokenMaxAge")||s_;let Cl=null;const o_=r=>async e=>{const t=e&&await e.getIdTokenResult(),n=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>i_)return;const s=t==null?void 0:t.token;Cl!==s&&(Cl=s,await fetch(r,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function KA(r=RB()){const e=ri(r,"auth");if(e.isInitialized())return e.getImmediate();const t=Um(r,{popupRedirectResolver:e_,persistence:[hE,eE,wC]}),n=Qh("authTokenSyncURL");if(n&&typeof isSecureContext=="boolean"&&isSecureContext){const i=new URL(n,location.origin);if(location.origin===i.origin){const o=o_(i.toString());Ym(t,o,()=>o(t.currentUser)),$m(t,B=>o(B))}}const s=qh("auth");return s&&Jm(t,`http://${s}`),t}function a_(){var r;return((r=document.getElementsByTagName("head"))==null?void 0:r[0])??document}Vm({loadJS(r){return new Promise((e,t)=>{const n=document.createElement("script");n.setAttribute("src",r),n.onload=e,n.onerror=s=>{const i=vt("internal-error");i.customData=s,t(i)},n.type="text/javascript",n.charset="UTF-8",a_().appendChild(n)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});r_("Browser");var B_="firebase",u_="12.19.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */xt(B_,u_,"app");var fl=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Rn,SC;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(A,E){function D(){}D.prototype=E.prototype,A.F=E.prototype,A.prototype=new D,A.prototype.constructor=A,A.D=function(v,T,b){for(var _=Array(arguments.length-2),ot=2;ot<arguments.length;ot++)_[ot-2]=arguments[ot];return E.prototype[T].apply(v,_)}}function t(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(n,t),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(A,E,D){D||(D=0);const v=Array(16);if(typeof E=="string")for(var T=0;T<16;++T)v[T]=E.charCodeAt(D++)|E.charCodeAt(D++)<<8|E.charCodeAt(D++)<<16|E.charCodeAt(D++)<<24;else for(T=0;T<16;++T)v[T]=E[D++]|E[D++]<<8|E[D++]<<16|E[D++]<<24;E=A.g[0],D=A.g[1],T=A.g[2];let b=A.g[3],_;_=E+(b^D&(T^b))+v[0]+3614090360&4294967295,E=D+(_<<7&4294967295|_>>>25),_=b+(T^E&(D^T))+v[1]+3905402710&4294967295,b=E+(_<<12&4294967295|_>>>20),_=T+(D^b&(E^D))+v[2]+606105819&4294967295,T=b+(_<<17&4294967295|_>>>15),_=D+(E^T&(b^E))+v[3]+3250441966&4294967295,D=T+(_<<22&4294967295|_>>>10),_=E+(b^D&(T^b))+v[4]+4118548399&4294967295,E=D+(_<<7&4294967295|_>>>25),_=b+(T^E&(D^T))+v[5]+1200080426&4294967295,b=E+(_<<12&4294967295|_>>>20),_=T+(D^b&(E^D))+v[6]+2821735955&4294967295,T=b+(_<<17&4294967295|_>>>15),_=D+(E^T&(b^E))+v[7]+4249261313&4294967295,D=T+(_<<22&4294967295|_>>>10),_=E+(b^D&(T^b))+v[8]+1770035416&4294967295,E=D+(_<<7&4294967295|_>>>25),_=b+(T^E&(D^T))+v[9]+2336552879&4294967295,b=E+(_<<12&4294967295|_>>>20),_=T+(D^b&(E^D))+v[10]+4294925233&4294967295,T=b+(_<<17&4294967295|_>>>15),_=D+(E^T&(b^E))+v[11]+2304563134&4294967295,D=T+(_<<22&4294967295|_>>>10),_=E+(b^D&(T^b))+v[12]+1804603682&4294967295,E=D+(_<<7&4294967295|_>>>25),_=b+(T^E&(D^T))+v[13]+4254626195&4294967295,b=E+(_<<12&4294967295|_>>>20),_=T+(D^b&(E^D))+v[14]+2792965006&4294967295,T=b+(_<<17&4294967295|_>>>15),_=D+(E^T&(b^E))+v[15]+1236535329&4294967295,D=T+(_<<22&4294967295|_>>>10),_=E+(T^b&(D^T))+v[1]+4129170786&4294967295,E=D+(_<<5&4294967295|_>>>27),_=b+(D^T&(E^D))+v[6]+3225465664&4294967295,b=E+(_<<9&4294967295|_>>>23),_=T+(E^D&(b^E))+v[11]+643717713&4294967295,T=b+(_<<14&4294967295|_>>>18),_=D+(b^E&(T^b))+v[0]+3921069994&4294967295,D=T+(_<<20&4294967295|_>>>12),_=E+(T^b&(D^T))+v[5]+3593408605&4294967295,E=D+(_<<5&4294967295|_>>>27),_=b+(D^T&(E^D))+v[10]+38016083&4294967295,b=E+(_<<9&4294967295|_>>>23),_=T+(E^D&(b^E))+v[15]+3634488961&4294967295,T=b+(_<<14&4294967295|_>>>18),_=D+(b^E&(T^b))+v[4]+3889429448&4294967295,D=T+(_<<20&4294967295|_>>>12),_=E+(T^b&(D^T))+v[9]+568446438&4294967295,E=D+(_<<5&4294967295|_>>>27),_=b+(D^T&(E^D))+v[14]+3275163606&4294967295,b=E+(_<<9&4294967295|_>>>23),_=T+(E^D&(b^E))+v[3]+4107603335&4294967295,T=b+(_<<14&4294967295|_>>>18),_=D+(b^E&(T^b))+v[8]+1163531501&4294967295,D=T+(_<<20&4294967295|_>>>12),_=E+(T^b&(D^T))+v[13]+2850285829&4294967295,E=D+(_<<5&4294967295|_>>>27),_=b+(D^T&(E^D))+v[2]+4243563512&4294967295,b=E+(_<<9&4294967295|_>>>23),_=T+(E^D&(b^E))+v[7]+1735328473&4294967295,T=b+(_<<14&4294967295|_>>>18),_=D+(b^E&(T^b))+v[12]+2368359562&4294967295,D=T+(_<<20&4294967295|_>>>12),_=E+(D^T^b)+v[5]+4294588738&4294967295,E=D+(_<<4&4294967295|_>>>28),_=b+(E^D^T)+v[8]+2272392833&4294967295,b=E+(_<<11&4294967295|_>>>21),_=T+(b^E^D)+v[11]+1839030562&4294967295,T=b+(_<<16&4294967295|_>>>16),_=D+(T^b^E)+v[14]+4259657740&4294967295,D=T+(_<<23&4294967295|_>>>9),_=E+(D^T^b)+v[1]+2763975236&4294967295,E=D+(_<<4&4294967295|_>>>28),_=b+(E^D^T)+v[4]+1272893353&4294967295,b=E+(_<<11&4294967295|_>>>21),_=T+(b^E^D)+v[7]+4139469664&4294967295,T=b+(_<<16&4294967295|_>>>16),_=D+(T^b^E)+v[10]+3200236656&4294967295,D=T+(_<<23&4294967295|_>>>9),_=E+(D^T^b)+v[13]+681279174&4294967295,E=D+(_<<4&4294967295|_>>>28),_=b+(E^D^T)+v[0]+3936430074&4294967295,b=E+(_<<11&4294967295|_>>>21),_=T+(b^E^D)+v[3]+3572445317&4294967295,T=b+(_<<16&4294967295|_>>>16),_=D+(T^b^E)+v[6]+76029189&4294967295,D=T+(_<<23&4294967295|_>>>9),_=E+(D^T^b)+v[9]+3654602809&4294967295,E=D+(_<<4&4294967295|_>>>28),_=b+(E^D^T)+v[12]+3873151461&4294967295,b=E+(_<<11&4294967295|_>>>21),_=T+(b^E^D)+v[15]+530742520&4294967295,T=b+(_<<16&4294967295|_>>>16),_=D+(T^b^E)+v[2]+3299628645&4294967295,D=T+(_<<23&4294967295|_>>>9),_=E+(T^(D|~b))+v[0]+4096336452&4294967295,E=D+(_<<6&4294967295|_>>>26),_=b+(D^(E|~T))+v[7]+1126891415&4294967295,b=E+(_<<10&4294967295|_>>>22),_=T+(E^(b|~D))+v[14]+2878612391&4294967295,T=b+(_<<15&4294967295|_>>>17),_=D+(b^(T|~E))+v[5]+4237533241&4294967295,D=T+(_<<21&4294967295|_>>>11),_=E+(T^(D|~b))+v[12]+1700485571&4294967295,E=D+(_<<6&4294967295|_>>>26),_=b+(D^(E|~T))+v[3]+2399980690&4294967295,b=E+(_<<10&4294967295|_>>>22),_=T+(E^(b|~D))+v[10]+4293915773&4294967295,T=b+(_<<15&4294967295|_>>>17),_=D+(b^(T|~E))+v[1]+2240044497&4294967295,D=T+(_<<21&4294967295|_>>>11),_=E+(T^(D|~b))+v[8]+1873313359&4294967295,E=D+(_<<6&4294967295|_>>>26),_=b+(D^(E|~T))+v[15]+4264355552&4294967295,b=E+(_<<10&4294967295|_>>>22),_=T+(E^(b|~D))+v[6]+2734768916&4294967295,T=b+(_<<15&4294967295|_>>>17),_=D+(b^(T|~E))+v[13]+1309151649&4294967295,D=T+(_<<21&4294967295|_>>>11),_=E+(T^(D|~b))+v[4]+4149444226&4294967295,E=D+(_<<6&4294967295|_>>>26),_=b+(D^(E|~T))+v[11]+3174756917&4294967295,b=E+(_<<10&4294967295|_>>>22),_=T+(E^(b|~D))+v[2]+718787259&4294967295,T=b+(_<<15&4294967295|_>>>17),_=D+(b^(T|~E))+v[9]+3951481745&4294967295,A.g[0]=A.g[0]+E&4294967295,A.g[1]=A.g[1]+(T+(_<<21&4294967295|_>>>11))&4294967295,A.g[2]=A.g[2]+T&4294967295,A.g[3]=A.g[3]+b&4294967295}n.prototype.v=function(A,E){E===void 0&&(E=A.length);const D=E-this.blockSize,v=this.C;let T=this.h,b=0;for(;b<E;){if(T==0)for(;b<=D;)s(this,A,b),b+=this.blockSize;if(typeof A=="string"){for(;b<E;)if(v[T++]=A.charCodeAt(b++),T==this.blockSize){s(this,v),T=0;break}}else for(;b<E;)if(v[T++]=A[b++],T==this.blockSize){s(this,v),T=0;break}}this.h=T,this.o+=E},n.prototype.A=function(){var A=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);A[0]=128;for(var E=1;E<A.length-8;++E)A[E]=0;E=this.o*8;for(var D=A.length-8;D<A.length;++D)A[D]=E&255,E/=256;for(this.v(A),A=Array(16),E=0,D=0;D<4;++D)for(let v=0;v<32;v+=8)A[E++]=this.g[D]>>>v&255;return A};function i(A,E){var D=B;return Object.prototype.hasOwnProperty.call(D,A)?D[A]:D[A]=E(A)}function o(A,E){this.h=E;const D=[];let v=!0;for(let T=A.length-1;T>=0;T--){const b=A[T]|0;v&&b==E||(D[T]=b,v=!1)}this.g=D}var B={};function u(A){return-128<=A&&A<128?i(A,function(E){return new o([E|0],E<0?-1:0)}):new o([A|0],A<0?-1:0)}function c(A){if(isNaN(A)||!isFinite(A))return f;if(A<0)return M(c(-A));const E=[];let D=1;for(let v=0;A>=D;v++)E[v]=A/D|0,D*=4294967296;return new o(E,0)}function h(A,E){if(A.length==0)throw Error("number format error: empty string");if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(A.charAt(0)=="-")return M(h(A.substring(1),E));if(A.indexOf("-")>=0)throw Error('number format error: interior "-" character');const D=c(Math.pow(E,8));let v=f;for(let b=0;b<A.length;b+=8){var T=Math.min(8,A.length-b);const _=parseInt(A.substring(b,b+T),E);T<8?(T=c(Math.pow(E,T)),v=v.j(T).add(c(_))):(v=v.j(D),v=v.add(c(_)))}return v}var f=u(0),p=u(1),w=u(16777216);r=o.prototype,r.m=function(){if(k(this))return-M(this).m();let A=0,E=1;for(let D=0;D<this.g.length;D++){const v=this.i(D);A+=(v>=0?v:4294967296+v)*E,E*=4294967296}return A},r.toString=function(A){if(A=A||10,A<2||36<A)throw Error("radix out of range: "+A);if(R(this))return"0";if(k(this))return"-"+M(this).toString(A);const E=c(Math.pow(A,6));var D=this;let v="";for(;;){const T=he(D,E).g;D=K(D,T.j(E));let b=((D.g.length>0?D.g[0]:D.h)>>>0).toString(A);if(D=T,R(D))return b+v;for(;b.length<6;)b="0"+b;v=b+v}},r.i=function(A){return A<0?0:A<this.g.length?this.g[A]:this.h};function R(A){if(A.h!=0)return!1;for(let E=0;E<A.g.length;E++)if(A.g[E]!=0)return!1;return!0}function k(A){return A.h==-1}r.l=function(A){return A=K(this,A),k(A)?-1:R(A)?0:1};function M(A){const E=A.g.length,D=[];for(let v=0;v<E;v++)D[v]=~A.g[v];return new o(D,~A.h).add(p)}r.abs=function(){return k(this)?M(this):this},r.add=function(A){const E=Math.max(this.g.length,A.g.length),D=[];let v=0;for(let T=0;T<=E;T++){let b=v+(this.i(T)&65535)+(A.i(T)&65535),_=(b>>>16)+(this.i(T)>>>16)+(A.i(T)>>>16);v=_>>>16,b&=65535,_&=65535,D[T]=_<<16|b}return new o(D,D[D.length-1]&-2147483648?-1:0)};function K(A,E){return A.add(M(E))}r.j=function(A){if(R(this)||R(A))return f;if(k(this))return k(A)?M(this).j(M(A)):M(M(this).j(A));if(k(A))return M(this.j(M(A)));if(this.l(w)<0&&A.l(w)<0)return c(this.m()*A.m());const E=this.g.length+A.g.length,D=[];for(var v=0;v<2*E;v++)D[v]=0;for(v=0;v<this.g.length;v++)for(let T=0;T<A.g.length;T++){const b=this.i(v)>>>16,_=this.i(v)&65535,ot=A.i(T)>>>16,zn=A.i(T)&65535;D[2*v+2*T]+=_*zn,ee(D,2*v+2*T),D[2*v+2*T+1]+=b*zn,ee(D,2*v+2*T+1),D[2*v+2*T+1]+=_*ot,ee(D,2*v+2*T+1),D[2*v+2*T+2]+=b*ot,ee(D,2*v+2*T+2)}for(A=0;A<E;A++)D[A]=D[2*A+1]<<16|D[2*A];for(A=E;A<2*E;A++)D[A]=0;return new o(D,0)};function ee(A,E){for(;(A[E]&65535)!=A[E];)A[E+1]+=A[E]>>>16,A[E]&=65535,E++}function Be(A,E){this.g=A,this.h=E}function he(A,E){if(R(E))throw Error("division by zero");if(R(A))return new Be(f,f);if(k(A))return E=he(M(A),E),new Be(M(E.g),M(E.h));if(k(E))return E=he(A,M(E)),new Be(M(E.g),E.h);if(A.g.length>30){if(k(A)||k(E))throw Error("slowDivide_ only works with positive integers.");for(var D=p,v=E;v.l(A)<=0;)D=Ae(D),v=Ae(v);var T=Ee(D,1),b=Ee(v,1);for(v=Ee(v,2),D=Ee(D,2);!R(v);){var _=b.add(v);_.l(A)<=0&&(T=T.add(D),b=_),v=Ee(v,1),D=Ee(D,1)}return E=K(A,T.j(E)),new Be(T,E)}for(T=f;A.l(E)>=0;){for(D=Math.max(1,Math.floor(A.m()/E.m())),v=Math.ceil(Math.log(D)/Math.LN2),v=v<=48?1:Math.pow(2,v-48),b=c(D),_=b.j(E);k(_)||_.l(A)>0;)D-=v,b=c(D),_=b.j(E);R(b)&&(b=p),T=T.add(b),A=K(A,_)}return new Be(T,A)}r.B=function(A){return he(this,A).h},r.and=function(A){const E=Math.max(this.g.length,A.g.length),D=[];for(let v=0;v<E;v++)D[v]=this.i(v)&A.i(v);return new o(D,this.h&A.h)},r.or=function(A){const E=Math.max(this.g.length,A.g.length),D=[];for(let v=0;v<E;v++)D[v]=this.i(v)|A.i(v);return new o(D,this.h|A.h)},r.xor=function(A){const E=Math.max(this.g.length,A.g.length),D=[];for(let v=0;v<E;v++)D[v]=this.i(v)^A.i(v);return new o(D,this.h^A.h)};function Ae(A){const E=A.g.length+1,D=[];for(let v=0;v<E;v++)D[v]=A.i(v)<<1|A.i(v-1)>>>31;return new o(D,A.h)}function Ee(A,E){const D=E>>5;E%=32;const v=A.g.length-D,T=[];for(let b=0;b<v;b++)T[b]=E>0?A.i(b+D)>>>E|A.i(b+D+1)<<32-E:A.i(b+D);return new o(T,A.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,SC=n,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=c,o.fromString=h,Rn=o}).apply(typeof fl<"u"?fl:typeof self<"u"?self:typeof window<"u"?window:{});var Vi=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var OC,Es,NC,to,iB,FC,LC,kC;(function(){var r,e=Object.defineProperty;function t(a){a=[typeof globalThis=="object"&&globalThis,a,typeof window=="object"&&window,typeof self=="object"&&self,typeof Vi=="object"&&Vi];for(var l=0;l<a.length;++l){var C=a[l];if(C&&C.Math==Math)return C}throw Error("Cannot find global object")}var n=t(this);function s(a,l){if(l)e:{var C=n;a=a.split(".");for(var d=0;d<a.length-1;d++){var P=a[d];if(!(P in C))break e;C=C[P]}a=a[a.length-1],d=C[a],l=l(d),l!=d&&l!=null&&e(C,a,{configurable:!0,writable:!0,value:l})}}s("Symbol.dispose",function(a){return a||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(a){return a||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(a){return a||function(l){var C=[],d;for(d in l)Object.prototype.hasOwnProperty.call(l,d)&&C.push([d,l[d]]);return C}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},o=this||self;function B(a){var l=typeof a;return l=="object"&&a!=null||l=="function"}function u(a,l,C){return a.call.apply(a.bind,arguments)}function c(a,l,C){return c=u,c.apply(null,arguments)}function h(a,l){var C=Array.prototype.slice.call(arguments,1);return function(){var d=C.slice();return d.push.apply(d,arguments),a.apply(this,d)}}function f(a,l){function C(){}C.prototype=l.prototype,a.Z=l.prototype,a.prototype=new C,a.prototype.constructor=a,a.Ob=function(d,P,S){for(var j=Array(arguments.length-2),se=2;se<arguments.length;se++)j[se-2]=arguments[se];return l.prototype[P].apply(d,j)}}var p=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?a=>a&&AsyncContext.Snapshot.wrap(a):a=>a;function w(a){const l=a.length;if(l>0){const C=Array(l);for(let d=0;d<l;d++)C[d]=a[d];return C}return[]}function R(a,l){for(let d=1;d<arguments.length;d++){const P=arguments[d];var C=typeof P;if(C=C!="object"?C:P?Array.isArray(P)?"array":C:"null",C=="array"||C=="object"&&typeof P.length=="number"){C=a.length||0;const S=P.length||0;a.length=C+S;for(let j=0;j<S;j++)a[C+j]=P[j]}else a.push(P)}}class k{constructor(l,C){this.i=l,this.j=C,this.h=0,this.g=null}get(){let l;return this.h>0?(this.h--,l=this.g,this.g=l.next,l.next=null):l=this.i(),l}}function M(a){o.setTimeout(()=>{throw a},0)}function K(){var a=A;let l=null;return a.g&&(l=a.g,a.g=a.g.next,a.g||(a.h=null),l.next=null),l}class ee{constructor(){this.h=this.g=null}add(l,C){const d=Be.get();d.set(l,C),this.h?this.h.next=d:this.g=d,this.h=d}}var Be=new k(()=>new he,a=>a.reset());class he{constructor(){this.next=this.g=this.h=null}set(l,C){this.h=l,this.g=C,this.next=null}reset(){this.next=this.g=this.h=null}}let Ae,Ee=!1,A=new ee,E=()=>{const a=Promise.resolve(void 0);Ae=()=>{a.then(D)}};function D(){for(var a;a=K();){try{a.h.call(a.g)}catch(C){M(C)}var l=Be;l.j(a),l.h<100&&(l.h++,a.next=l.g,l.g=a)}Ee=!1}function v(){this.u=this.u,this.C=this.C}v.prototype.u=!1,v.prototype.dispose=function(){this.u||(this.u=!0,this.N())},v.prototype[Symbol.dispose]=function(){this.dispose()},v.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function T(a,l){this.type=a,this.g=this.target=l,this.defaultPrevented=!1}T.prototype.h=function(){this.defaultPrevented=!0};var b=function(){if(!o.addEventListener||!Object.defineProperty)return!1;var a=!1,l=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const C=()=>{};o.addEventListener("test",C,l),o.removeEventListener("test",C,l)}catch{}return a}();function _(a){return/^[\s\xa0]*$/.test(a)}function ot(a,l){T.call(this,a?a.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,a&&this.init(a,l)}f(ot,T),ot.prototype.init=function(a,l){const C=this.type=a.type,d=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement,this.g=l,l=a.relatedTarget,l||(C=="mouseover"?l=a.fromElement:C=="mouseout"&&(l=a.toElement)),this.relatedTarget=l,d?(this.clientX=d.clientX!==void 0?d.clientX:d.pageX,this.clientY=d.clientY!==void 0?d.clientY:d.pageY,this.screenX=d.screenX||0,this.screenY=d.screenY||0):(this.clientX=a.clientX!==void 0?a.clientX:a.pageX,this.clientY=a.clientY!==void 0?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0),this.button=a.button,this.key=a.key||"",this.ctrlKey=a.ctrlKey,this.altKey=a.altKey,this.shiftKey=a.shiftKey,this.metaKey=a.metaKey,this.pointerId=a.pointerId||0,this.pointerType=a.pointerType,this.state=a.state,this.i=a,a.defaultPrevented&&ot.Z.h.call(this)},ot.prototype.h=function(){ot.Z.h.call(this);const a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1};var zn="closure_listenable_"+(Math.random()*1e6|0),Zd=0;function ep(a,l,C,d,P){this.listener=a,this.proxy=null,this.src=l,this.type=C,this.capture=!!d,this.ha=P,this.key=++Zd,this.da=this.fa=!1}function Di(a){a.da=!0,a.listener=null,a.proxy=null,a.src=null,a.ha=null}function wi(a,l,C){for(const d in a)l.call(C,a[d],d,a)}function tp(a,l){for(const C in a)l.call(void 0,a[C],C,a)}function Gu(a){const l={};for(const C in a)l[C]=a[C];return l}const Uu="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Hu(a,l){let C,d;for(let P=1;P<arguments.length;P++){d=arguments[P];for(C in d)a[C]=d[C];for(let S=0;S<Uu.length;S++)C=Uu[S],Object.prototype.hasOwnProperty.call(d,C)&&(a[C]=d[C])}}function Ii(a){this.src=a,this.g={},this.h=0}Ii.prototype.add=function(a,l,C,d,P){const S=a.toString();a=this.g[S],a||(a=this.g[S]=[],this.h++);const j=Ba(a,l,d,P);return j>-1?(l=a[j],C||(l.fa=!1)):(l=new ep(l,this.src,S,!!d,P),l.fa=C,a.push(l)),l};function aa(a,l){const C=l.type;if(C in a.g){var d=a.g[C],P=Array.prototype.indexOf.call(d,l,void 0),S;(S=P>=0)&&Array.prototype.splice.call(d,P,1),S&&(Di(l),a.g[C].length==0&&(delete a.g[C],a.h--))}}function Ba(a,l,C,d){for(let P=0;P<a.length;++P){const S=a[P];if(!S.da&&S.listener==l&&S.capture==!!C&&S.ha==d)return P}return-1}var ua="closure_lm_"+(Math.random()*1e6|0),ca={};function Ju(a,l,C,d,P){if(Array.isArray(l)){for(let S=0;S<l.length;S++)Ju(a,l[S],C,d,P);return null}return C=Ku(C),a&&a[zn]?a.J(l,C,B(d)?!!d.capture:!1,P):np(a,l,C,!1,d,P)}function np(a,l,C,d,P,S){if(!l)throw Error("Invalid event type");const j=B(P)?!!P.capture:!!P;let se=ha(a);if(se||(a[ua]=se=new Ii(a)),C=se.add(l,C,d,j,S),C.proxy)return C;if(d=rp(),C.proxy=d,d.src=a,d.listener=C,a.addEventListener)b||(P=j),P===void 0&&(P=!1),a.addEventListener(l.toString(),d,P);else if(a.attachEvent)a.attachEvent(qu(l.toString()),d);else if(a.addListener&&a.removeListener)a.addListener(d);else throw Error("addEventListener and attachEvent are unavailable.");return C}function rp(){function a(C){return l.call(a.src,a.listener,C)}const l=sp;return a}function ju(a,l,C,d,P){if(Array.isArray(l))for(var S=0;S<l.length;S++)ju(a,l[S],C,d,P);else d=B(d)?!!d.capture:!!d,C=Ku(C),a&&a[zn]?(a=a.i,S=String(l).toString(),S in a.g&&(l=a.g[S],C=Ba(l,C,d,P),C>-1&&(Di(l[C]),Array.prototype.splice.call(l,C,1),l.length==0&&(delete a.g[S],a.h--)))):a&&(a=ha(a))&&(l=a.g[l.toString()],a=-1,l&&(a=Ba(l,C,d,P)),(C=a>-1?l[a]:null)&&la(C))}function la(a){if(typeof a!="number"&&a&&!a.da){var l=a.src;if(l&&l[zn])aa(l.i,a);else{var C=a.type,d=a.proxy;l.removeEventListener?l.removeEventListener(C,d,a.capture):l.detachEvent?l.detachEvent(qu(C),d):l.addListener&&l.removeListener&&l.removeListener(d),(C=ha(l))?(aa(C,a),C.h==0&&(C.src=null,l[ua]=null)):Di(a)}}}function qu(a){return a in ca?ca[a]:ca[a]="on"+a}function sp(a,l){if(a.da)a=!0;else{l=new ot(l,this);const C=a.listener,d=a.ha||a.src;a.fa&&la(a),a=C.call(d,l)}return a}function ha(a){return a=a[ua],a instanceof Ii?a:null}var Ca="__closure_events_fn_"+(Math.random()*1e9>>>0);function Ku(a){return typeof a=="function"?a:(a[Ca]||(a[Ca]=function(l){return a.handleEvent(l)}),a[Ca])}function Ke(){v.call(this),this.i=new Ii(this),this.M=this,this.G=null}f(Ke,v),Ke.prototype[zn]=!0,Ke.prototype.removeEventListener=function(a,l,C,d){ju(this,a,l,C,d)};function Xe(a,l){var C,d=a.G;if(d)for(C=[];d;d=d.G)C.push(d);if(a=a.M,d=l.type||l,typeof l=="string")l=new T(l,a);else if(l instanceof T)l.target=l.target||a;else{var P=l;l=new T(d,a),Hu(l,P)}P=!0;let S,j;if(C)for(j=C.length-1;j>=0;j--)S=l.g=C[j],P=yi(S,d,!0,l)&&P;if(S=l.g=a,P=yi(S,d,!0,l)&&P,P=yi(S,d,!1,l)&&P,C)for(j=0;j<C.length;j++)S=l.g=C[j],P=yi(S,d,!1,l)&&P}Ke.prototype.N=function(){if(Ke.Z.N.call(this),this.i){var a=this.i;for(const l in a.g){const C=a.g[l];for(let d=0;d<C.length;d++)Di(C[d]);delete a.g[l],a.h--}}this.G=null},Ke.prototype.J=function(a,l,C,d){return this.i.add(String(a),l,!1,C,d)},Ke.prototype.K=function(a,l,C,d){return this.i.add(String(a),l,!0,C,d)};function yi(a,l,C,d){if(l=a.i.g[String(l)],!l)return!0;l=l.concat();let P=!0;for(let S=0;S<l.length;++S){const j=l[S];if(j&&!j.da&&j.capture==C){const se=j.listener,Me=j.ha||j.src;j.fa&&aa(a.i,j),P=se.call(Me,d)!==!1&&P}}return P&&!d.defaultPrevented}function ip(a,l){if(typeof a!="function")if(a&&typeof a.handleEvent=="function")a=c(a.handleEvent,a);else throw Error("Invalid listener argument");return Number(l)>2147483647?-1:o.setTimeout(a,l||0)}function zu(a){a.g=ip(()=>{a.g=null,a.i&&(a.i=!1,zu(a))},a.l);const l=a.h;a.h=null,a.m.apply(null,l)}class op extends v{constructor(l,C){super(),this.m=l,this.l=C,this.h=null,this.i=!1,this.g=null}j(l){this.h=arguments,this.g?this.i=!0:zu(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function es(a){v.call(this),this.h=a,this.g={}}f(es,v);var Qu=[];function Wu(a){wi(a.g,function(l,C){this.g.hasOwnProperty(C)&&la(l)},a),a.g={}}es.prototype.N=function(){es.Z.N.call(this),Wu(this)},es.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var fa=o.JSON.stringify,ap=o.JSON.parse,Bp=class{stringify(a){return o.JSON.stringify(a,void 0)}parse(a){return o.JSON.parse(a,void 0)}};function $u(){}function Yu(){}var ts={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function da(){T.call(this,"d")}f(da,T);function pa(){T.call(this,"c")}f(pa,T);var Qn={},Xu=null;function Ti(){return Xu=Xu||new Ke}Qn.Ia="serverreachability";function Zu(a){T.call(this,Qn.Ia,a)}f(Zu,T);function ns(a){const l=Ti();Xe(l,new Zu(l))}Qn.STAT_EVENT="statevent";function ec(a,l){T.call(this,Qn.STAT_EVENT,a),this.stat=l}f(ec,T);function Ze(a){const l=Ti();Xe(l,new ec(l,a))}Qn.Ja="timingevent";function tc(a,l){T.call(this,Qn.Ja,a),this.size=l}f(tc,T);function rs(a,l){if(typeof a!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){a()},l)}function ss(){this.g=!0}ss.prototype.ua=function(){this.g=!1};function up(a,l,C,d,P,S){a.info(function(){if(a.g)if(S){var j="",se=S.split("&");for(let pe=0;pe<se.length;pe++){var Me=se[pe].split("=");if(Me.length>1){const Ue=Me[0];Me=Me[1];const Ot=Ue.split("_");j=Ot.length>=2&&Ot[1]=="type"?j+(Ue+"="+Me+"&"):j+(Ue+"=redacted&")}}}else j=null;else j=S;return"XMLHTTP REQ ("+d+") [attempt "+P+"]: "+l+`
`+C+`
`+j})}function cp(a,l,C,d,P,S,j){a.info(function(){return"XMLHTTP RESP ("+d+") [ attempt "+P+"]: "+l+`
`+C+`
`+S+" "+j})}function Ir(a,l,C,d){a.info(function(){return"XMLHTTP TEXT ("+l+"): "+hp(a,C)+(d?" "+d:"")})}function lp(a,l){a.info(function(){return"TIMEOUT: "+l})}ss.prototype.info=function(){};function hp(a,l){if(!a.g)return l;if(!l)return null;try{const S=JSON.parse(l);if(S){for(a=0;a<S.length;a++)if(Array.isArray(S[a])){var C=S[a];if(!(C.length<2)){var d=C[1];if(Array.isArray(d)&&!(d.length<1)){var P=d[0];if(P!="noop"&&P!="stop"&&P!="close")for(let j=1;j<d.length;j++)d[j]=""}}}}return fa(S)}catch{return l}}var Ai={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},nc={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},rc;function ga(){}f(ga,$u),ga.prototype.g=function(){return new XMLHttpRequest},rc=new ga;function is(a){return encodeURIComponent(String(a))}function Cp(a){var l=1;a=a.split(":");const C=[];for(;l>0&&a.length;)C.push(a.shift()),l--;return a.length&&C.push(a.join(":")),C}function un(a,l,C,d){this.j=a,this.i=l,this.l=C,this.S=d||1,this.V=new es(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new sc}function sc(){this.i=null,this.g="",this.h=!1}var ic={},ma={};function Ea(a,l,C){a.M=1,a.A=vi(St(l)),a.u=C,a.R=!0,oc(a,null)}function oc(a,l){a.F=Date.now(),Ri(a),a.B=St(a.A);var C=a.B,d=a.S;Array.isArray(d)||(d=[String(d)]),Ec(C.i,"t",d),a.C=0,C=a.j.L,a.h=new sc,a.g=Vc(a.j,C?l:null,!a.u),a.P>0&&(a.O=new op(c(a.Y,a,a.g),a.P)),l=a.V,C=a.g,d=a.ba;var P="readystatechange";Array.isArray(P)||(P&&(Qu[0]=P.toString()),P=Qu);for(let S=0;S<P.length;S++){const j=Ju(C,P[S],d||l.handleEvent,!1,l.h||l);if(!j)break;l.g[j.key]=j}l=a.J?Gu(a.J):{},a.u?(a.v||(a.v="POST"),l["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.B,a.v,a.u,l)):(a.v="GET",a.g.ea(a.B,a.v,null,l)),ns(),up(a.i,a.v,a.B,a.l,a.S,a.u)}un.prototype.ba=function(a){a=a.target;const l=this.O;l&&hn(a)==3?l.j():this.Y(a)},un.prototype.Y=function(a){try{if(a==this.g)e:{const se=hn(this.g),Me=this.g.ya(),pe=this.g.ca();if(!(se<3)&&(se!=3||this.g&&(this.h.h||this.g.la()||Ac(this.g)))){this.K||se!=4||Me==7||(Me==8||pe<=0?ns(3):ns(2)),_a(this);var l=this.g.ca();this.X=l;var C=fp(this);if(this.o=l==200,cp(this.i,this.v,this.B,this.l,this.S,se,l),this.o){if(this.U&&!this.L){t:{if(this.g){var d,P=this.g;if((d=P.g?P.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!_(d)){var S=d;break t}}S=null}if(a=S)Ir(this.i,this.l,a,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Da(this,a);else{this.o=!1,this.m=3,Ze(12),Wn(this),os(this);break e}}if(this.R){a=!0;let Ue;for(;!this.K&&this.C<C.length;)if(Ue=dp(this,C),Ue==ma){se==4&&(this.m=4,Ze(14),a=!1),Ir(this.i,this.l,null,"[Incomplete Response]");break}else if(Ue==ic){this.m=4,Ze(15),Ir(this.i,this.l,C,"[Invalid Chunk]"),a=!1;break}else Ir(this.i,this.l,Ue,null),Da(this,Ue);if(ac(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),se!=4||C.length!=0||this.h.h||(this.m=1,Ze(16),a=!1),this.o=this.o&&a,!a)Ir(this.i,this.l,C,"[Invalid Chunked Response]"),Wn(this),os(this);else if(C.length>0&&!this.W){this.W=!0;var j=this.j;j.g==this&&j.aa&&!j.P&&(j.j.info("Great, no buffering proxy detected. Bytes received: "+C.length),Pa(j),j.P=!0,Ze(11))}}else Ir(this.i,this.l,C,null),Da(this,C);se==4&&Wn(this),this.o&&!this.K&&(se==4?Nc(this.j,this):(this.o=!1,Ri(this)))}else Pp(this.g),l==400&&C.indexOf("Unknown SID")>0?(this.m=3,Ze(12)):(this.m=0,Ze(13)),Wn(this),os(this)}}}catch{}finally{}};function fp(a){if(!ac(a))return a.g.la();const l=Ac(a.g);if(l==="")return"";let C="";const d=l.length,P=hn(a.g)==4;if(!a.h.i){if(typeof TextDecoder>"u")return Wn(a),os(a),"";a.h.i=new o.TextDecoder}for(let S=0;S<d;S++)a.h.h=!0,C+=a.h.i.decode(l[S],{stream:!(P&&S==d-1)});return l.length=0,a.h.g+=C,a.C=0,a.h.g}function ac(a){return a.g?a.v=="GET"&&a.M!=2&&a.j.Aa:!1}function dp(a,l){var C=a.C,d=l.indexOf(`
`,C);return d==-1?ma:(C=Number(l.substring(C,d)),isNaN(C)?ic:(d+=1,d+C>l.length?ma:(l=l.slice(d,d+C),a.C=d+C,l)))}un.prototype.cancel=function(){this.K=!0,Wn(this)};function Ri(a){a.T=Date.now()+a.H,Bc(a,a.H)}function Bc(a,l){if(a.D!=null)throw Error("WatchDog timer not null");a.D=rs(c(a.aa,a),l)}function _a(a){a.D&&(o.clearTimeout(a.D),a.D=null)}un.prototype.aa=function(){this.D=null;const a=Date.now();a-this.T>=0?(lp(this.i,this.B),this.M!=2&&(ns(),Ze(17)),Wn(this),this.m=2,os(this)):Bc(this,this.T-a)};function os(a){a.j.I==0||a.K||Nc(a.j,a)}function Wn(a){_a(a);var l=a.O;l&&typeof l.dispose=="function"&&l.dispose(),a.O=null,Wu(a.V),a.g&&(l=a.g,a.g=null,l.abort(),l.dispose())}function Da(a,l){try{var C=a.j;if(C.I!=0&&(C.g==a||wa(C.h,a))){if(!a.L&&wa(C.h,a)&&C.I==3){try{var d=C.Ba.g.parse(l)}catch{d=null}if(Array.isArray(d)&&d.length==3){var P=d;if(P[0]==0){e:if(!C.v){if(C.g)if(C.g.F+3e3<a.F)Ni(C),Si(C);else break e;va(C),Ze(18)}}else C.xa=P[1],0<C.xa-C.K&&P[2]<37500&&C.F&&C.A==0&&!C.C&&(C.C=rs(c(C.Va,C),6e3));lc(C.h)<=1&&C.ta&&(C.ta=void 0)}else Yn(C,11)}else if((a.L||C.g==a)&&Ni(C),!_(l))for(P=C.Ba.g.parse(l),l=0;l<P.length;l++){let pe=P[l];const Ue=pe[0];if(!(Ue<=C.K))if(C.K=Ue,pe=pe[1],C.I==2)if(pe[0]=="c"){C.M=pe[1],C.ba=pe[2];const Ot=pe[3];Ot!=null&&(C.ka=Ot,C.j.info("VER="+C.ka));const Xn=pe[4];Xn!=null&&(C.za=Xn,C.j.info("SVER="+C.za));const Cn=pe[5];Cn!=null&&typeof Cn=="number"&&Cn>0&&(d=1.5*Cn,C.O=d,C.j.info("backChannelRequestTimeoutMs_="+d)),d=C;const fn=a.g;if(fn){const Li=fn.g?fn.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Li){var S=d.h;S.g||Li.indexOf("spdy")==-1&&Li.indexOf("quic")==-1&&Li.indexOf("h2")==-1||(S.j=S.l,S.g=new Set,S.h&&(Ia(S,S.h),S.h=null))}if(d.G){const ba=fn.g?fn.g.getResponseHeader("X-HTTP-Session-Id"):null;ba&&(d.wa=ba,De(d.J,d.G,ba))}}C.I=3,C.l&&C.l.ra(),C.aa&&(C.T=Date.now()-a.F,C.j.info("Handshake RTT: "+C.T+"ms")),d=C;var j=a;if(d.na=kc(d,d.L?d.ba:null,d.W),j.L){hc(d.h,j);var se=j,Me=d.O;Me&&(se.H=Me),se.D&&(_a(se),Ri(se)),d.g=j}else Sc(d);C.i.length>0&&Oi(C)}else pe[0]!="stop"&&pe[0]!="close"||Yn(C,7);else C.I==3&&(pe[0]=="stop"||pe[0]=="close"?pe[0]=="stop"?Yn(C,7):Ra(C):pe[0]!="noop"&&C.l&&C.l.qa(pe),C.A=0)}}ns(4)}catch{}}var pp=class{constructor(a,l){this.g=a,this.map=l}};function uc(a){this.l=a||10,o.PerformanceNavigationTiming?(a=o.performance.getEntriesByType("navigation"),a=a.length>0&&(a[0].nextHopProtocol=="hq"||a[0].nextHopProtocol=="h2")):a=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=a?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function cc(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function lc(a){return a.h?1:a.g?a.g.size:0}function wa(a,l){return a.h?a.h==l:a.g?a.g.has(l):!1}function Ia(a,l){a.g?a.g.add(l):a.h=l}function hc(a,l){a.h&&a.h==l?a.h=null:a.g&&a.g.has(l)&&a.g.delete(l)}uc.prototype.cancel=function(){if(this.i=Cc(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const a of this.g.values())a.cancel();this.g.clear()}};function Cc(a){if(a.h!=null)return a.i.concat(a.h.G);if(a.g!=null&&a.g.size!==0){let l=a.i;for(const C of a.g.values())l=l.concat(C.G);return l}return w(a.i)}var fc=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function gp(a,l){if(a){a=a.split("&");for(let C=0;C<a.length;C++){const d=a[C].indexOf("=");let P,S=null;d>=0?(P=a[C].substring(0,d),S=a[C].substring(d+1)):P=a[C],l(P,S?decodeURIComponent(S.replace(/\+/g," ")):"")}}}function cn(a){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let l;a instanceof cn?(this.l=a.l,as(this,a.j),this.o=a.o,this.g=a.g,Bs(this,a.u),this.h=a.h,ya(this,_c(a.i)),this.m=a.m):a&&(l=String(a).match(fc))?(this.l=!1,as(this,l[1]||"",!0),this.o=us(l[2]||""),this.g=us(l[3]||"",!0),Bs(this,l[4]),this.h=us(l[5]||"",!0),ya(this,l[6]||"",!0),this.m=us(l[7]||"")):(this.l=!1,this.i=new ls(null,this.l))}cn.prototype.toString=function(){const a=[];var l=this.j;l&&a.push(cs(l,dc,!0),":");var C=this.g;return(C||l=="file")&&(a.push("//"),(l=this.o)&&a.push(cs(l,dc,!0),"@"),a.push(is(C).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),C=this.u,C!=null&&a.push(":",String(C))),(C=this.h)&&(this.g&&C.charAt(0)!="/"&&a.push("/"),a.push(cs(C,C.charAt(0)=="/"?_p:Ep,!0))),(C=this.i.toString())&&a.push("?",C),(C=this.m)&&a.push("#",cs(C,wp)),a.join("")},cn.prototype.resolve=function(a){const l=St(this);let C=!!a.j;C?as(l,a.j):C=!!a.o,C?l.o=a.o:C=!!a.g,C?l.g=a.g:C=a.u!=null;var d=a.h;if(C)Bs(l,a.u);else if(C=!!a.h){if(d.charAt(0)!="/")if(this.g&&!this.h)d="/"+d;else{var P=l.h.lastIndexOf("/");P!=-1&&(d=l.h.slice(0,P+1)+d)}if(P=d,P==".."||P==".")d="";else if(P.indexOf("./")!=-1||P.indexOf("/.")!=-1){d=P.lastIndexOf("/",0)==0,P=P.split("/");const S=[];for(let j=0;j<P.length;){const se=P[j++];se=="."?d&&j==P.length&&S.push(""):se==".."?((S.length>1||S.length==1&&S[0]!="")&&S.pop(),d&&j==P.length&&S.push("")):(S.push(se),d=!0)}d=S.join("/")}else d=P}return C?l.h=d:C=a.i.toString()!=="",C?ya(l,_c(a.i)):C=!!a.m,C&&(l.m=a.m),l};function St(a){return new cn(a)}function as(a,l,C){a.j=C?us(l,!0):l,a.j&&(a.j=a.j.replace(/:$/,""))}function Bs(a,l){if(l){if(l=Number(l),isNaN(l)||l<0)throw Error("Bad port number "+l);a.u=l}else a.u=null}function ya(a,l,C){l instanceof ls?(a.i=l,Ip(a.i,a.l)):(C||(l=cs(l,Dp)),a.i=new ls(l,a.l))}function De(a,l,C){a.i.set(l,C)}function vi(a){return De(a,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),a}function us(a,l){return a?l?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function cs(a,l,C){return typeof a=="string"?(a=encodeURI(a).replace(l,mp),C&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function mp(a){return a=a.charCodeAt(0),"%"+(a>>4&15).toString(16)+(a&15).toString(16)}var dc=/[#\/\?@]/g,Ep=/[#\?:]/g,_p=/[#\?]/g,Dp=/[#\?@]/g,wp=/#/g;function ls(a,l){this.h=this.g=null,this.i=a||null,this.j=!!l}function $n(a){a.g||(a.g=new Map,a.h=0,a.i&&gp(a.i,function(l,C){a.add(decodeURIComponent(l.replace(/\+/g," ")),C)}))}r=ls.prototype,r.add=function(a,l){$n(this),this.i=null,a=yr(this,a);let C=this.g.get(a);return C||this.g.set(a,C=[]),C.push(l),this.h+=1,this};function pc(a,l){$n(a),l=yr(a,l),a.g.has(l)&&(a.i=null,a.h-=a.g.get(l).length,a.g.delete(l))}function gc(a,l){return $n(a),l=yr(a,l),a.g.has(l)}r.forEach=function(a,l){$n(this),this.g.forEach(function(C,d){C.forEach(function(P){a.call(l,P,d,this)},this)},this)};function mc(a,l){$n(a);let C=[];if(typeof l=="string")gc(a,l)&&(C=C.concat(a.g.get(yr(a,l))));else for(a=Array.from(a.g.values()),l=0;l<a.length;l++)C=C.concat(a[l]);return C}r.set=function(a,l){return $n(this),this.i=null,a=yr(this,a),gc(this,a)&&(this.h-=this.g.get(a).length),this.g.set(a,[l]),this.h+=1,this},r.get=function(a,l){return a?(a=mc(this,a),a.length>0?String(a[0]):l):l};function Ec(a,l,C){pc(a,l),C.length>0&&(a.i=null,a.g.set(yr(a,l),w(C)),a.h+=C.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const a=[],l=Array.from(this.g.keys());for(let d=0;d<l.length;d++){var C=l[d];const P=is(C);C=mc(this,C);for(let S=0;S<C.length;S++){let j=P;C[S]!==""&&(j+="="+is(C[S])),a.push(j)}}return this.i=a.join("&")};function _c(a){const l=new ls;return l.i=a.i,a.g&&(l.g=new Map(a.g),l.h=a.h),l}function yr(a,l){return l=String(l),a.j&&(l=l.toLowerCase()),l}function Ip(a,l){l&&!a.j&&($n(a),a.i=null,a.g.forEach(function(C,d){const P=d.toLowerCase();d!=P&&(pc(this,d),Ec(this,P,C))},a)),a.j=l}function yp(a,l){const C=new ss;if(o.Image){const d=new Image;d.onload=h(ln,C,"TestLoadImage: loaded",!0,l,d),d.onerror=h(ln,C,"TestLoadImage: error",!1,l,d),d.onabort=h(ln,C,"TestLoadImage: abort",!1,l,d),d.ontimeout=h(ln,C,"TestLoadImage: timeout",!1,l,d),o.setTimeout(function(){d.ontimeout&&d.ontimeout()},1e4),d.src=a}else l(!1)}function Tp(a,l){const C=new ss,d=new AbortController,P=setTimeout(()=>{d.abort(),ln(C,"TestPingServer: timeout",!1,l)},1e4);fetch(a,{signal:d.signal}).then(S=>{clearTimeout(P),S.ok?ln(C,"TestPingServer: ok",!0,l):ln(C,"TestPingServer: server error",!1,l)}).catch(()=>{clearTimeout(P),ln(C,"TestPingServer: error",!1,l)})}function ln(a,l,C,d,P){try{P&&(P.onload=null,P.onerror=null,P.onabort=null,P.ontimeout=null),d(C)}catch{}}function Ap(){this.g=new Bp}function Ta(a){this.i=a.Sb||null,this.h=a.ab||!1}f(Ta,$u),Ta.prototype.g=function(){return new Pi(this.i,this.h)};function Pi(a,l){Ke.call(this),this.H=a,this.o=l,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}f(Pi,Ke),r=Pi.prototype,r.open=function(a,l){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=a,this.D=l,this.readyState=1,Cs(this)},r.send=function(a){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const l={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};a&&(l.body=a),(this.H||o).fetch(new Request(this.D,l)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,hs(this)),this.readyState=0},r.Pa=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,Cs(this)),this.g&&(this.readyState=3,Cs(this),this.g)))if(this.responseType==="arraybuffer")a.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in a){if(this.j=a.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Dc(this)}else a.text().then(this.Oa.bind(this),this.ga.bind(this))};function Dc(a){a.j.read().then(a.Ma.bind(a)).catch(a.ga.bind(a))}r.Ma=function(a){if(this.g){if(this.o&&a.value)this.response.push(a.value);else if(!this.o){var l=a.value?a.value:new Uint8Array(0);(l=this.B.decode(l,{stream:!a.done}))&&(this.response=this.responseText+=l)}a.done?hs(this):Cs(this),this.readyState==3&&Dc(this)}},r.Oa=function(a){this.g&&(this.response=this.responseText=a,hs(this))},r.Na=function(a){this.g&&(this.response=a,hs(this))},r.ga=function(){this.g&&hs(this)};function hs(a){a.readyState=4,a.l=null,a.j=null,a.B=null,Cs(a)}r.setRequestHeader=function(a,l){this.A.append(a,l)},r.getResponseHeader=function(a){return this.h&&this.h.get(a.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const a=[],l=this.h.entries();for(var C=l.next();!C.done;)C=C.value,a.push(C[0]+": "+C[1]),C=l.next();return a.join(`\r
`)};function Cs(a){a.onreadystatechange&&a.onreadystatechange.call(a)}Object.defineProperty(Pi.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(a){this.m=a?"include":"same-origin"}});function wc(a){let l="";return wi(a,function(C,d){l+=d,l+=":",l+=C,l+=`\r
`}),l}function Aa(a,l,C){e:{for(d in C){var d=!1;break e}d=!0}d||(C=wc(C),typeof a=="string"?C!=null&&is(C):De(a,l,C))}function Pe(a){Ke.call(this),this.headers=new Map,this.L=a||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}f(Pe,Ke);var Rp=/^https?$/i,vp=["POST","PUT"];r=Pe.prototype,r.Fa=function(a){this.H=a},r.ea=function(a,l,C,d){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+a);l=l?l.toUpperCase():"GET",this.D=a,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():rc.g(),this.g.onreadystatechange=p(c(this.Ca,this));try{this.B=!0,this.g.open(l,String(a),!0),this.B=!1}catch(S){Ic(this,S);return}if(a=C||"",C=new Map(this.headers),d)if(Object.getPrototypeOf(d)===Object.prototype)for(var P in d)C.set(P,d[P]);else if(typeof d.keys=="function"&&typeof d.get=="function")for(const S of d.keys())C.set(S,d.get(S));else throw Error("Unknown input type for opt_headers: "+String(d));d=Array.from(C.keys()).find(S=>S.toLowerCase()=="content-type"),P=o.FormData&&a instanceof o.FormData,!(Array.prototype.indexOf.call(vp,l,void 0)>=0)||d||P||C.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[S,j]of C)this.g.setRequestHeader(S,j);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(a),this.v=!1}catch(S){Ic(this,S)}};function Ic(a,l){a.h=!1,a.g&&(a.j=!0,a.g.abort(),a.j=!1),a.l=l,a.o=5,yc(a),bi(a)}function yc(a){a.A||(a.A=!0,Xe(a,"complete"),Xe(a,"error"))}r.abort=function(a){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=a||7,Xe(this,"complete"),Xe(this,"abort"),bi(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),bi(this,!0)),Pe.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?Tc(this):this.Xa())},r.Xa=function(){Tc(this)};function Tc(a){if(a.h&&typeof i<"u"){if(a.v&&hn(a)==4)setTimeout(a.Ca.bind(a),0);else if(Xe(a,"readystatechange"),hn(a)==4){a.h=!1;try{const S=a.ca();e:switch(S){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var l=!0;break e;default:l=!1}var C;if(!(C=l)){var d;if(d=S===0){let j=String(a.D).match(fc)[1]||null;!j&&o.self&&o.self.location&&(j=o.self.location.protocol.slice(0,-1)),d=!Rp.test(j?j.toLowerCase():"")}C=d}if(C)Xe(a,"complete"),Xe(a,"success");else{a.o=6;try{var P=hn(a)>2?a.g.statusText:""}catch{P=""}a.l=P+" ["+a.ca()+"]",yc(a)}}finally{bi(a)}}}}function bi(a,l){if(a.g){a.m&&(clearTimeout(a.m),a.m=null);const C=a.g;a.g=null,l||Xe(a,"ready");try{C.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function hn(a){return a.g?a.g.readyState:0}r.ca=function(){try{return hn(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(a){if(this.g){var l=this.g.responseText;return a&&l.indexOf(a)==0&&(l=l.substring(a.length)),ap(l)}};function Ac(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.F){case"":case"text":return a.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch{return null}}function Pp(a){const l={};a=(a.g&&hn(a)>=2&&a.g.getAllResponseHeaders()||"").split(`\r
`);for(let d=0;d<a.length;d++){if(_(a[d]))continue;var C=Cp(a[d]);const P=C[0];if(C=C[1],typeof C!="string")continue;C=C.trim();const S=l[P]||[];l[P]=S,S.push(C)}tp(l,function(d){return d.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function fs(a,l,C){return C&&C.internalChannelParams&&C.internalChannelParams[a]||l}function Rc(a){this.za=0,this.i=[],this.j=new ss,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=fs("failFast",!1,a),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=fs("baseRetryDelayMs",5e3,a),this.Za=fs("retryDelaySeedMs",1e4,a),this.Ta=fs("forwardChannelMaxRetries",2,a),this.va=fs("forwardChannelRequestTimeoutMs",2e4,a),this.ma=a&&a.xmlHttpFactory||void 0,this.Ua=a&&a.Rb||void 0,this.Aa=a&&a.useFetchStreams||!1,this.O=void 0,this.L=a&&a.supportsCrossDomainXhr||!1,this.M="",this.h=new uc(a&&a.concurrentRequestLimit),this.Ba=new Ap,this.S=a&&a.fastHandshake||!1,this.R=a&&a.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=a&&a.Pb||!1,a&&a.ua&&this.j.ua(),a&&a.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&a&&a.detectBufferingProxy||!1,this.ia=void 0,a&&a.longPollingTimeout&&a.longPollingTimeout>0&&(this.ia=a.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=Rc.prototype,r.ka=8,r.I=1,r.connect=function(a,l,C,d){Ze(0),this.W=a,this.H=l||{},C&&d!==void 0&&(this.H.OSID=C,this.H.OAID=d),this.F=this.X,this.J=kc(this,null,this.W),Oi(this)};function Ra(a){if(vc(a),a.I==3){var l=a.V++,C=St(a.J);if(De(C,"SID",a.M),De(C,"RID",l),De(C,"TYPE","terminate"),ds(a,C),l=new un(a,a.j,l),l.M=2,l.A=vi(St(C)),C=!1,o.navigator&&o.navigator.sendBeacon)try{C=o.navigator.sendBeacon(l.A.toString(),"")}catch{}!C&&o.Image&&(new Image().src=l.A,C=!0),C||(l.g=Vc(l.j,null),l.g.ea(l.A)),l.F=Date.now(),Ri(l)}Lc(a)}function Si(a){a.g&&(Pa(a),a.g.cancel(),a.g=null)}function vc(a){Si(a),a.v&&(o.clearTimeout(a.v),a.v=null),Ni(a),a.h.cancel(),a.m&&(typeof a.m=="number"&&o.clearTimeout(a.m),a.m=null)}function Oi(a){if(!cc(a.h)&&!a.m){a.m=!0;var l=a.Ea;Ae||E(),Ee||(Ae(),Ee=!0),A.add(l,a),a.D=0}}function bp(a,l){return lc(a.h)>=a.h.j-(a.m?1:0)?!1:a.m?(a.i=l.G.concat(a.i),!0):a.I==1||a.I==2||a.D>=(a.Sa?0:a.Ta)?!1:(a.m=rs(c(a.Ea,a,l),Fc(a,a.D)),a.D++,!0)}r.Ea=function(a){if(this.m)if(this.m=null,this.I==1){if(!a){this.V=Math.floor(Math.random()*1e5),a=this.V++;const P=new un(this,this.j,a);let S=this.o;if(this.U&&(S?(S=Gu(S),Hu(S,this.U)):S=this.U),this.u!==null||this.R||(P.J=S,S=null),this.S)e:{for(var l=0,C=0;C<this.i.length;C++){t:{var d=this.i[C];if("__data__"in d.map&&(d=d.map.__data__,typeof d=="string")){d=d.length;break t}d=void 0}if(d===void 0)break;if(l+=d,l>4096){l=C;break e}if(l===4096||C===this.i.length-1){l=C+1;break e}}l=1e3}else l=1e3;l=bc(this,P,l),C=St(this.J),De(C,"RID",a),De(C,"CVER",22),this.G&&De(C,"X-HTTP-Session-Id",this.G),ds(this,C),S&&(this.R?l="headers="+is(wc(S))+"&"+l:this.u&&Aa(C,this.u,S)),Ia(this.h,P),this.Ra&&De(C,"TYPE","init"),this.S?(De(C,"$req",l),De(C,"SID","null"),P.U=!0,Ea(P,C,null)):Ea(P,C,l),this.I=2}}else this.I==3&&(a?Pc(this,a):this.i.length==0||cc(this.h)||Pc(this))};function Pc(a,l){var C;l?C=l.l:C=a.V++;const d=St(a.J);De(d,"SID",a.M),De(d,"RID",C),De(d,"AID",a.K),ds(a,d),a.u&&a.o&&Aa(d,a.u,a.o),C=new un(a,a.j,C,a.D+1),a.u===null&&(C.J=a.o),l&&(a.i=l.G.concat(a.i)),l=bc(a,C,1e3),C.H=Math.round(a.va*.5)+Math.round(a.va*.5*Math.random()),Ia(a.h,C),Ea(C,d,l)}function ds(a,l){a.H&&wi(a.H,function(C,d){De(l,d,C)}),a.l&&wi({},function(C,d){De(l,d,C)})}function bc(a,l,C){C=Math.min(a.i.length,C);const d=a.l?c(a.l.Ka,a.l,a):null;e:{var P=a.i;let se=-1;for(;;){const Me=["count="+C];se==-1?C>0?(se=P[0].g,Me.push("ofs="+se)):se=0:Me.push("ofs="+se);let pe=!0;for(let Ue=0;Ue<C;Ue++){var S=P[Ue].g;const Ot=P[Ue].map;if(S-=se,S<0)se=Math.max(0,P[Ue].g-100),pe=!1;else try{S="req"+S+"_"||"";try{var j=Ot instanceof Map?Ot:Object.entries(Ot);for(const[Xn,Cn]of j){let fn=Cn;B(Cn)&&(fn=fa(Cn)),Me.push(S+Xn+"="+encodeURIComponent(fn))}}catch(Xn){throw Me.push(S+"type="+encodeURIComponent("_badmap")),Xn}}catch{d&&d(Ot)}}if(pe){j=Me.join("&");break e}}j=void 0}return a=a.i.splice(0,C),l.G=a,j}function Sc(a){if(!a.g&&!a.v){a.Y=1;var l=a.Da;Ae||E(),Ee||(Ae(),Ee=!0),A.add(l,a),a.A=0}}function va(a){return a.g||a.v||a.A>=3?!1:(a.Y++,a.v=rs(c(a.Da,a),Fc(a,a.A)),a.A++,!0)}r.Da=function(){if(this.v=null,Oc(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var a=4*this.T;this.j.info("BP detection timer enabled: "+a),this.B=rs(c(this.Wa,this),a)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,Ze(10),Si(this),Oc(this))};function Pa(a){a.B!=null&&(o.clearTimeout(a.B),a.B=null)}function Oc(a){a.g=new un(a,a.j,"rpc",a.Y),a.u===null&&(a.g.J=a.o),a.g.P=0;var l=St(a.na);De(l,"RID","rpc"),De(l,"SID",a.M),De(l,"AID",a.K),De(l,"CI",a.F?"0":"1"),!a.F&&a.ia&&De(l,"TO",a.ia),De(l,"TYPE","xmlhttp"),ds(a,l),a.u&&a.o&&Aa(l,a.u,a.o),a.O&&(a.g.H=a.O);var C=a.g;a=a.ba,C.M=1,C.A=vi(St(l)),C.u=null,C.R=!0,oc(C,a)}r.Va=function(){this.C!=null&&(this.C=null,Si(this),va(this),Ze(19))};function Ni(a){a.C!=null&&(o.clearTimeout(a.C),a.C=null)}function Nc(a,l){var C=null;if(a.g==l){Ni(a),Pa(a),a.g=null;var d=2}else if(wa(a.h,l))C=l.G,hc(a.h,l),d=1;else return;if(a.I!=0){if(l.o)if(d==1){C=l.u?l.u.length:0,l=Date.now()-l.F;var P=a.D;d=Ti(),Xe(d,new tc(d,C)),Oi(a)}else Sc(a);else if(P=l.m,P==3||P==0&&l.X>0||!(d==1&&bp(a,l)||d==2&&va(a)))switch(C&&C.length>0&&(l=a.h,l.i=l.i.concat(C)),P){case 1:Yn(a,5);break;case 4:Yn(a,10);break;case 3:Yn(a,6);break;default:Yn(a,2)}}}function Fc(a,l){let C=a.Qa+Math.floor(Math.random()*a.Za);return a.isActive()||(C*=2),C*l}function Yn(a,l){if(a.j.info("Error code "+l),l==2){var C=c(a.bb,a),d=a.Ua;const P=!d;d=new cn(d||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||as(d,"https"),vi(d),P?yp(d.toString(),C):Tp(d.toString(),C)}else Ze(2);a.I=0,a.l&&a.l.pa(l),Lc(a),vc(a)}r.bb=function(a){a?(this.j.info("Successfully pinged google.com"),Ze(2)):(this.j.info("Failed to ping google.com"),Ze(1))};function Lc(a){if(a.I=0,a.ja=[],a.l){const l=Cc(a.h);(l.length!=0||a.i.length!=0)&&(R(a.ja,l),R(a.ja,a.i),a.h.i.length=0,w(a.i),a.i.length=0),a.l.oa()}}function kc(a,l,C){var d=C instanceof cn?St(C):new cn(C);if(d.g!="")l&&(d.g=l+"."+d.g),Bs(d,d.u);else{var P=o.location;d=P.protocol,l=l?l+"."+P.hostname:P.hostname,P=+P.port;const S=new cn(null);d&&as(S,d),l&&(S.g=l),P&&Bs(S,P),C&&(S.h=C),d=S}return C=a.G,l=a.wa,C&&l&&De(d,C,l),De(d,"VER",a.ka),ds(a,d),d}function Vc(a,l,C){if(l&&!a.L)throw Error("Can't create secondary domain capable XhrIo object.");return l=a.Aa&&!a.ma?new Pe(new Ta({ab:C})):new Pe(a.ma),l.Fa(a.L),l}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function xc(){}r=xc.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function Fi(){}Fi.prototype.g=function(a,l){return new dt(a,l)};function dt(a,l){Ke.call(this),this.g=new Rc(l),this.l=a,this.h=l&&l.messageUrlParams||null,a=l&&l.messageHeaders||null,l&&l.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"}),this.g.o=a,a=l&&l.initMessageHeaders||null,l&&l.messageContentType&&(a?a["X-WebChannel-Content-Type"]=l.messageContentType:a={"X-WebChannel-Content-Type":l.messageContentType}),l&&l.sa&&(a?a["X-WebChannel-Client-Profile"]=l.sa:a={"X-WebChannel-Client-Profile":l.sa}),this.g.U=a,(a=l&&l.Qb)&&!_(a)&&(this.g.u=a),this.A=l&&l.supportsCrossDomainXhr||!1,this.v=l&&l.sendRawJson||!1,(l=l&&l.httpSessionIdParam)&&!_(l)&&(this.g.G=l,a=this.h,a!==null&&l in a&&(a=this.h,l in a&&delete a[l])),this.j=new Tr(this)}f(dt,Ke),dt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},dt.prototype.close=function(){Ra(this.g)},dt.prototype.o=function(a){var l=this.g;if(typeof a=="string"){var C={};C.__data__=a,a=C}else this.v&&(C={},C.__data__=fa(a),a=C);l.i.push(new pp(l.Ya++,a)),l.I==3&&Oi(l)},dt.prototype.N=function(){this.g.l=null,delete this.j,Ra(this.g),delete this.g,dt.Z.N.call(this)};function Mc(a){da.call(this),a.__headers__&&(this.headers=a.__headers__,this.statusCode=a.__status__,delete a.__headers__,delete a.__status__);var l=a.__sm__;if(l){e:{for(const C in l){a=C;break e}a=void 0}(this.i=a)&&(a=this.i,l=l!==null&&a in l?l[a]:void 0),this.data=l}else this.data=a}f(Mc,da);function Gc(){pa.call(this),this.status=1}f(Gc,pa);function Tr(a){this.g=a}f(Tr,xc),Tr.prototype.ra=function(){Xe(this.g,"a")},Tr.prototype.qa=function(a){Xe(this.g,new Mc(a))},Tr.prototype.pa=function(a){Xe(this.g,new Gc)},Tr.prototype.oa=function(){Xe(this.g,"b")},Fi.prototype.createWebChannel=Fi.prototype.g,dt.prototype.send=dt.prototype.o,dt.prototype.open=dt.prototype.m,dt.prototype.close=dt.prototype.close,kC=function(){return new Fi},LC=function(){return Ti()},FC=Qn,iB={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Ai.NO_ERROR=0,Ai.TIMEOUT=8,Ai.HTTP_ERROR=6,to=Ai,nc.COMPLETE="complete",NC=nc,Yu.EventType=ts,ts.OPEN="a",ts.CLOSE="b",ts.ERROR="c",ts.MESSAGE="d",Ke.prototype.listen=Ke.prototype.J,Es=Yu,Pe.prototype.listenOnce=Pe.prototype.K,Pe.prototype.getLastError=Pe.prototype.Ha,Pe.prototype.getLastErrorCode=Pe.prototype.ya,Pe.prototype.getStatus=Pe.prototype.ca,Pe.prototype.getResponseJson=Pe.prototype.La,Pe.prototype.getResponseText=Pe.prototype.la,Pe.prototype.send=Pe.prototype.ea,Pe.prototype.setWithCredentials=Pe.prototype.Fa,OC=Pe}).apply(typeof Vi<"u"?Vi:typeof self<"u"?self:typeof window<"u"?window:{});/*!
* re2js
* RE2JS is the JavaScript port of RE2, a regular expression engine that provides linear time matching
*
* @version v2.8.6
* @author Oleksii Vasyliev
* @homepage https://github.com/le0pard/re2js#readme
* @repository github:le0pard/re2js
* @license MIT
*/var ge,x=(ge=class{},G(ge,"FOLD_CASE",1),G(ge,"LITERAL",2),G(ge,"CLASS_NL",4),G(ge,"DOT_NL",8),G(ge,"ONE_LINE",16),G(ge,"NON_GREEDY",32),G(ge,"PERL_X",64),G(ge,"UNICODE_GROUPS",128),G(ge,"WAS_DOLLAR",256),G(ge,"LOOKBEHIND",512),G(ge,"MATCH_NL",ge.CLASS_NL|ge.DOT_NL),G(ge,"PERL",ge.CLASS_NL|ge.ONE_LINE|ge.PERL_X|ge.UNICODE_GROUPS),G(ge,"POSIX",0),G(ge,"UNANCHORED",0),G(ge,"ANCHOR_START",1),G(ge,"ANCHOR_BOTH",2),ge);const Ar={CASE_INSENSITIVE:1,DOTALL:2,MULTILINE:4,DISABLE_UNICODE_GROUPS:8,LONGEST_MATCH:16,LOOKBEHINDS:512},Vs=128,oB=new Int32Array(Vs),aB=new Int32Array(Vs),xi=65535;for(let r=0;r<Vs;r++)r>=97&&r<=122?oB[r]=r-32:oB[r]=r,r>=65&&r<=90?aB[r]=r+32:aB[r]=r;var Ya,O=(Ya=class{static toUpperCase(r){if(r<Vs)return oB[r];const e=String.fromCodePoint(r).toUpperCase(),t=e.codePointAt(0)>xi?2:1;if(e.length>t)return r;const n=String.fromCodePoint(e.codePointAt(0)).toLowerCase(),s=n.codePointAt(0)>xi?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}static toLowerCase(r){if(r<Vs)return aB[r];const e=String.fromCodePoint(r).toLowerCase(),t=e.codePointAt(0)>xi?2:1;if(e.length>t)return r;const n=String.fromCodePoint(e.codePointAt(0)).toUpperCase(),s=n.codePointAt(0)>xi?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}},G(Ya,"CODES",new Map([["\x07",7],["\b",8],["	",9],[`
`,10],["\v",11],["\f",12],["\r",13],[" ",32],['"',34],["$",36],["&",38],["'",39],["(",40],[")",41],["*",42],["+",43],["-",45],[".",46],["0",48],["1",49],["2",50],["3",51],["4",52],["5",53],["6",54],["7",55],["8",56],["9",57],[":",58],["<",60],[">",62],["?",63],["A",65],["B",66],["C",67],["F",70],["P",80],["Q",81],["U",85],["Z",90],["[",91],["\\",92],["]",93],["^",94],["_",95],["`",96],["a",97],["b",98],["f",102],["i",105],["m",109],["n",110],["r",114],["s",115],["t",116],["v",118],["x",120],["z",122],["{",123],["|",124],["}",125]])),Ya),g=class{constructor(r,e=!1){this.data=r,this.isStride1=e,this.SIZE=e?2:3}getLo(r){return this.data[r*this.SIZE]}getHi(r){return this.data[r*this.SIZE+1]}getStride(r){return this.isStride1?1:this.data[r*this.SIZE+2]}get length(){return this.data.length/this.SIZE}};const VC=new Uint8Array(256);for(let r=0,e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";r<64;r++)VC[e.charCodeAt(r)]=r;const xC=r=>{const e=[];let t=0,n=0;for(let s=0;s<r.length;s++){let i=VC[r.charCodeAt(s)];t|=(i&31)<<n,i&32?n+=5:(e.push(t),t=0,n=0)}return e},m=(r,e)=>{const t=xC(r),n=e?t.length/2:t.length/3,s=new Uint32Array(n*3);let i=0,o=0;for(let B=0;B<n;B++)i+=t[o++],s[B*3]=i,i+=t[o++],s[B*3+1]=i,s[B*3+2]=e?1:t[o++];return s},c_=r=>{const e=xC(r),t=new Map;let n=0;for(let s=0;s<e.length;s+=2){n+=e[s];const i=e[s+1],o=i>>>1^-(i&1);t.set(n,n+o)}return t};var Mi=class{constructor(r){this.initializer=r,this.cache=new Map}has(r){return r in this.initializer}get(r){if(this.cache.has(r))return this.cache.get(r);const e=this.initializer[r],t=e?e():null;return this.cache.set(r,t),t}},gn,Bt=(gn=class{static get CASE_ORBIT(){return this._CASE_ORBIT||(this._CASE_ORBIT=c_("rCgCIgCY+rQI4QiCuuBLgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCCgCBgCBgCBgCBgCBgCBgCB+7OB-BB-BB-BB-BB-BBskQB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BC-BB-BB-BB-BB-BB-BB-BByHBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBxHBCBBBCBBBCBBB3SBmMBkNBCBBBCBBB8MBCBBB6MB6MBCBBC+EB0MB2MBCBBB6MB+MBiGBmNBiNBCBBBmKBikzCBmNBqNBkIBsNBCBBBCBBBCBBB0NBCBBB0NDCBBB0NBCBBByNByNBCBBBCBBB2NBCBBDCBBCwDFCBCBDBCBCBDBCBCBDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB9EBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBCBDBCBBBhGBvDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBjICCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBH2iVBCBBBlKBwiVB+jVB+jVBCBBBlMBqEBuEBCBBBCBBBCBBBCBBBCBBB+hVB4hVB8hVBjNB7MC5MB5MCzMC1MB+0yCE5MB20yCC9MBu2yCBwyyCBo0yCChNBlNBo0yCBu-UBi0yCDlNC6-UBpNDrNIu+UDzNCm0yCBzNE0yyCBzNBpEBxNBxNBtEG1NLqxyCBkxyCnFoFrBCBBBCBBDCBBEkIBkIBkICoHHsCCqCBqCBqCCgEC+DB+DBmkOBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCC+BBgCBgCBgCBgCBgCBgCBgCBgCBrCBpCBpCBpCBmjOB-BB8BB-BB-BBgEB-BB-BByBBqgOBsDB-BBtwBB-BB-BB-BBsBBgDBCB-BB-BB-BBeB-BB-BB61OB-BB-BB-DB9DB9DBQB7DBmCE9CBrDBPBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBrFB-EBOBnHB3FB-FCCBBBNBCBBCjIBjIBjIBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB8kMB-BB6kMB-BB-BB-BB-BB-BB-BB-BB-BB-BBokMB-BB-BBkkMBkkMB-BB-BB-BB-BB-BB-BB-BB4jMB-BB-BB-BB-BB-BB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EBCBBBCBoiMBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBJCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBeBCBBBCBBBCBBBCBBBCBBBCBBBCBBBdBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDL-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-C64CgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOCgmOGgmODg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FDg8FBg8FBg8FhVg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBQBQBQBQBQBQDPBPBPBPBPBPjkC7mMB5mMBnmMBjmMBCBlmMB3lMBpiMBk8kCBCBBG-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FD-7FB-7FB-7F6FoglCEsuHRwjlCyDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCB0DBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBG1DD97OCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPEQCQCQCQCPCPCPCPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPB0EB0EBsFBsFBsFBsFBoGBoGBgIBgIBgHBgHB8HB8HDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQCSFPBPBzEBzEBRCxnOFSFrFBrFBrFBrFBREQBQClkOFPBPBnGBnGFQBQCljOCODPBPB-GB-GBNHSF-HB-HB7HB7HBRqJ53OE9tQBrmQH4Bc3BSgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfECBByZ0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzB34BgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CBCBBBt-UBruHBt+UB1iVBviVBCBBBCBBBCBBB3hVB5-UB9hVB7hVCCBBCCBBI9jVB9jVBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBICBBBCBBECBBN-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOC-lOG-lOzoeCBBBCBBBCBBBCBBBCBBBCBl8kCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBTCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBnECBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBKCBBBCBBBnglCBCBBBCBBBCBBBCBBBCBBECBBBvyyCDCBBBCBBBgDCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBn0yCB90yCB10yCBh0yCBn0yCCjxyCBzyyCBpxyCBg6BBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB-CBl0yCBvjlCBCBBBCBBBt2yCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBhkzCZCBB9a-5Bd-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCm6TCBB7gBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCH-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BmlBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvChDwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCFvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvC1DuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCCuCBuCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCCtCBtCk2BgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEO-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-D+CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCL-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-B74CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhrVgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BD1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BtxekCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjC")),this._CASE_ORBIT}static get Print(){return this._Print||(this._Print=new g(m("hB9CBjBLBCpWBDFBFGBCCCBSBCsMBClBBDxBBDCBC2BBJaBFFBSVBC-FBCvBBD6BBDkDBP6BBDwBBDOBCbBDCCBJBGfBIqCBCgFBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYBDCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPBLCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGBCCBCHBDBBDVBCGBCBBCEBDIBDBBDCBICBFBBCEBDRBLBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBGMBCCBCWBCPBDIBCCBCDBIBBCCBCBBDDBDJBIVBCCBCWBCJBCEBDIBCCBCDBIBBGCBCDBDJBCCBNMBCCBCyBBCCBCFBFPBDZBCCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBN5BBFcBmBBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDBhBnCBCjBBFmBBCjBBCOBCMBmBlGBCGGD4LBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBH1CBDFBD-TBCbBE4CBIVBKXBKTBNMBCCBCBBN9CBDJBHJBHNBCKBH4CBIqBBGlCBLeBCLBFLBFEEBoBBDEBMrBBFZBHKBE9BBDgCBCcBDKBHJBHNBDtBBDLBVsCBClFBJ7BBEOBE9BBGqBBDKBJqBBG1QBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBSXBJuBBSBBDaBCMBEhBBPgBBQrEBF5UBXKBWz4BBD9LBGsBBCGGD3BBIBBPXBKGBCGBCGBCGBCGBCGBCGBCGBC9DBjBZBC4CBN1GBbPBC+BBC1CBDmDBGqBBC9CBC1CBKvBBCszcBE2BBK7KBV3FBJ8GBV7BBEJBH3BBJlCBJLBHzDBMdBEtCBCKBFgBBC2BBKNBDJBDmDBZbBLFBDFBDFBKGBCGBC7BBF9DBDJBHj9KBNWBFwBBloItLBDpDBnBGBNEBGZBCEBCCCBCCBCCBoUBhBpBBHyBBCSBCDBFEBCmEBF9FBEFBDFBDFBDCBEGBCGBOBBDLBCZBCSBCBBCOBDNBjB6DBGCBFsBBE3CBCMBEwBwBBsBBjEcBEwBBQbBFjBBKdBGqBBGdBCkBBFNBrB9EBDJBHjBBFjBBFnBBJzBBMLBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBCnCBJIBxBSBCBBGgBBEaBGaBnB3BBFTBDxBBCBBGHBCCBCcBDCBFJBIIBI-BBhBmBBFLBK1BBEcBDaBGZBIDBNGBxCoCB4ByBBOyBBItBBJJBHlBBEcBJBBxGeBCpBBCCBDBBRFBJIBiBtBBJpBBXZBnBbBVWBKtCBFjBBK9BBCEBOYBIJBH0BBCRBJmBBK-CBCTBMRBCuBB-BGBCCCBCBCOBCKBH6BBGJBHDBCHBDBBDVBCGBCBBCEBCJBDBBDCBDHHGGBDGBEEBMJBCDDClBBCJBCDDCDBCJBCBBJBBe7CBCEBfnCBJJBnF1BBDlBBjBkCBMJBHMBU5BBHJBHTBdaBDOBFWB6F7BBlDyCBNHBDDDBGBCBBCdBCBBDLBKJBnCHBDtBBDKBcnCBJyCBOoCBIJB3CHB5ChBBPJBHIBCsBBCNBLcBEfBDVBCNBqCGBCBBCrBBECCBCCBHBJJBHFBCBBCkBBCBBCFBIJBHrBBFJB3HYBIQBCoBBEcB2CQQBwBBO6cBnDuDBCEBMjGBtyCiDBOvhBBRVBL68DBGmSB61G5BBn2B4RBIeBCJBFwCBCJBHdBDFBLlCBLJBCGBCUBGSBxN5BBnG6CBGYBDYBtBqCBF4BBIQBhCEBMGBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBDDBh7D8HBEzNBHWBQQBQtBBDWBKzDB9B1HBLmBBDpCBJvDBWlCB7DTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBD9VBQEBCOBxiBeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBENBDJBFBBhKeBS5BBGxOxOBoBB3GqBBFhGhGBdBCVBJBBhHGBCDBCBBCOBCkGBDPBqBrCBFJBFBByYjCBtC8BBjGDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBBvIrBBFjDBNOBDOBCOBCkBBLtFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBmgB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIBnkzVvHB",!1))),this._Print}static get Upper(){return this.CATEGORIES.get("Lu")}},G(gn,"_CASE_ORBIT",null),G(gn,"_Print",null),G(gn,"CATEGORIES",new Mi({C:()=>new g(m("AfBgDgBBOrWrWBHHBCBICCVuMuMnBBBzBBBE4B4BBGBcDBHQBXhGhGxBBB8BBBmDNB8BBByBBBQddBCCMEBhBGBsCiFiFJBBDBBXIICCBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBPMMBEB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKMMBDBbEByBPBDBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCB-FCBHBBHBBHBBECBIIIBLBDBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIB-BGGBLBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMBxhBPBXJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBF-6DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBrCHBxDUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIlkzVBxHvw-FB",!1)),Cc:()=>new g(m("AfgDgB",!0)),Cf:()=>new g(m("tFzqBzqBBEBXhGhGyBhMhMBxCxCs5D9-B9-BBDBbEByBEBCJBw03B6H6HBBBimEQQj7IPBhjiBDBwmFHBn0rYffB+CB",!1)),Cn:()=>new g(m("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBDBvzIBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-BB---BBB---BBB",!1)),Co:()=>new g(m("gg4B-nGh4hc9--BD9--B",!0)),Cs:()=>new g(m("gg2B--B",!0)),L:()=>new g(m("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICCiEEBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoCaBFDBuBqBBkBBBCiDBCQQBIIBLLBBBDRRCdBe4CBMZZBfBKBBFGGBUBFKKEYYBXBIKBGXBCGBRpBB7B1BBETTIJBQPBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNGB7BBBCCCBDBCXBCCCBIBCBBKDDBDBCWWBCBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNSSBkBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBkBFFkC4CBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBzC+C+CBtBBSHB3BdBOBBLrBBbjBBqBCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBhC1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBF1B1BB8zC8zCBjHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBxC2O2OBrBrBBDBGBBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBReBDlCByBIBDmDBDxCBVQBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBdRRBDBCJBLEBCoBBYCBCHBVWBEEEBwBBCEEBDDBDBDCCZCBDKBICBNFBDFBDFBKGBCGBCqBBCNBHyDBej9KBNWBFwBBloItLBDpDBnBGBNEBGCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBxB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOjBBnBbBKWB7HpBBHBBRFB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB1D-BBgBHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBqBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBGjCjCBLBhCBBCPPBNNB0mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBn7F0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFBmI9BBzEsBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCCBCBBCGBDEBKBBhHGBCDBCBBCOBCkGB8BjCBI1lB1lBBCBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),LC:()=>new g(m("hCZBHZB7BLLBVBCeBCiGBCDBFvGBDZBhGDBDBBECBCHHCCBCCCBSBCyCBCqEBJlFBClBBKoBB44ClBBCGGDqBBDCBhV1CBDFBjkCKBGqBBDCBhCrBBgCMBChBBmD1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGBmIFFDJBCEEBDBHGCBCBCFBFDDBCBGEBF1B1BB8zC8zCB6DBDmDBHDBEBBNlBBCGGzoetBBTbBnEtCBCWBEDBCsCBZBBE2Z2ZBpBBGIBIvCBh6TGBNEBqgBZBHZBmlBvCBhDjBBFjBB1DKBCOBCGBCBBCKBCOBCGBCBBk2ByBBOyBB+CVBLVB74C-BBhrV-BBhBYBDYBtpZ0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BJBCTBHFB2uCjCB",!1)),Ll:()=>new g(m("hDZB7BqBqBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDZBiGCCEEEBBBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBDCB5XFBjkCIBC2D2DBqBBgCMBChBBnD0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBBzIEEBEEcKFDBBJDBF2B2Bs1CvBBCEEBGCFCCBCCBEBGiDCBIICFFNlBBCGG0oesBCUaCoEMCBBBC+BCBGBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCbEE2ZqBBGIBIvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFB4vChBB",!1)),Lm:()=>new g(m("wVRBFLBPEBICCmEGG-OnHnHlFBBuIBBFgBgBKEEhFoFoF1mBgEgE2R72B72BsDkTkTxOFBvF+BBOjBjBBjBByVOORMBg-CBByHgGgG2OsBsBBDBGiDiDB+C+CBBB34bjnBjnBBEBvIzDzDdBB6DIBxCYYpDDBEBB2OXXqEtDtDWBBoDDBKngVngVuBBBh-BFBCpBBCIB0sBhBhB2K04D04DnrTDB9PCBpBBBnRMBhCBBCPPB9-P9-PBCBCGBCBByhM9BBqGGBud0Q0QsSAB",!1)),Lo:()=>new g(m("qFQQhIFFBCBxGBB7ZaBFDBuBfBCJBkBBBCiDBCZZBLLBBBDRRCdBe4CBMZZBfBWVBrBYBIKBGXBCGBRoBB8B1BBETTIJBROBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNFB8BBBCCCBDBCXBCCCBIBCBBKDDBDBYDBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNyDyDBnKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPByDrTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBpBkCkCBhBBC0BBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBxFuBBSHB3BdBOBBLrBBbjBBqBCBLdByDDBCFBCBBE7hB7hBBCB4-C3BBZWBKGBCGBCGBCGBCGBCGBCGBCGBoR2B2BF1CBJCCB4CBFGGBpBBC9CBSfBxBPBhQ-tGBhC0wUBC2jBBkCnBBJrIBFPBLBBjCyByBBkCBqFoDoDEGBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBuBEBDIBLEBCoBBYCBCHBVPBCFBEEEBwBBCEEBDDBDBDCCZBBEKBIPPBEBDFBDFBKGBCGByEiBBej9KBNWBFwBBloItLBDpDBkCCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBqDJBCsBBDeBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBhEtCBjDnBBJzBB9CzBBN2JBKVBLHB5EFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4FjBBnBDBCxJxJBoBBHBBRCBCBB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB0GHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBnBBCBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBB0BUBGSB0NnBB2MqCBGwFwFB0mHBqBfBiDyDBuwIiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBxzI2P2PBrBBiBiKiKBcBTrBBlPaBmHdBDwGwGBdBCCBCBBCGBDEBKiHiHBFBCDBCBBCOBCkGB8pBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Lt:()=>new g(m("lOGDnB2sH2sHBGBJHBJHBNQQwBAB",!1)),Lu:()=>new g(m("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBG+B+B9zCvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBB",!1)),M:()=>new g(m("gYvDB0IGBoIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCgBB3BCBCRBCGBLBBeCB5BCCBFBDBBDCBKLLBbbDCB5BCCBDBFBBDCBEffBEEMCB5BCCBGBCCBCCBVBBXFBCCB5BCCBFBDBBDCBICBLBBf8B8BBDBECBCDBKpBpBBDB4BCCBFBCCBCDBIBBMBBeCB5BCCBFBCCBCDBIBBMBBQNNBCB4BBBCGBCCBCDBKLLBeeBBBnCFFBEBCCCBGBTBB+BDDBFBNHBjDDDBHBMGBqCBBcECFBByBTBCBBGKBCjBBKlDlDBSBYDBFCBCCBDGBEDBOLBCLLBCBgWCBzdDBdCBeBBfBBhCfBKuBuBBBBC2D2DBjBjB3DLBFLB8GEB6BJBCcBDxBxBBsBBDLBVEBwBQBnBIBNCBfMB5BNBxBTB5ECBCUBFHHDCBnG-BBxWgBB--CCBuEhDhDBeBrRFBqDBB1udDBCJBhBBBxCBBxIEEFYYBDBF0C0CBzBzBBQBbRBOnBnBBGBaMBtBDBwBNBlBkCkCBMBNJJBuBuBBBBzBCCBBBDBBGBBCqBqBBDBGBBtHHBCBBx5TiXiXBOBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB7DCB2BOBqBDDBLLBCBuBKBI+B+BBBBlBNBRBBtBNNBBBxBNBJDBCBB9CLBHDD+ELBWDB4BBBCGBDBBDCBKLLBDDBFBEEBkCIBCDDCDBCEBCPPBzCzCBQBYyCyCBSBsHGBDIBcBBzCQBrDMBmDOBhIOB2HFBCBBDDBCCCBuEuEBFBDGBEddBIBpBGBCDBJKKBJBvBPBnGHBoGHBCHBzCVBCNB7DFBECCBCCBFBCjCjCBDBCBBCEB8KDBKBBCxBxBBFBEEBYmnFmnFHOBpmLRBhuCEB8BGB5gBCCB1BBIDByCMMBslTslTBizEizEBsBBDWB-QEBEFBJHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),Mc:()=>new g(m("joC4B4BDCBJDBCBBzBBB7BCBHBBDBBLsBsB7BCBjC7B7BBBBJCCB2B2BB7B7BCHHBDDBLLnDBBCBBECBCCBLqBqBBBB+BDB+BBB7BCCBDBDBBCBBKBBdPPB7B7BBBBGCBCCBLrBrBBsCsCBBBHHBTBBrKBBgCsFsFBFFHDDBaaBLLBBBDGBWBBDFBDLLBBB5zBffiEIIBGBCBB7KDBDCBFBBCFBhHBB7BCCKCCBJJBEByExBxBGCCBDBCBB+BffFBBD9B9BDCBCEEBxBxBBGBJBBsFWW35EBB0-dBBD5C5CBzBzBBOBvEBBwBxBxBBFFBDDBBBvDBBDBBZuBuBCuDuDDBBGuHuHBCCBCCBCC0gZCCgEuBuBBBBFBB0DZZB8B8BxBCBKBBO+C+CBBBEBBCrFrFBBBgBBB7BBBCDBDBBDCBKLLB1C1CBBBIDDCDBCBBCmDmDBBBJBBErDrDBBBHCCBCBDuHuHBBBHDBDyDyDBBBJBBCuDuDCBBHoDoDCBBFmImIBBBK4H4HBEBCBBFDDCvEvEBBBJDBF1C1CeBB-BqGqGECCoGPPrDIID2G2GBDBFBBC-K-KBNNxBBBJBBCpvQpvQBBBlxD2BBpDBB0rYBBHFB",!1)),Me:()=>new g(m("okBBB1xF-wB-wBBCBCCBsshBCB",!1)),Mn:()=>new g(m("gYvDB0IEBqIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCfB4BCCFHBFEEBFBLBBe7B7BFDBJVVBbbDBB6BFFBFFBDDBBBEffBEEMBB6BFFBDBCBBFVVBXXBEBC7B7BDCCBCBJIIBMMBff+BNNzBEE4BCCBBBGCBCDBIBBMBBe7B7BDHHGBBVBBdBB6BBBFDBJVVBeepCIIBBBC7C7CDGBNHBjDDDBHBMGBqCBBcEC4BNBCEBCBBGKBCjBBKnDnDBCBCFBCBBDBBaBBFCBRDBODDBHHQgWgWBBBzdCBeBBfBBfBBhCBBCGBJDDBJBKuBuBBBBC2D2DBjBjB3DCBFBBKHHBBB8GBBD7B7BCGBCCCDHBHJBDxBxBBMBCeBDLBVDBxBCCBDBCGGpBIBNBBhBDBDBBCCB5BCCBEECCB7BHBDBB5ECBCMBCGBFHHEBBnG-BBxWMBFEEBKB--CCBuEhDhDBeBrRDBsDBB1udFFBIBhBBBxCBBxIEEFaaBGG4EBBbRBOnBnBBGBaKBvBCBxBDDBCBDBBoBkCkCBEBDBBDBBNJJwB0B0BCCBDBBGBBCrBrBBJJvHDDFx5Tx5TiXPBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB8D3B3BBNBqBDDBLLBBByBDBDBBI+B+BBBBlBEBCHB-BNNB1B1BBHBLDBDgDgDBBBDCCBHHD+E+EEHBWBB6BBBEmBmBBFBEEBnCFBOECPBB2CHBDCBCYY1CFBCFFBCCBvHvHBCBHBBCBBcBB2CHBDCCBrDrDCDDBEBCmDmDCDDBCBCEBkIIBCBBhIBBCFFxEDBDBBFhBhBBIBpBFBDDBJKKBEBDCBvBMBCBBnGCCBBBCqGqGBFBCFBCzCzCBUBDGBCBBCBB7DFBECCBCCBFBCpCpCBEEC8K8KBMMB1B1BBDBGCCYmnFmnFHOBpmLLBECBhuCEB8BGB5gBgCgCBCByC5lT5lTBizEizEBsBBDWBhRCBSHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),N:()=>new g(m("wBJB5DBBGDDBBBitBJBnEJBnGJB9MJB3DJBFFBtDJB3DJB3DJBDFBvDMB0DJBJGBoDJBpDGBISBuDJBhDJB3DJBnCTBtIJBnCJBwWTBybCBwHJBHJBXJBtJJBhEKBmFJBHJB3FJB3CJBnEJBHJB3gBEEBEBHJBnGyBBDEB3W7BBvCVB3TdBqrBqYqYaIBPCB4KDBrEJBfHBCOBhBJBoBOBh7cJB9FJBhKFB7EJBnBJBnGJBXJB3CJB3MJB34UJBuPsBBN4BBSBB2KaBlBDBeJJnEEBrGJBvdHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBxBJBHJB3IeB-EJBrBDBxDGBnEdBhEJB9BJBxEJBITB8HJB3KJB3DJB3LJBnDJBHTBtCLBlNSB+CJB3UJB3CcBkHJBnCJB3BJBnLJBnDUBshBuDBimPJBnpCJB3CJBnEJBCGBvQJBnIWB+KCB6nXJBnuBTBNTBtDYB2iBxBBhqCJBnNJB3PJB4HJBtWIBhEJB4Y6BBCCBCDBtCsBBCOBjeMBk3CJB",!1)),Nd:()=>new g(m("wBJnxBJnEJnGJ9MJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJhDJ3DJnCJ3IJnCJn6BJnBJtJJhEJnFJHJ3FJ3CJnEJHJnuiBJnVJnBJnGJXJ3CJ3MJ34UJnsBJnkCJHJ9YJhEJ9BJxEJ3IJ3KJ3DJ3LJnDJHTtCJnNJnDJ3UJ3CJ3HJnCJ3BJnLJ3uQJnpCJ3CJnEJ3QJ37XJ12CxBhqCJnNJ3PJ4HJ2aJ30EJ",!0)),Nl:()=>new g(m("u3FCBwzCiBBDDB-zDaaBHBPCBs1dJBxyW0BBtOJJnEEBrhIuDBm8SCB",!1)),No:()=>new g(m("yFBBGDDBBB2pCFB5LFB5DCBmEGB6GGBSIByNJB2hBTB0jBJBhP20B20BEFBHJBnGPBqB3W3WB6BBvCVB3TdBqrB1kB1kBBCBrEJBfHBCOBhBJBoBOBxrdFBymWsBBiCDBSBB2KaBlBDB1pBHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBhLeB-EJBrBDBxDGBnETB8LTBmqBBBvNIBobSB0aUBn8SGB-YWBqhZTBNTBtDYBvqFIBid6BBCCBCDBtCsBBCOBjeMB",!1)),P:()=>new g(m("hBCBCFBCDBLBBEBBbCBCccCkBkBGEELBBEEE-VJJzOFBqBBB0BCCDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCmBmBBCBoCrCrCBDBFBBwDFBsFlTlTBHB4EuTuTtBBBvCCBoCBB+ECBCCBmBKB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBM9Z9ZBWBJTBCMBCLBfBBPBB6TDBeBB+hBNBwCBBgBJB0MVBgCDBhBBB8XDBCBBxDwEwEBtBBCfBDLBkNCBFJBDLBRNNjD7C7CjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HzqUzqUBxGxGBIBXiBBCNBCFFCBB2ECBCFBCDBLBBEBBbCBCccCCCBFB7MCB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDByO-J-JjBlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Pc:()=>new g(m("-Cg-Hg-HBUU-u3BBBZCBwHAB",!1)),Pd:()=>new g(m("tB9qB9qB0BiyDiyDmgBqgCqgCBEBiwDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Pe:()=>new g(m("pB0B0BgB+1D+1DC-6B-6BqtC4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECtBGCtNICEGCDBB-ozB6G6GeOCESSCCCrF0B0BgBGD",!1)),Pf:()=>new g(m("7F+6H+6HEddpuDCCFDDQEE",!1)),Pi:()=>new g(m("rFt7Ht7HDBBDaapuDCCFDDQEE",!1)),Po:()=>new g(m("hBCBCCBDECBLLBEEBcclCGGPBBI-V-VJzOzOBEBqB3B3BDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCxDxDrCEBFBBwDFBsFlTlTBHBmY9D9DBBBoCBB+ECBCCBmBFBCDB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBMjajaBJJBGBJIBDDBDCBEKBCCCBIB7kDDBCBBxDwEwEBFFBBBDDDBHBCBBCDDBLLBDBCJBDDBCCCBLBDCBtNCB6B+F+FjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HlxUlxUBFBDXXVBBDDBECBCDBICBHCCB2E2EBBBCCBDECBLLBEEBcclBDDB7M7MBBB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDB0ZlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Ps:()=>new g(m("oBzBzBgB-1D-1DC-6B-6B-rCEEnB4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECaTTCECtNICEGCDipzBipzB4GeeCMCESSCCCrFzBzBgBEEDAB",!1)),S:()=>new g(m("kBHHRCBgBCCcCCkBEBCBBDCCBCBDEEfgBgBrODBNNBGGBCCCBPB2DPPBxDxDsErIrIBBB3DCBDDDBvGvGLUUB4H4HIBBpEqLqLBHHB2H2H-DjEjEBGBlEwGwGqBmGmGiGCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WuLuLlL+E+EBgBBiLJBKIBhiBCCBBBMCBOCBOCBOBBmCOOoBCBOCBUhBB-BBBCDBCBBLCCBBBGFBCECFMMBFFBDBGDBC7B7BBFFB2LBFcBD+HBXKByCtCBXnTBtBwBBDeBLyMBX+BBFfBD1LBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBB8CBB0HBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BB6RWBKBBoDBB+EDBLDB+RCBiHPPB+9T+9TpEgBBuLPBhCBB3BHBtBDBjDCCBBBD7E7EHRRBBBgBCCcCCiEGBCGBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSmWmWBiKiKBGBnjC2kC2kCBbBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQQBgDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBrbaagBaagBaagBaagBaa9B-PB4BDBzBHBCNBCBBp2BwNwNttCEE+DiOiOBvIvIBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Sc:()=>new g(m("kB+D+DBCBqnB8D8DzPBBzPBBI2H2HoImSmS8sClmClmCBgBB37hBkuVkuVtD7E7E8GBBEBB3-HDB-4wBxtCxtC",!1)),Sk:()=>new g(m("+CCCoCHHFEEqQDBNNBGGBCCCBPB2DPPBjoBjoB15FCCBBBMCBOCBOCBOBB9kEBBkzdWBKBBoDBBxePPBniUniUBPB8bCCjF4g9B4g9BBDB",!1)),Sm:()=>new g(m("rBRRBBB+BCCuBFFmBgBgB-XwQwQBBB8xGOOoBCBOCBsEoBoBBDBHlClCBDBGBBFGDIgBgBBDDCgBgBBqIBhBBB7CffBXBpBFB2OKK3BHBwDxKxKBDBDeBLPBhIiEBX+BBFfBDhIBxBUBDFB9+zB5Z5ZCCBlFRRBBB+BCCkEHHBCBitDBBhrwBx+Bx+BagBgBagBgBagBgBagBgBat5Ft5FB-uC-uCBHB",!1)),So:()=>new g(m("mFDDFCCyerIrIBgEgEBvGvGLUUB4H4HkQ2L2LjEFBClElEwGqBqBoMCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WzWzW+EhBBiLJBKIBksBBBCDBCBBLCCBHHBEBCECFMMBPPCBBC7B7BBKKBDBDDBCBBCBBCGBCeBDBBCCCBdBtIHBFTBDGBDwCBCdBanBBHnCBXKByCtCBX2FBCIBC1BBJuDBC3HBtBrBBhC-HBhQvBBWBBHmBBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBBxKBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BBibDBLBBC+R+RBBBqqUPBuLPBhCBB3BHBuBCBlPEEFBBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSpgBpgBBGBnjC2kC2kCBGBFQBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQPBhDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBqlB-PB4BDBzBHBCNBCBBp2B96C96CiEyWyWBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E6HBG4WBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBB-B3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Z:()=>new g(m("gBgEgEgvFgsCgsCBJBeBBGwBwBh9DAB",!1)),Zl:()=>new g(m("ohIA",!0)),Zp:()=>new g(m("phIA",!0)),Zs:()=>new g(m("gBgEgEgvFgsCgsCBJBlBwBwBh9DAB",!1)),ASCII_Hex_Digit:()=>new g(m("wBJIFbF",!0)),Alphabetic:()=>new g(m("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICC3CeeBQBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoBNBCCCBCCBCCJaBFDBeKBG3BBCGBPlDBCHBFHBFCBLCBDRRBuBBOkDBZgBBKBBFGGBWBDSBUYBIKBGXBCGBIJJBoBBLLBEGBHrCBCPBCCBFOBOSBCHBDBBDVBCGBCEEBCBEHBDBBDBBCJJFBBCEBNBBLFFBBBCFBFBBDVBCGBCBBCBBCBBFEBFBBDBBFIIBCBCSSBEBMCBCIBCCBCVBCGBCBBCEBEIBCCBCBBEQQBCBWDBFCBCHBDBBDVBCGBCBBCEBEHBDBBDBBKBBFBBCEBORRBCCBEBECBCDBEBBCCCBEEBEEBBBELBFEBECBCCBEHHpBMBCCBCWBCPBEHBCCBCCBJBBCCBCBBDDBdDBCHBCCBCWBCJBCEBEHBCCBCCBJBBGCBCDBOCBNMBCCBCoBBDHBCCBCCBCGGBCBIEBXFBCCBCRBEXBCIBCDDBFBJFBCCCBGBTBBO5BBGGBH0B0BBECBDBCXBCCCBRBCCBDEBCHHPDBhBgCgCBGBCjBBFSBFPBCjBBkC2BBCDDBDBR-BBLDBDlBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBEKBITBMUBNTBNMBCCBCBBNzBBDSBPFFkC4CBIqBBGlCBLeBCLBFIBYdBDEBMrBBFZB3BbBF+BBDTBzBYYBMMBBByBzBBCOBCHB0BpBBDDBLrBBCKBP2BBXCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBUhBBM1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBFSSBnBBuZzBB34BkHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBCfBwB2O2OBBBaIBIEBDEBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBGHBEwDBoBIBDmDBDxCBVUBCgBBZzBBNjCBCtBtBBEBECCBBBLgBBGiBBOcBEyBBCLBQRRBOBLEBC2BBKNBTWBEkCBCCCZCBDPBDDBMFBDFBDFBKGBCGBCqBBCNBH6DBWj9KBNWBFwBBloItLBDpDBnBGBNEBGLBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmC0BBsIcBEwBBwBfBOdBGqBBGdBDjBBFHBCEBrB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCDBCBBGHBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOnBBjBbBEGGBVB7HpBBCBBEBBRFBzBCBEcBLJJBUBrBRBvBUBcWBKlCBsBEBL4BBKOOBXBYyBBSDBJiBBEKKB+BBCDBKBBLCCkBRBChBBDHHBCB-BGBCCCBCBCOBCJBI4BBYDBCHBDBBDVBCGBCBBCEBEHBDBBDBBEHHGGBdJBCDDClBBCJBCDDCDBCBBECCtBhCBCCBCDBVCBfhCBDBBC5F5FB0BBDGBaFBjB+BBCEE8B1BBDoCoCBZBDNBWGB6F4BBoD-BBgBHBDDDBGBCBBCdBCBBDBBDDB+CHBDtBBDFBCCCBccBxBBDJBSnCBGTTBnCBoDHB5CgBBgBIBCsBBCGBCyByBBcBDVBCNBqCGBCBBCrBBECCBCCBBBCDDBZZBEBCBBCkBBCBBCDBCYYBqBBlIWBKQBCoBBECBwDwCwCB4cBnDuDBSjGBtyCgDBQvhBBSFBa68DBGmSB61GuBBy2B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBF4BBIQBhCBBCNNBFBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBFi7Fi7FBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCVBJBBhHGBCDBCBBCOBCkGB8BjCBEEE1lBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1TZBHZBHZB3zD-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Dash:()=>new g(m("tB9qB9qB0BiyDiyDmgBqgCqgCBEB+BoBoBQnMnMlgDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Emoji:()=>new g(m("jBHHGJBwDFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDrGrGhFBBNBBPDDBIBsCZBCBBYVVDIBWBBvFhBBDvDBDBBCCBDyCBDCBCmIBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDDBEJBECCBEEDJBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Emoji_Component:()=>new g(m("jBHHGJB0+H2G2Gsp3B3+8B3+8BBYB8PEBxtBDBtzhY-CB",!1)),Emoji_Modifier:()=>new g(m("7-8DE",!0)),Emoji_Modifier_Base:()=>new g(m("9wJ8G8GRDB4jzD9B9BBBBDDDBBB2DBBDKBWSBEFFBBBCCBICCZqGqGBFFWFFBvFvFBBBEEB0CRRBBBKMMgSDDJHBHKKBIBDCB5B+B+BBCCBCCSCBCMBmHCBrBIB",!1)),Emoji_Presentation:()=>new g(m("64IBBuGDBEDDqQBBWBBzBLBsBUUOJJBSSBGGBJJGWWIBBCFFDIIFBBdkBkBCFFBBBC+B+BBBBZPP8aBB0BFFvlxDrGrG-FDDBIBsCZBCZZVDDBDBCCBWBBvFgBBNIBClCBCVBNqBBFEBNQBEEEBlCBCCCB5FBD+BBODBCXBTbbBOO3C0CBxBlCBHEEBBBDDBEDBMBBIIBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Extended_Pictographic:()=>new g(m("pFFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDoBoBBCBlDLBQBBQPPBmBmBBIBxDBBNBBPDDBIBU3BBcOBLVVDIBCDBKWBH7FBDvDBDBBCCBDyCBDCBCDBG9HBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDQBECCBEBDMB7GlBBNDB5BHBLFBpBHBfBBNDBDNBKmBBNuBBCJBC4FB5CHBPxEBhI9fB",!1)),Hex_Digit:()=>new g(m("wBJIFbFq1-BJIFbF",!0)),Lowercase:()=>new g(m("hDZBwBLLFlBlBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDiBBIBBfEBhDsBsBCEEDDBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBCDB5XFBjkCIBC2D2DB+FBiC0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBB6DOORMBuDEEBEEcKFDBBJDBFiBiBBOBFsasaBYBn6BvBBCEEBGCFCCBCCBGBEiDCBIICFFNlBBCGG0oesBCUaCBBBmEMCBBBC8BCBIBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCWDBCCCBBB2ZqBBCNBHvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBkODDBBBCpBBCIBmoByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFBmI9BB1lChBB",!1)),Math:()=>new g(m("rBRRBBBgBeeCuBuBFmBmBgB5W5WBBBDbbBDDBBBwQCBuwGccBBBMEEOPPBCBWEBMEBiCMBFEEBFFBDBTFFDJBCDDBEBHEEBDDBCCBBBCFBENBClClCBWBCFBCBBFBBFfBCHHBPPBqIBJDBVBB7CffBZBCZZMGB+NBBNJBFFBFBBDBBEEBPCCDFBMHBGBB6BCCeDBKCBxK-BBhI-PBxBUBDFB9+zB4Z4ZBEBCjFjFRCBeCCeCCkEHHBCBitDBBhrwBwoBwoBBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBBhwFDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB-uCIB",!1)),Quotation_Mark:()=>new g(m("iBFFkEQQ96HHBaBBowDqOqOBCBOCBixzBDB+FFF7CBB",!1)),Terminal_Punctuation:()=>new g(m("hBLLCMMBEE-ZJJiQ6B6BpCPPCCB1FsBsBBJBCsHsHB3B3BBEBCHBgBmImIB1nB1nBBtFtFFFB4JBB2YHBmY9D9DBBBoCBB+ECBEoBoBBCBDBB7JBBjLDBjFBBLBBCCBeCB8FEB-BBBldYYBKKBBBwlDCBzJOOFLLCBBEBBtNBB8ndBBuICBkHEB-LBB3CBBgD4E4EBBB0ECBgERRB6H6HnxUDDB6B6BBBBCDBqFLLCMMBEEiCDD7hBxBxBnkBoGoG3JBB5EFBlCFB6CDB5dEBtBDB+FGBxDDBgECBiEBBHRRB5C5CBDBtDrJrJB2D2DBBBNBBnLDBEOBqDBB6HCBmQCC8HBB4CBBFBB-MCBuBmUmUBrCrCBspBspBBDB6vRBBmEiCiCBBBLqRqRBoJoJBnwTnwTovHDB",!1)),Uppercase:()=>new g(m("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBGbbBOBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBBvgCZBHZBHZB",!1)),White_Space:()=>new g(m("JEBTlDlDbgvFgvFgsCKBeBBGwBwBh9DAB",!1))})),G(gn,"SCRIPTS",new Mi({Adlam:()=>new g(m("go6DrCFJFB",!0)),Ahom:()=>new g(m("g4lCaDOFW",!0)),Anatolian_Hieroglyphs:()=>new g(m("ggxCmS",!0)),Arabic:()=>new g(m("gwBEBCFBCNBCCBCfBCJBMZBCrDBChBBxCvBBxHhBBGqCBCcBxy8BtPBDvEBhBPBxDEBCmEBk7DeBkCFBJIBiBFBh43BDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB",!1)),Armenian:()=>new g(m("xpBlBDxBDCks9BE",!0)),Avestan:()=>new g(m("g4iC1BEG",!0)),Balinese:()=>new g(m("g4GsCCxB",!0)),Bamum:()=>new g(m("g1pB3CpowB4R",!0)),Bassa_Vah:()=>new g(m("w26CdDF",!0)),Batak:()=>new g(m("g+GzBJD",!0)),Bengali:()=>new g(m("gsCDBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYB",!1)),Beria_Erfe:()=>new g(m("g17CYDY",!0)),Bhaiksuki:()=>new g(m("ggnCICsBCNLc",!0)),Bopomofo:()=>new g(m("qXB6wLqBxDf",!0)),Brahmi:()=>new g(m("ggkCtCFjBKA",!0)),Braille:()=>new g(m("ggK-H",!0)),Buginese:()=>new g(m("gwGbDB",!0)),Buhid:()=>new g(m("g6FT",!0)),Canadian_Aboriginal:()=>new g(m("ggF-TxRlC7tgCP",!0)),Carian:()=>new g(m("g1gCwB",!0)),Caucasian_Albanian:()=>new g(m("wphCzBMA",!0)),Chakma:()=>new g(m("gokC0BCR",!0)),Cham:()=>new g(m("gwqB2BKNDJDD",!0)),Cherokee:()=>new g(m("g9E1CDFz7lBvC",!0)),Chorasmian:()=>new g(m("w9jCb",!0)),Common:()=>new g(m("AgCBbFBbuBBCOBCEBYgBgBiOmBBGEBDTB1DKKHCC+THHPEEhB9E9ElQiEiEB6mB6mB2MDBjJwvBwvBBBBoCBBsGBBCumBumBOIIBCBCFBCCBDmYmYBKBD2CBCKBEKBCOBShBB-BlBBCCBDFBCaBCQBqBCBF5UBXKBW-cBhIzTBDpEBhQ9CBzMUBCCCBXBQHBFDB8CBBE7C7CB0E0EBOBhBlBBKxBxBB+BBgBwCBwB5C5CBmFBhuG-BBhoWhBBnDCBmFJB1HhFhFsMPPBzuUzuUBxGxGBIBXiBBCSBCDB0ECCBeBbFBbKBLuBuBBhChCBFBCGBLEBjICBFsBBEIBxCMB0BsBBlHaBltuBDB96D8HBEzNBHWBQQBgDzDB9B1HBLmBBD9BBEQBJBBIdBF8BB2GTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBByjFjCBtC8BBjWrBBFjDBNOBDOBCOBCkBBLtFB5BZBCBBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBnghYffB+CB",!1)),Coptic:()=>new g(m("ifNxkKzDGG",!0)),Cuneiform:()=>new g(m("ggoC5cnDuDCEMjG",!0)),Cypriot:()=>new g(m("ggiCFBDCCBqBBCBBEDD",!1)),Cypro_Minoan:()=>new g(m("w8rCiD",!0)),Cyrillic:()=>new g(m("ggBkEBDoFBx6FKBhFtCtCojEfBhie-CBv8VBBhw4B9BBiBAB",!1)),Deseret:()=>new g(m("gghCvC",!0)),Devanagari:()=>new g(m("goCwCFODZh7nBfhwcJ",!0)),Dives_Akuru:()=>new g(m("gomCGBDDDBGBCBBCdBCBBDLBKJB",!1)),Dogra:()=>new g(m("ggmC7B",!0)),Duployan:()=>new g(m("ggvDqDGMEIIJDD",!0)),Egyptian_Hieroglyphs:()=>new g(m("ggsC1iBL68D",!0)),Elbasan:()=>new g(m("gohCnB",!0)),Elymaic:()=>new g(m("g-jCW",!0)),Ethiopic:()=>new g(m("gwEoCBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBnvGWBKGBCGBCGBCGBCGBCGBCGBCGBjpfFBDFBDFBKGBCGBylvCGBCDBCBBCOB",!1)),Garay:()=>new g(m("gqjClBEcJB",!0)),Georgian:()=>new g(m("glElBBCGGDqBBCDBx8CqBBDCBhiElBBCGG",!1)),Glagolitic:()=>new g(m("ggL-Ch9sDGCQDGCBCE",!0)),Gothic:()=>new g(m("w5gCa",!0)),Grantha:()=>new g(m("g4kCDBCHBDBBDVBCGBCBBCEBDIBDBBDCBDHHGGBDGBEEB",!1)),Greek:()=>new g(m("wbDBCCBDDBCFFCCCBBBCCCBSBC+BBPPBnpGEBzBEBFEB1ChKhKBUBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBoJ-xiB-xiB7uVuCBSgj0Bgj0BBkCB",!1)),Gujarati:()=>new g(m("h0CCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGB",!1)),Gunjala_Gondi:()=>new g(m("grnCFCBCkBCBCFIJ",!0)),Gurmukhi:()=>new g(m("hwCCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPB",!1)),Gurung_Khema:()=>new g(m("go4C5B",!0)),Han:()=>new g(m("g0LZBC4CBN1GBwBCCaIBPDBle-tGBhC-vUBhoWtLBDpDBpodBBNGBqgkB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Hangul:()=>new g(m("goE-HvxHBiI9CyDeiCei3dckUj9KNWFwBl9JeEFDFDFDC",!0)),Hanifi_Rohingya:()=>new g(m("gojCnBJJ",!0)),Hanunoo:()=>new g(m("g5FU",!0)),Hatran:()=>new g(m("gniCSCBGE",!0)),Hebrew:()=>new g(m("xsB2BBJaBFFBpp9BZBCEBCCCBCCBCCBIB",!1)),Hiragana:()=>new g(m("hiM1CBHCBi7-C+IBTeeBBBulQAB",!1)),Imperial_Aramaic:()=>new g(m("giiCVCI",!0)),Inherited:()=>new g(m("gYvDB2IBBlOKBbhXhXBCB8qEtBBDLBlPCBCMBCGBFHHEBBnG-BBtQBBjGgBB65DDBsDBBmrzBPBRNBwejHjH7iEl+uBl+uBBsBBDWBhRCBSHBDGBfDBz6rYvHB",!1)),Inscriptional_Pahlavi:()=>new g(m("g7iCSGH",!0)),Inscriptional_Parthian:()=>new g(m("g6iCVDH",!0)),Javanese:()=>new g(m("gsqBtCDJFB",!0)),Kaithi:()=>new g(m("gkkCiCLA",!0)),Kannada:()=>new g(m("gkDMCCCWCJCEDICCCDIBGCCDDJCC",!0)),Katakana:()=>new g(m("hlM5CBDCBxHPBxGuBBC3CBvgzBJBCsBBzisBDBCGBCBBCgJgJBBBzBPPBCB",!1)),Kawi:()=>new g(m("g4nCQCoBEc",!0)),Kayah_Li:()=>new g(m("goqBtBCA",!0)),Kharoshthi:()=>new g(m("gwiCDCBGHCCCcDCFJII",!0)),Khitan_Small_Script:()=>new g(m("k-7C84G84GB0OBqBAB",!1)),Khmer:()=>new g(m("g8F9CDJHJnPf",!0)),Khojki:()=>new g(m("gwkCRCuB",!0)),Khudawadi:()=>new g(m("w1kC6BGJ",!0)),Kirat_Rai:()=>new g(m("gq7C5B",!0)),Lao:()=>new g(m("h0DBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDB",!1)),Latin:()=>new g(m("hCZBHZBwBQQGWBCeBCgOBoBEB8wGlBBHwBBGDBGMBClCBiC-HByLOORMBuEBBHccSoBB42CfBj1elDBExCBVOBxZqBBCIBCDB38TGB7gBZBHZBmhCFBCpBBCIBm61BeBHFB",!1)),Lepcha:()=>new g(m("ggH3BEOEC",!0)),Limbu:()=>new g(m("goGeBCLBFLBFEEBKB",!1)),Linear_A:()=>new g(m("gwhC2JKVLH",!0)),Linear_B:()=>new g(m("gggCLCZCSCBCODNjB6D",!0)),Lisu:()=>new g(m("wmpBvBx1eA",!0)),Lycian:()=>new g(m("g0gCc",!0)),Lydian:()=>new g(m("gpiCZGA",!0)),Mahajani:()=>new g(m("wqkCmB",!0)),Makasar:()=>new g(m("g3nCY",!0)),Malayalam:()=>new g(m("goDMCCCyBCCCFFPDZ",!0)),Mandaic:()=>new g(m("giCbDA",!0)),Manichaean:()=>new g(m("g2iCmBFL",!0)),Marchen:()=>new g(m("wjnCfDVCN",!0)),Masaram_Gondi:()=>new g(m("gonCGBCBBCrBBECCBCCBHBJJB",!1)),Medefaidrin:()=>new g(m("gy7C6C",!0)),Meetei_Mayek:()=>new g(m("g3qBWqGtBDJ",!0)),Mende_Kikakui:()=>new g(m("gg6DkGDP",!0)),Meroitic_Cursive:()=>new g(m("gtiCXFTDtB",!0)),Meroitic_Hieroglyphs:()=>new g(m("gsiCf",!0)),Miao:()=>new g(m("g47CqCF4BIQ",!0)),Modi:()=>new g(m("gwlCkCMJ",!0)),Mongolian:()=>new g(m("ggGBBDCCBSBH4CBIqBB2t-BMB",!1)),Mro:()=>new g(m("gy6CeCJFB",!0)),Multani:()=>new g(m("g0kCGBCCCBCBCOBCKB",!1)),Myanmar:()=>new g(m("ggE-EhqmBeiDfxibT",!0)),Nabataean:()=>new g(m("gkiCeJI",!0)),Nag_Mundari:()=>new g(m("wm5DpB",!0)),Nandinagari:()=>new g(m("gtmCHDtBDK",!0)),New_Tai_Lue:()=>new g(m("gsGrBFZHKEB",!0)),Newa:()=>new g(m("gglC7CCE",!0)),Nko:()=>new g(m("g+B6BDC",!0)),Nushu:()=>new g(m("h-7CvsQvsQBqMB",!1)),Nyiakeng_Puachue_Hmong:()=>new g(m("go4DsBENDJFB",!0)),Ogham:()=>new g(m("g0Fc",!0)),Ol_Chiki:()=>new g(m("wiHvB",!0)),Ol_Onal:()=>new g(m("wu5DqBFA",!0)),Old_Hungarian:()=>new g(m("gkjCyBOyBIF",!0)),Old_Italic:()=>new g(m("g4gCjBKC",!0)),Old_North_Arabian:()=>new g(m("g0iCf",!0)),Old_Permic:()=>new g(m("w6gCqB",!0)),Old_Persian:()=>new g(m("g9gCjBFN",!0)),Old_Sogdian:()=>new g(m("g4jCnB",!0)),Old_South_Arabian:()=>new g(m("gziCf",!0)),Old_Turkic:()=>new g(m("ggjCoC",!0)),Old_Uyghur:()=>new g(m("w7jCZ",!0)),Oriya:()=>new g(m("h4CCCHDBDVCGCBCEDIDBDCICFBCEDR",!0)),Osage:()=>new g(m("wlhCjBFjB",!0)),Osmanya:()=>new g(m("gkhCdDJ",!0)),Pahawh_Hmong:()=>new g(m("g46ClCLJCGCUGS",!0)),Palmyrene:()=>new g(m("gjiCf",!0)),Pau_Cin_Hau:()=>new g(m("g2mC4B",!0)),Phags_Pa:()=>new g(m("giqB3B",!0)),Phoenician:()=>new g(m("goiCbEA",!0)),Psalter_Pahlavi:()=>new g(m("g8iCRIDNG",!0)),Rejang:()=>new g(m("wpqBjBMA",!0)),Runic:()=>new g(m("g1FqCEK",!0)),Samaritan:()=>new g(m("ggCtBDO",!0)),Saurashtra:()=>new g(m("gkqBlCJL",!0)),Sharada:()=>new g(m("gskC-ChsCH",!0)),Shavian:()=>new g(m("wihCvB",!0)),Siddham:()=>new g(m("gslC1BDlB",!0)),Sidetic:()=>new g(m("gqiCZ",!0)),SignWriting:()=>new g(m("gg2DrUQECO",!0)),Sinhala:()=>new g(m("hsDCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBt-gCTB",!1)),Sogdian:()=>new g(m("w5jCpB",!0)),Sora_Sompeng:()=>new g(m("wmkCYIJ",!0)),Soyombo:()=>new g(m("wymCyC",!0)),Sundanese:()=>new g(m("g8G-BhIH",!0)),Sunuwar:()=>new g(m("g+mChBPJ",!0)),Syloti_Nagri:()=>new g(m("ggqBsB",!0)),Syriac:()=>new g(m("g4BNC7BDCxIK",!0)),Tagalog:()=>new g(m("g4FVKA",!0)),Tagbanwa:()=>new g(m("g7FMCCCB",!0)),Tai_Le:()=>new g(m("wqGdDE",!0)),Tai_Tham:()=>new g(m("gxG+BCcDKHJHN",!0)),Tai_Viet:()=>new g(m("g0qBiCZE",!0)),Tai_Yo:()=>new g(m("g25DeCVJB",!0)),Takri:()=>new g(m("g0lC5BHJ",!0)),Tamil:()=>new g(m("i8CBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBm+kCxBBOAB",!1)),Tangsa:()=>new g(m("wz6CuCCJ",!0)),Tangut:()=>new g(m("g-7CgBgBB+3GBhQeBiDyDB",!1)),Telugu:()=>new g(m("ggDMCCCWCPDICCCDIBCCCBDDDJII",!0)),Thaana:()=>new g(m("g8BxB",!0)),Thai:()=>new g(m("hwD5BGb",!0)),Tibetan:()=>new g(m("g4DnCCjBFmBCjBCOCGFB",!0)),Tifinagh:()=>new g(m("wpL3BIBPA",!0)),Tirhuta:()=>new g(m("gklCnCJJ",!0)),Todhri:()=>new g(m("guhCzB",!0)),Tolong_Siki:()=>new g(m("wtnCrBFJ",!0)),Toto:()=>new g(m("w04De",!0)),Tulu_Tigalari:()=>new g(m("g8kCJBCDDClBBCJBCDDCDBCJBCBBJBB",!1)),Ugaritic:()=>new g(m("g8gCdCA",!0)),Unknown:()=>new g(m("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-FB",!1)),Vai:()=>new g(m("gopBrJ",!0)),Vithkuqi:()=>new g(m("wrhCKCOCGCBCKCOCGCB",!0)),Wancho:()=>new g(m("g24D5BGA",!0)),Warang_Citi:()=>new g(m("glmCyCNA",!0)),Yezidi:()=>new g(m("g0jCpBCCDB",!0)),Yi:()=>new g(m("ggoBskBE2B",!0)),Zanabazar_Square:()=>new g(m("gwmCnC",!0))})),G(gn,"FOLD_CATEGORIES",new Mi({L:()=>new g(m("laA",!0)),LC:()=>new g(m("laA",!0)),Ll:()=>new g(m("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGC3HrBrBCEEJHHCCBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHxC9zC9zCBuBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Lt:()=>new g(m("kOCCBCCBCClBCCtsHHBJHBJHBMQQwBAB",!1)),Lu:()=>new g(m("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpL2B2Bs1CvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1)),M:()=>new g(m("5cgBgBlgHAB",!1)),Mn:()=>new g(m("5cgBgBlgHAB",!1)),Emoji:()=>new g(m("8mJA",!0)),Extended_Pictographic:()=>new g(m("8mJA",!0)),Lowercase:()=>new g(m("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHuBPBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Math:()=>new g(m("ycGDCHHFMMDDDCHHFAB",!1)),Uppercase:()=>new g(m("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpLiBiBBOBFsasaBYBn6BvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1))})),G(gn,"FOLD_SCRIPT",new Mi({Common:()=>new g(m("8cgBgB",!1)),Greek:()=>new g(m("1FwUwU",!1)),Inherited:()=>new g(m("5cgBgBlgHAB",!1))})),gn),me,z=(me=class{static is32(e,t){let n=0,s=e.length;for(;n<s;){const i=n+Math.floor((s-n)/2),o=e.getLo(i),B=e.getHi(i);if(o<=t&&t<=B){const u=e.getStride(i);return(t-o)%u===0}t<o?s=i:n=i+1}return!1}static is(e,t){if(t<=me.MAX_LATIN1){for(let n=0;n<e.length;n++){if(t>e.getHi(n))continue;const s=e.getLo(n);if(t<s)return!1;const i=e.getStride(n);return(t-s)%i===0}return!1}return e.length>0&&t>=e.getLo(0)&&me.is32(e,t)}static isUpper(e){if(e<=me.MAX_LATIN1){const t=String.fromCodePoint(e);return t.toUpperCase()===t&&t.toLowerCase()!==t}return me.is(Bt.Upper,e)}static isPrint(e){return e<=me.MAX_LATIN1?e>=32&&e<me.MAX_ASCII||e>=161&&e!==173:me.is(Bt.Print,e)}static simpleFold(e){if(Bt.CASE_ORBIT.has(e))return Bt.CASE_ORBIT.get(e);const t=O.toLowerCase(e);return t!==e?t:O.toUpperCase(e)}static equalsIgnoreCase(e,t){if(e===t)return!0;if(e<0||t<0)return!1;if(e<=me.MAX_ASCII&&t<=me.MAX_ASCII)return 65<=e&&e<=90&&(e|=32),65<=t&&t<=90&&(t|=32),e===t;for(let n=me.simpleFold(e);n!==e;n=me.simpleFold(n))if(n===t)return!0;return!1}},G(me,"MAX_RUNE",1114111),G(me,"MAX_ASCII",127),G(me,"MAX_LATIN1",255),G(me,"MAX_BMP",65535),G(me,"MIN_FOLD",65),G(me,"MAX_FOLD",125251),G(me,"MIN_HIGH_SURROGATE",55296),G(me,"MAX_HIGH_SURROGATE",56319),G(me,"MIN_LOW_SURROGATE",56320),G(me,"MAX_LOW_SURROGATE",57343),G(me,"MIN_SUPPLEMENTARY_CODE_POINT",65536),me);const VB=256,MC=new Uint8Array(VB);for(let r=0;r<VB;r++)MC[r]=97<=r&&r<=122||65<=r&&r<=90||48<=r&&r<=57||r===95?1:0;let xa=null,Ma=null;var Ie,W=(Ie=class{static emptyInts(){return[]}static isByteArray(e){return Array.isArray(e)||e instanceof Uint8Array}static isalnum(e){return O.CODES.get("0")<=e&&e<=O.CODES.get("9")||O.CODES.get("a")<=e&&e<=O.CODES.get("z")||O.CODES.get("A")<=e&&e<=O.CODES.get("Z")}static unhex(e){return O.CODES.get("0")<=e&&e<=O.CODES.get("9")?e-O.CODES.get("0"):O.CODES.get("a")<=e&&e<=O.CODES.get("f")?e-O.CODES.get("a")+10:O.CODES.get("A")<=e&&e<=O.CODES.get("F")?e-O.CODES.get("A")+10:-1}static escapeRune(e){let t="";if(z.isPrint(e))Ie.METACHARACTERS.indexOf(String.fromCodePoint(e))>=0&&(t+="\\"),t+=String.fromCodePoint(e);else switch(e){case O.CODES.get('"'):t+='\\"';break;case O.CODES.get("\\"):t+="\\\\";break;case O.CODES.get("	"):t+="\\t";break;case O.CODES.get(`
`):t+="\\n";break;case O.CODES.get("\r"):t+="\\r";break;case O.CODES.get("\b"):t+="\\b";break;case O.CODES.get("\f"):t+="\\f";break;default:{let n=e.toString(16);e<256?(t+="\\x",n.length===1&&(t+="0"),t+=n):t+=`\\x{${n}}`;break}}return t}static stringToRunes(e){const t=String(e),n=[];let s=0;for(;s<t.length;){const i=t.codePointAt(s);n.push(i),s+=i>z.MAX_BMP?2:1}return n}static runeToString(e){return String.fromCodePoint(e)}static isWordRune(e){return e<VB?MC[e]===1:!1}static emptyOpContext(e,t){let n=0;return e<0&&(n|=Ie.EMPTY_BEGIN_TEXT|Ie.EMPTY_BEGIN_LINE),e===10&&(n|=Ie.EMPTY_BEGIN_LINE),t<0&&(n|=Ie.EMPTY_END_TEXT|Ie.EMPTY_END_LINE),t===10&&(n|=Ie.EMPTY_END_LINE),Ie.isWordRune(e)!==Ie.isWordRune(t)?n|=Ie.EMPTY_WORD_BOUNDARY:n|=Ie.EMPTY_NO_WORD_BOUNDARY,n}static quoteMeta(e){return e.split("").map(t=>Ie.METACHARACTERS.indexOf(t)>=0?`\\${t}`:t).join("")}static charCount(e){return e>z.MAX_BMP?2:1}static toArray(e){const t=e.length,n=new Array(t);for(let s=0;s<t;s++)n[s]=e[s];return n}static stringToUtf8ByteArray(e){if(globalThis.TextEncoder)return xa||(xa=new TextEncoder),xa.encode(e);{let t=[],n=0;for(let s=0;s<e.length;s++){let i=e.charCodeAt(s);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=i&63|128):(i&64512)===z.MIN_HIGH_SURROGATE&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===z.MIN_LOW_SURROGATE?(i=z.MIN_SUPPLEMENTARY_CODE_POINT+((i&1023)<<10)+(e.charCodeAt(++s)&1023),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=i&63|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=i&63|128)}return t}}static utf8ByteArrayToString(e){if(globalThis.TextDecoder){Ma||(Ma=new TextDecoder("utf-8"));const t=e instanceof Uint8Array?e:new Uint8Array(e);return Ma.decode(t)}else{let t=[],n=0,s=0;for(;n<e.length;){let i=e[n++];if(i<128)t[s++]=String.fromCharCode(i);else if(i>191&&i<224){let o=e[n++];t[s++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){let o=e[n++],B=e[n++],u=e[n++],c=((i&7)<<18|(o&63)<<12|(B&63)<<6|u&63)-z.MIN_SUPPLEMENTARY_CODE_POINT;t[s++]=String.fromCharCode(z.MIN_HIGH_SURROGATE+(c>>10)),t[s++]=String.fromCharCode(z.MIN_LOW_SURROGATE+(c&1023))}else{let o=e[n++],B=e[n++];t[s++]=String.fromCharCode((i&15)<<12|(o&63)<<6|B&63)}}return t.join("")}}},G(Ie,"METACHARACTERS","\\.+*?()|[]{}^$"),G(Ie,"EMPTY_BEGIN_LINE",1),G(Ie,"EMPTY_END_LINE",2),G(Ie,"EMPTY_BEGIN_TEXT",4),G(Ie,"EMPTY_END_TEXT",8),G(Ie,"EMPTY_WORD_BOUNDARY",16),G(Ie,"EMPTY_NO_WORD_BOUNDARY",32),G(Ie,"EMPTY_ALL",-1),Ie);const GC=(r=[],e=0)=>{const t=Object.create(null);for(let n=0;n<r.length;n++){const s=r[n],i=e+n;t[s]=i,t[i]=s}return Object.freeze(t)};var Tn,dr=(Tn=class{getEncoding(){throw Error("not implemented")}asCharSequence(){throw Error("not implemented")}asBytes(){throw Error("not implemented")}length(){throw Error("not implemented")}isUTF8Encoding(){return this.getEncoding()===Tn.Encoding.UTF_8}isUTF16Encoding(){return this.getEncoding()===Tn.Encoding.UTF_16}},G(Tn,"Encoding",GC(["UTF_16","UTF_8"])),Tn),dl=class extends dr{constructor(r=null){super(),this.bytes=r}getEncoding(){return dr.Encoding.UTF_8}asCharSequence(){return W.utf8ByteArrayToString(this.bytes)}asBytes(){return this.bytes}length(){return this.bytes.length}},l_=class extends dr{constructor(r=null){super(),this.charSequence=r}getEncoding(){return dr.Encoding.UTF_16}asCharSequence(){return this.charSequence}asBytes(){return W.stringToUtf8ByteArray(this.charSequence.toString())}length(){return this.charSequence.length}},rr=class{static utf16(r){return new l_(r)}static utf8(r){return W.isByteArray(r)?new dl(r):new dl(W.stringToUtf8ByteArray(r))}},rt=class{static EOF(){return-8}constructor(){this.end=0}canCheckPrefix(){return!0}endPos(){return this.end}hasString(){return!1}hasAnyString(){return!1}prefixLength(){return 0}},h_=class extends rt{constructor(r,e=0,t=r.length){super(),this.bytes=r,this.start=e,this.end=t}hasString(r,e){const t=r.bytes;if(t.length===0)return!0;const n=this.indexOf(this.bytes,t,this.start+e);return n!==-1&&n<=this.end-t.length}hasAnyString(r,e){return r.ac8?r.ac8.searchUTF8(this.bytes,this.start+e,this.end):!1}step(r){if(r+=this.start,r>=this.end)return rt.EOF();const e=this.bytes[r]&255;if(e<128)return e<<3|1;if(e>=194&&e<=223&&r+1<this.end){const t=this.bytes[r+1]&255;return(t&192)!==128?e<<3|1:((e&31)<<6|t&63)<<3|2}else if(e>=224&&e<=239&&r+2<this.end){const t=this.bytes[r+1]&255;if((t&192)!==128)return e<<3|1;const n=this.bytes[r+2]&255;return(n&192)!==128?e<<3|1:((e&15)<<12|(t&63)<<6|n&63)<<3|3}else if(e>=240&&e<=244&&r+3<this.end){const t=this.bytes[r+1]&255;if((t&192)!==128)return e<<3|1;const n=this.bytes[r+2]&255;if((n&192)!==128)return e<<3|1;const s=this.bytes[r+3]&255;return(s&192)!==128?e<<3|1:((e&7)<<18|(t&63)<<12|(n&63)<<6|s&63)<<3|4}else return e<<3|1}index(r,e){e+=this.start;const t=this.indexOf(this.bytes,r.prefixUTF8,e);return t<0?t:t-e}context(r){r+=this.start;let e=-1;if(r>this.start&&r<=this.end){let n=r-1;if(e=this.bytes[n--],e>=128){let s=r-4;for(s<this.start&&(s=this.start);n>=s&&(this.bytes[n]&192)===128;)n--;n<this.start&&(n=this.start),e=this.step(n-this.start)>>3}}const t=r<this.end?this.step(r-this.start)>>3:-1;return W.emptyOpContext(e,t)}indexOf(r,e,t=0){let n=e.length;if(n===0)return t<=this.end?t:-1;const s=e[0];let i=this.end-n;const o=typeof r.indexOf=="function";let B=t;for(;B<=i;){if(o){if(B=r.indexOf(s,B),B===-1||B>i)return-1}else{for(;B<=i&&r[B]!==s;)B++;if(B>i)return-1}let u=!0;for(let c=1;c<n;c++)if(r[B+c]!==e[c]){u=!1;break}if(u)return B;B++}return-1}prefixLength(r){return r.prefixUTF8.length}},C_=class extends rt{constructor(r,e=0,t=r.length){super(),this.charSequence=r,this.start=e,this.end=t}hasString(r,e){const t=this.charSequence.indexOf(r.str,this.start+e);return t!==-1&&t<=this.end-r.str.length}hasAnyString(r,e){return r.ac16?r.ac16.searchUTF16(this.charSequence,this.start+e,this.end):!1}step(r){if(r+=this.start,r>=this.end)return rt.EOF();const e=this.charSequence.charCodeAt(r);if(e<z.MIN_HIGH_SURROGATE||e>z.MAX_HIGH_SURROGATE||r+1>=this.end)return e<<3|1;const t=this.charSequence.charCodeAt(r+1);return t>=z.MIN_LOW_SURROGATE&&t<=z.MAX_LOW_SURROGATE?(e-z.MIN_HIGH_SURROGATE)*1024+(t-z.MIN_LOW_SURROGATE)+z.MIN_SUPPLEMENTARY_CODE_POINT<<3|2:e<<3|1}index(r,e){e+=this.start;const t=this.charSequence.indexOf(r.prefix,e);return t<0||t>this.end-r.prefix.length?-1:t-e}context(r){r+=this.start;const e=r>this.start&&r<=this.end?this.charSequence.charCodeAt(r-1):-1,t=r<this.end?this.charSequence.charCodeAt(r):-1;return W.emptyOpContext(e,t)}prefixLength(r){return r.prefix.length}},we=class{static fromUTF8(r,e=0,t=r.length){return new h_(r,e,t)}static fromUTF16(r,e=0,t=r.length){return new C_(r,e,t)}},ai=class extends Error{constructor(r){super(r),this.name="RE2JSException"}},_e=class extends ai{constructor(r,e=null){let t=`error parsing regexp: ${r}`;e&&(t+=`: \`${e}\``),super(t),this.name="RE2JSSyntaxException",this.message=t,this.error=r,this.input=e}getDescription(){return this.error}getPattern(){return this.input}},f_=class extends ai{constructor(r){super(r),this.name="RE2JSCompileException"}},at=class extends ai{constructor(r){super(r),this.name="RE2JSGroupException"}},d_=class extends ai{constructor(r){super(r),this.name="RE2JSFlagsException"}},ys=class extends ai{constructor(r){super(r),this.name="RE2JSInternalException"}},ir,pl=(ir=class{static quoteReplacement(e,t=!1){return t?e.indexOf("\\")<0&&e.indexOf("$")<0?e:e.split("").map(n=>{const s=n.codePointAt(0);return s===O.CODES.get("\\")||s===O.CODES.get("$")?`\\${n}`:n}).join(""):e.indexOf("$")<0?e:e.split("").map(n=>n.codePointAt(0)===O.CODES.get("$")?"$$":n).join("")}constructor(e,t){if(e===null)throw new Error("pattern is null");this.patternInput=e;const n=this.patternInput.re2();this.patternGroupCount=n.numberOfCapturingGroups(),this.groups=[],this.namedGroups=n.namedGroups,this.numberOfInstructions=n.numberOfInstructions(),t instanceof dr?this.resetMatcherInput(t):W.isByteArray(t)?this.resetMatcherInput(rr.utf8(t)):this.resetMatcherInput(rr.utf16(t))}pattern(){return this.patternInput}reset(){return this.matcherInputLength=this.matcherInput.length(),this.appendPos=0,this.hasMatch=!1,this.hasGroups=!1,this.anchorFlag=0,this}resetMatcherInput(e){if(e===null)throw new Error("input is null");return e instanceof dr||(W.isByteArray(e)?e=rr.utf8(e):e=rr.utf16(e)),this.matcherInput=e,this.reset(),this}start(e=0){if(typeof e=="string"){const t=this.namedGroups[e];if(!Number.isFinite(t))throw new at(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e]}end(e=0){if(typeof e=="string"){const t=this.namedGroups[e];if(!Number.isFinite(t))throw new at(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e+1]}programSize(){return this.numberOfInstructions}group(e=0){if(typeof e=="string"){const s=this.namedGroups[e];if(!Number.isFinite(s))throw new at(`group '${e}' not found`);e=s}const t=this.start(e),n=this.end(e);return t<0&&n<0?null:this.substring(t,n)}getNamedGroups(){if(!this.hasMatch)throw new at("perhaps no match attempted");const e=Object.create(null);for(const t of Object.keys(this.namedGroups))e[t]=this.group(t);return e}groupCount(){return this.patternGroupCount}loadGroup(e){if(e<0||e>this.patternGroupCount)throw new at(`Group index out of bounds: ${e}`);if(!this.hasMatch)throw new at("perhaps no match attempted");if(e===0||this.hasGroups)return;const t=this.matcherInputLength,n=this.patternInput.re2().matchMachineInput(this.matcherInput,this.groups[0],t,this.anchorFlag,1+this.patternGroupCount);if(!n[0])throw new at("inconsistency in matching group data");this.groups=n[1],this.hasGroups=!0}matches(){return this.genMatch(0,x.ANCHOR_BOTH)}lookingAt(){return this.genMatch(0,x.ANCHOR_START)}find(e=null){if(e!==null){if(e<0||e>this.matcherInputLength)throw new at(`start index out of bounds: ${e}`);return this.reset(),this.genMatch(e,0)}if(e=0,this.hasMatch&&(e=this.groups[1],this.groups[0]===this.groups[1])){const t=(this.matcherInput.isUTF16Encoding()?we.fromUTF16(this.matcherInput.asCharSequence(),0,this.matcherInputLength):we.fromUTF8(this.matcherInput.asBytes(),0,this.matcherInputLength)).step(e);t<0?e++:e+=t&7}return this.genMatch(e,x.UNANCHORED)}genMatch(e,t){const n=this.patternInput.re2().matchMachineInput(this.matcherInput,e,this.matcherInputLength,t,1);return n[0]?(this.groups=n[1],this.hasMatch=!0,this.hasGroups=this.patternGroupCount===0,this.anchorFlag=t,!0):(this.hasMatch=!1,!1)}substring(e,t){return this.matcherInput.isUTF8Encoding()?W.utf8ByteArrayToString(this.matcherInput.asBytes().slice(e,t)):this.matcherInput.asCharSequence().substring(e,t).toString()}inputLength(){return this.matcherInputLength}appendReplacement(e,t=!1){let n="";const s=this.start(),i=this.end();return this.appendPos<s&&(n+=this.substring(this.appendPos,s)),this.appendPos=i,n+=t?this.appendReplacementInternalJava(e):this.appendReplacementInternalJs(e),n}appendReplacementInternalJava(e){let t="",n=0;const s=e.length;let i=0;for(;i<s;){const o=e.codePointAt(i);if(o===O.CODES.get("\\")){if(n<i&&(t+=e.substring(n,i)),i++,i>=s)throw new at("character to be escaped is missing");n=i,i++;continue}if(o===O.CODES.get("$")){if(n<i&&(t+=e.substring(n,i)),i+1>=s)throw new at("Illegal group reference: group index is missing");const B=e.codePointAt(i+1);if(O.CODES.get("0")<=B&&B<=O.CODES.get("9")){let u=B-O.CODES.get("0"),c=i+2;for(;c<s;c++){const f=e.codePointAt(c);if(f<O.CODES.get("0")||f>O.CODES.get("9")||u*10+f-O.CODES.get("0")>this.patternGroupCount)break;u=u*10+f-O.CODES.get("0")}if(u>this.patternGroupCount)throw new at(`n > number of groups: ${u}`);const h=this.group(u);h!==null&&(t+=h),i=c,n=i}else if(B===O.CODES.get("{")){let u=i+2;for(;u<s&&e.codePointAt(u)!==O.CODES.get("}");)u++;if(u>=s)throw new at("named capture group is missing trailing '}'");const c=e.substring(i+2,u),h=this.group(c);h!==null&&(t+=h),i=u+1,n=i}else throw new at("Illegal group reference");continue}i++}return n<s&&(t+=e.substring(n,s)),t}appendReplacementInternalJs(e){let t="",n=0;const s=e.length;for(let i=0;i<s-1;i++)if(e.codePointAt(i)===O.CODES.get("$")){let o=e.codePointAt(i+1);if(O.CODES.get("$")===o){n<i&&(t+=e.substring(n,i)),t+="$",i++,n=i+1;continue}else if(O.CODES.get("&")===o){n<i&&(t+=e.substring(n,i));const B=this.group(0);B!==null?t+=B:t+="$&",i++,n=i+1;continue}else if(O.CODES.get("`")===o){n<i&&(t+=e.substring(n,i)),t+=this.substring(0,this.start(0)),i++,n=i+1;continue}else if(O.CODES.get("'")===o){n<i&&(t+=e.substring(n,i)),t+=this.substring(this.end(0),this.matcherInputLength),i++,n=i+1;continue}else if(O.CODES.get("1")<=o&&o<=O.CODES.get("9")){let B=o-O.CODES.get("0");for(n<i&&(t+=e.substring(n,i)),i+=2;i<s&&(o=e.codePointAt(i),!(o<O.CODES.get("0")||o>O.CODES.get("9")||B*10+o-O.CODES.get("0")>this.patternGroupCount));i++)B=B*10+o-O.CODES.get("0");if(B>this.patternGroupCount){t+=`$${B}`,n=i,i--;continue}const u=this.group(B);u!==null&&(t+=u),n=i,i--;continue}else if(o===O.CODES.get("<")){n<i&&(t+=e.substring(n,i)),i++;let B=i+1;for(;B<e.length&&e.codePointAt(B)!==O.CODES.get(">")&&e.codePointAt(B)!==O.CODES.get(" ");)B++;if(B===e.length||e.codePointAt(B)!==O.CODES.get(">")){t+=e.substring(i-1,B+1),n=B+1,i=B;continue}const u=e.substring(i+1,B);if(Object.prototype.hasOwnProperty.call(this.namedGroups,u)){const c=this.group(u);c!==null&&(t+=c)}else t+=`$<${u}>`;n=B+1,i=B;continue}}return n<s&&(t+=e.substring(n,s)),t}appendTail(){return this.substring(this.appendPos,this.matcherInputLength)}replaceAll(e,t=!1){return this.replace(e,!0,t)}replaceFirst(e,t=!1){return this.replace(e,!1,t)}replace(e,t=!0,n=!1){let s="";this.reset();const i=typeof e=="function",o=Object.keys(this.namedGroups).length>0;let B=null;if(i){if(this.groupCount()>=ir.MAX_REPLACER_ARGS)throw new at("Too many capture groups to safely invoke replacer function");B=this.matcherInput.isUTF8Encoding()?this.matcherInput.asBytes():this.matcherInput.asCharSequence()}for(;this.find()&&(s+=i?this.appendReplacementFunc(e,o,B):this.appendReplacement(e,n),!!t););return s+=this.appendTail(),s}appendReplacementFunc(e,t,n){let s="";const i=this.start(),o=this.end();this.appendPos<i&&(s+=this.substring(this.appendPos,i)),this.appendPos=o;const B=this.buildReplacerArgs(i,t,n);return s+=String(e(...B)),s}buildReplacerArgs(e,t,n){const s=[this.group(0)],i=this.groupCount();for(let o=1;o<=i;o++){const B=this.start(o);B<0?s.push(void 0):s.push(this.substring(B,this.end(o)))}if(s.push(e),s.push(n),t){const o=this.getNamedGroups();for(const B in o)o[B]===null&&(o[B]=void 0);s.push(o)}return s}},G(ir,"MAX_REPLACER_ARGS",65535),ir),ue,N=(ue=class{static isRuneOp(e){return ue.RUNE<=e&&e<=ue.RUNE_ANY_NOT_NL}static escapeRunes(e){let t='"';for(let n of e)t+=W.escapeRune(n);return t+='"',t}constructor(e){this.op=e,this.out=0,this.arg=0,this.runes=[],this.next=null}matchRune(e){if(this.runes.length===1){const o=this.runes[0];return this.arg&x.FOLD_CASE?z.equalsIgnoreCase(o,e):e===o}const t=this.runes.length;if(t===0)return!1;if(t===2||t===4||t===6||t===8){for(let o=0;o<t;o+=2){if(e<this.runes[o])return!1;if(e<=this.runes[o+1])return!0}return!1}let n=0,s=t>>1;for(;s>1;){const o=s>>1;n+=this.runes[n+o<<1]<=e?o:0,s-=o}n+=this.runes[n<<1]<=e?1:0;const i=n-1;return i>=0&&e<=this.runes[i<<1|1]}matchRunePos(e){if(this.runes.length===1){const o=this.runes[0];return this.arg&x.FOLD_CASE?z.equalsIgnoreCase(o,e)?0:-1:e===o?0:-1}const t=this.runes.length;if(t===0)return-1;if(t===2||t===4||t===6||t===8){for(let o=0;o<t;o+=2){if(e<this.runes[o])return-1;if(e<=this.runes[o+1])return Math.floor(o/2)}return-1}let n=0,s=t>>1;for(;s>1;){const o=s>>1;n+=this.runes[n+o<<1]<=e?o:0,s-=o}n+=this.runes[n<<1]<=e?1:0;const i=n-1;return i>=0&&e<=this.runes[i<<1|1]?i:-1}toString(){switch(this.op){case ue.ALT:return`alt -> ${this.out}, ${this.arg}`;case ue.ALT_MATCH:return`altmatch -> ${this.out}, ${this.arg}`;case ue.CAPTURE:return`cap ${this.arg} -> ${this.out}`;case ue.EMPTY_WIDTH:return`empty ${this.arg} -> ${this.out}`;case ue.MATCH:return`match${this.arg!==0?` ${this.arg}`:""}`;case ue.FAIL:return"fail";case ue.NOP:return`nop -> ${this.out}`;case ue.LB_WRITE:return`lbwrite ${this.arg} -> ${this.out}`;case ue.LB_CHECK:return`lbcheck ${this.arg} -> ${this.out}`;case ue.RUNE:return this.runes===null?"rune <null>":["rune ",ue.escapeRunes(this.runes),this.arg&x.FOLD_CASE?"/i":""," -> ",this.out].join("");case ue.RUNE1:return`rune1 ${ue.escapeRunes(this.runes)} -> ${this.out}`;case ue.RUNE_ANY:return`any -> ${this.out}`;case ue.RUNE_ANY_NOT_NL:return`anynotnl -> ${this.out}`;default:throw new Error("unhandled case in Inst.toString")}}},G(ue,"ALT",1),G(ue,"ALT_MATCH",2),G(ue,"CAPTURE",3),G(ue,"EMPTY_WIDTH",4),G(ue,"FAIL",5),G(ue,"MATCH",6),G(ue,"NOP",7),G(ue,"RUNE",8),G(ue,"RUNE1",9),G(ue,"RUNE_ANY",10),G(ue,"RUNE_ANY_NOT_NL",11),G(ue,"LB_WRITE",12),G(ue,"LB_CHECK",13),ue),gl=class{constructor(r){this.sparse=new Int32Array(r),this.densePcs=new Int32Array(r),this.denseCaps=null,this.size=0,this.ncap=0}init(r){this.ncap=r;const e=this.densePcs.length*r;(!this.denseCaps||this.denseCaps.length<e)&&(this.denseCaps=new Int32Array(e))}contains(r){const e=this.sparse[r];return e<this.size&&this.densePcs[e]===r}isEmpty(){return this.size===0}add(r){const e=this.size++;return this.sparse[r]=e,this.densePcs[e]=r,e}clear(){this.size=0}toString(){let r="{";for(let e=0;e<this.size;e++)e!==0&&(r+=", "),r+=this.densePcs[e];return r+="}",r}},p_=class BB{static fromRE2(e){const t=new BB;return t.prog=e.prog,t.re2=e,t.q0=new gl(t.prog.numInst()),t.q1=new gl(t.prog.numInst()),t.matched=!1,t.matchcap=new Int32Array(t.prog.numCap<2?2:t.prog.numCap),t.ncap=0,t}static fromMachine(e){return BB.fromRE2(e.re2)}constructor(){this.prog=null,this.re2=null,this.q0=null,this.q1=null,this.matched=!1,this.matchcap=null,this.ncap=0,this.lbTable=null}init(e){this.ncap=e,e>this.matchcap.length?this.matchcap=new Int32Array(e).fill(-1):this.matchcap.fill(-1),this.q0.init(e),this.q1.init(e),this.prog.numLb>0&&((!this.lbTable||this.lbTable.length<this.prog.numLb+1)&&(this.lbTable=new Int32Array(this.prog.numLb+1)),this.lbTable.fill(-1))}submatches(){return this.ncap===0?W.emptyInts():W.toArray(this.matchcap.subarray(0,this.ncap))}match(e,t,n){const s=this.re2.cond;if(s===W.EMPTY_ALL||(n===x.ANCHOR_START||n===x.ANCHOR_BOTH)&&t!==0)return!1;this.matched=!1,this.matchcap.fill(-1);let i=this.prog.numLb>0?0:t,o=t,B=this.q0,u=this.q1,c=e.step(i),h=c>>3,f=c&7,p=-1,w=0;c!==rt.EOF()&&(c=e.step(i+f),p=c>>3,w=c&7);let R;for(i===0?R=W.emptyOpContext(-1,h):R=e.context(i);;){if(B.isEmpty()){if(s&W.EMPTY_BEGIN_TEXT&&i!==0||(n===x.ANCHOR_START||n===x.ANCHOR_BOTH)&&i!==0||this.matched)break;if(this.prog.numLb===0&&this.re2.prefix.length!==0&&p!==this.re2.prefixRune&&e.canCheckPrefix()){const K=e.index(this.re2,i);if(K<0)break;i+=K,c=e.step(i),h=c>>3,f=c&7,c=e.step(i+f),p=c>>3,w=c&7,R=e.context(i)}}if(i===0&&this.prog.numLb>0)for(let K=0;K<this.prog.lbStarts.length;K++)this.add(B,this.prog.lbStarts[K],i,this.matchcap,0,R);!this.matched&&(i===0||n===x.UNANCHORED)&&i>=o&&(this.ncap>0&&(this.matchcap[0]=i),this.add(B,this.prog.start,i,this.matchcap,0,R));const k=i+f;if(R=e.context(k),this.step(B,u,i,k,h,R,n,i===e.endPos()),f===0||this.ncap===0&&this.matched)break;i+=f,h=p,f=w,h!==-1&&(c=e.step(i+f),p=c>>3,w=c&7);const M=B;B=u,u=M}return u.clear(),this.matched}matchSet(e,t,n){const s=this.re2.cond;if(s===W.EMPTY_ALL)return[];if((n===x.ANCHOR_START||n===x.ANCHOR_BOTH)&&t!==0)return[];let i=this.prog.numLb>0?0:t,o=t,B=this.q0,u=this.q1,c=e.step(i),h=c>>3,f=c&7,p=-1,w=0;c!==rt.EOF()&&(c=e.step(i+f),p=c>>3,w=c&7);let R=i===0?W.emptyOpContext(-1,h):e.context(i);const k=new Set;for(;!(B.isEmpty()&&(s&W.EMPTY_BEGIN_TEXT&&i!==0||(n===x.ANCHOR_START||n===x.ANCHOR_BOTH)&&i!==0));){if(i===0&&this.prog.numLb>0)for(let ee=0;ee<this.prog.lbStarts.length;ee++)this.add(B,this.prog.lbStarts[ee],i,this.matchcap,0,R);(i===0||n===x.UNANCHORED)&&i>=o&&this.add(B,this.prog.start,i,this.matchcap,0,R);const M=i+f;R=e.context(M);for(let ee=0;ee<B.size;ee++){const Be=B.densePcs[ee],he=this.prog.inst[Be],Ae=ee*this.ncap;let Ee=!1;switch(he.op){case N.MATCH:if(n===x.ANCHOR_BOTH&&i!==e.endPos())break;k.add(he.arg);break;case N.RUNE:Ee=he.matchRune(h);break;case N.RUNE1:Ee=h===he.runes[0];break;case N.RUNE_ANY:Ee=!0;break;case N.RUNE_ANY_NOT_NL:Ee=h!==10;break;default:continue}Ee&&this.add(u,he.out,M,B.denseCaps,Ae,R)}if(B.clear(),f===0)break;i+=f,h=p,f=w,h!==-1&&(c=e.step(i+f),p=c>>3,w=c&7);const K=B;B=u,u=K}return u.clear(),Array.from(k).sort((M,K)=>M-K)}step(e,t,n,s,i,o,B,u){const c=this.re2.longest;for(let h=0;h<e.size;h++){const f=e.densePcs[h],p=h*this.ncap;if(c&&this.matched&&this.ncap>0&&this.matchcap[0]<e.denseCaps[p])continue;const w=this.prog.inst[f];let R=!1;switch(w.op){case N.MATCH:if(B===x.ANCHOR_BOTH&&!u)break;if(this.ncap>0&&(!c||!this.matched||this.matchcap[1]<n)){e.denseCaps[p+1]=n;for(let k=0;k<this.ncap;k++)this.matchcap[k]=e.denseCaps[p+k]}c||(e.size=0),this.matched=!0;break;case N.RUNE:R=w.matchRune(i);break;case N.RUNE1:R=i===w.runes[0];break;case N.RUNE_ANY:R=!0;break;case N.RUNE_ANY_NOT_NL:R=i!==10;break;default:continue}R&&this.add(t,w.out,s,e.denseCaps,p,o)}e.clear()}add(e,t,n,s,i,o){for(;;){if(t===0||e.contains(t))return;const B=e.add(t),u=this.prog.inst[t];switch(u.op){case N.FAIL:return;case N.ALT:case N.ALT_MATCH:this.add(e,u.out,n,s,i,o),t=u.arg;continue;case N.EMPTY_WIDTH:if(!(u.arg&~o)){t=u.out;continue}return;case N.NOP:t=u.out;continue;case N.CAPTURE:if(u.arg<this.ncap){const c=s[i+u.arg];s[i+u.arg]=n,this.add(e,u.out,n,s,i,o),s[i+u.arg]=c;return}else{t=u.out;continue}case N.LB_WRITE:this.lbTable[Math.abs(u.arg)]=n,t=u.out;continue;case N.LB_CHECK:if(u.arg>0){if(this.lbTable[u.arg]===n){t=u.out;continue}}else if(this.lbTable[-u.arg]!==n){t=u.out;continue}return;case N.MATCH:case N.RUNE:case N.RUNE1:case N.RUNE_ANY:case N.RUNE_ANY_NOT_NL:if(this.ncap>0){const c=B*this.ncap;for(let h=0;h<this.ncap;h++)e.denseCaps[c+h]=s[i+h]}return;default:throw new ys("unhandled")}}}};const ml=r=>{let e=-2128831035;for(let t=0;t<r.length;t++)e^=r[t],e=Math.imul(e,16777619);return e},g_=(r,e)=>{if(r.length!==e.length)return!1;for(let t=0;t<r.length;t++)if(r[t]!==e[t])return!1;return!0};var m_=class{constructor(r,e,t=[]){this.nfaStates=r,this.isMatch=e,this.matchIDs=t,this.nextLatin1=new Array(z.MAX_LATIN1+1).fill(null),this.nextLatin1Anchored=new Array(z.MAX_LATIN1+1).fill(null),this.transKeys=[],this.transVals=[],this.lastSeen=0}},Wt,E_=(Wt=class{constructor(e,t=8388608){this.prog=e,this.stateCache=new Map,this.stateCount=0,this.startState=null,this.stateLimit=Math.max(1,Math.floor(t/Wt.STATE_MEMORY_ESTIMATE)),this.cacheClears=0,this.failed=!1,this.clock=0}computeClosure(e){const t=new Set,n=[...e];let s=!1;const i=[];for(;n.length>0;){const B=n.pop();if(t.has(B))continue;t.add(B);const u=this.prog.getInst(B);switch(u.op){case N.MATCH:s=!0,i.includes(u.arg)||i.push(u.arg);break;case N.ALT:case N.ALT_MATCH:n.push(u.out),n.push(u.arg);break;case N.NOP:case N.CAPTURE:n.push(u.out);break;case N.EMPTY_WIDTH:case N.LB_WRITE:case N.LB_CHECK:return null}}const o=Int32Array.from(t).sort();return i.sort((B,u)=>B-u),{pcs:o,isMatch:s,matchIDs:i}}getState(e){const t=this.computeClosure(e);if(!t)return null;const n=t.pcs,s=ml(n);let i=this.stateCache.get(s);if(i)for(let B=0;B<i.length;B++){const u=i[B];if(g_(u.nfaStates,n))return u.lastSeen=++this.clock,u}else i=[],this.stateCache.set(s,i);if(this.failed)return null;if(this.stateCount>=this.stateLimit){if(this.cacheClears++,this.cacheClears>=Wt.MAX_CACHE_CLEARS)return this.failed=!0,this.stateCache.clear(),this.stateCount=0,this.startState=null,null;this.evictCache(),i=this.stateCache.get(s),i||(i=[],this.stateCache.set(s,i))}const o=new m_(n,t.isMatch,t.matchIDs);return o.lastSeen=++this.clock,i.push(o),this.stateCount++,o}evictCache(){const e=[];for(const o of this.stateCache.values())for(let B=0;B<o.length;B++)e.push(o[B]);e.sort((o,B)=>o.lastSeen-B.lastSeen);const t=Math.max(1,Math.floor(this.stateLimit/2)),n=e.length-t,s=e.slice(n),i=new Set(s);this.stateCache.clear(),this.stateCount=0;for(let o=0;o<s.length;o++){const B=s[o];B.nextLatin1.fill(null),B.nextLatin1Anchored.fill(null),B.transKeys.length=0,B.transVals.length=0;const u=ml(B.nfaStates);let c=this.stateCache.get(u);c||(c=[],this.stateCache.set(u,c)),c.push(B),this.stateCount++}this.startState&&!i.has(this.startState)&&(this.startState=null)}step(e,t,n){if(t<=z.MAX_LATIN1)if(n===x.UNANCHORED){const o=e.nextLatin1[t];if(o!==null)return o}else{const o=e.nextLatin1Anchored[t];if(o!==null)return o}else{const o=t+(n===x.UNANCHORED?0:z.MAX_RUNE+1),B=e.transKeys,u=B.length;for(let c=0;c<u;c++)if(B[c]===o)return e.transVals[c]}const s=[];for(let o=0;o<e.nfaStates.length;o++){const B=e.nfaStates[o],u=this.prog.getInst(B);N.isRuneOp(u.op)&&u.matchRune(t)&&s.push(u.out)}n===x.UNANCHORED&&s.push(this.prog.start);const i=this.getState(s);if(t<=z.MAX_LATIN1)n===x.UNANCHORED?e.nextLatin1[t]=i:e.nextLatin1Anchored[t]=i;else{const o=t+(n===x.UNANCHORED?0:z.MAX_RUNE+1);e.transKeys.push(o),e.transVals.push(i)}return i}match(e,t,n){if((n===x.ANCHOR_START||n===x.ANCHOR_BOTH)&&t!==0)return!1;if(!this.startState&&(this.startState=this.getState([this.prog.start]),!this.startState))return null;let s=e.endPos(),i=this.startState;if(i.isMatch)if(n===x.ANCHOR_BOTH){if(t===s)return!0}else return!0;let o=t;for(;o<s;){const B=e.step(o),u=B>>3,c=B&7;if(c===0)break;if(i=n===x.UNANCHORED&&u<=z.MAX_LATIN1&&i.nextLatin1[u]||this.step(i,u,n),i===null)return null;if(i.lastSeen=++this.clock,i.isMatch)if(n===x.ANCHOR_BOTH){if(o+c===s)return!0}else return!0;if(i.nfaStates.length===0&&n!==x.UNANCHORED)return!1;o+=c}return!1}matchSet(e,t,n){if((n===x.ANCHOR_START||n===x.ANCHOR_BOTH)&&t!==0)return[];if(!this.startState&&(this.startState=this.getState([this.prog.start]),!this.startState))return null;let s=e.endPos(),i=this.startState;const o=new Set,B=(c,h)=>{c.isMatch&&(n===x.ANCHOR_BOTH?h===s&&c.matchIDs.forEach(f=>o.add(f)):c.matchIDs.forEach(f=>o.add(f)))};B(i,t);let u=t;for(;u<s;){const c=e.step(u),h=c>>3,f=c&7;if(f===0)break;if(i=n===x.UNANCHORED&&h<=z.MAX_LATIN1&&i.nextLatin1[h]||this.step(i,h,n),i===null)return null;if(i.lastSeen=++this.clock,u+=f,B(i,u),i.nfaStates.length===0&&n!==x.UNANCHORED)break}return Array.from(o).sort((c,h)=>c-h)}},G(Wt,"MAX_CACHE_CLEARS",5),G(Wt,"STATE_MEMORY_ESTIMATE",838),Wt);const __=32,D_=500,Ga=256,w_=256*1024;var I_=class{constructor(){this.end=0,this.cap=new Int32Array(0),this.matchcap=new Int32Array(0),this.ncap=0,this.jobPc=new Int32Array(Ga),this.jobArg=new Uint8Array(Ga),this.jobPos=new Int32Array(Ga),this.jobLen=0,this.visited=new Uint32Array(0)}reset(r,e,t){this.end=e,this.jobLen=0,this.ncap=t;const n=r.numInst()*(e+1)+__-1>>>5;this.visited.length<n?this.visited=new Uint32Array(n):this.visited.fill(0,0,n),this.cap.length<t?this.cap=new Int32Array(t).fill(-1):this.cap.fill(-1,0,t),this.matchcap.length<t?this.matchcap=new Int32Array(t).fill(-1):this.matchcap.fill(-1,0,t)}shouldVisit(r,e){const t=r*(this.end+1)+e,n=t>>>5,s=1<<(t&31);return this.visited[n]&s?!1:(this.visited[n]|=s,!0)}push(r,e,t,n){if(r.prog.getInst(e).op!==N.FAIL&&(n||this.shouldVisit(e,t))){if(this.jobLen>=this.jobPc.length){const s=this.jobPc.length*2,i=new Int32Array(s);i.set(this.jobPc),this.jobPc=i;const o=new Uint8Array(s);o.set(this.jobArg),this.jobArg=o;const B=new Int32Array(s);B.set(this.jobPos),this.jobPos=B}this.jobPc[this.jobLen]=e,this.jobArg[this.jobLen]=n?1:0,this.jobPos[this.jobLen]=t,this.jobLen++}}tryBacktrack(r,e,t,n,s){const i=r.longest;for(this.push(r,t,n,!1);this.jobLen>0;){this.jobLen--;let o=this.jobPc[this.jobLen],B=this.jobArg[this.jobLen]===1,u=this.jobPos[this.jobLen],c=!0;for(;!(!c&&!this.shouldVisit(o,u));){c=!1;const h=r.prog.getInst(o);switch(h.op){case N.FAIL:throw new ys("unexpected InstFail");case N.ALT:if(B){B=!1,o=h.arg;continue}else{this.push(r,o,u,!0),o=h.out;continue}case N.ALT_MATCH:{const f=r.prog.getInst(h.out);if(N.isRuneOp(f.op)){this.push(r,h.arg,u,!1),o=h.arg,u=this.end;continue}this.push(r,h.out,this.end,!1),o=h.out;continue}case N.RUNE:{const f=e.step(u);if(f===rt.EOF()||!h.matchRune(f>>3))break;u+=f&7,o=h.out;continue}case N.RUNE1:{const f=e.step(u);if(f===rt.EOF()||f>>3!==h.runes[0])break;u+=f&7,o=h.out;continue}case N.RUNE_ANY_NOT_NL:{const f=e.step(u);if(f===rt.EOF()||f>>3===10)break;u+=f&7,o=h.out;continue}case N.RUNE_ANY:{const f=e.step(u);if(f===rt.EOF())break;u+=f&7,o=h.out;continue}case N.CAPTURE:if(B){this.cap[h.arg]=u;break}else{h.arg<this.ncap&&(this.push(r,o,this.cap[h.arg],!0),this.cap[h.arg]=u),o=h.out;continue}case N.EMPTY_WIDTH:{const f=e.context(u);if(h.arg&~f)break;o=h.out;continue}case N.NOP:o=h.out;continue;case N.MATCH:{if(s===x.ANCHOR_BOTH&&u!==this.end)break;if(this.ncap===0)return!0;this.ncap>1&&(this.cap[1]=u);const f=this.matchcap[1];if((f===-1||i&&u>0&&u>f)&&this.matchcap.set(this.cap),!i||u===this.end)return!0;break}case N.LB_WRITE:case N.LB_CHECK:throw new ys("Backtracker cannot evaluate Lookbehind instructions");default:throw new ys("bad inst")}break}}return i&&this.matchcap.length>1&&this.matchcap[1]>=0}};const Gi=[];var Ui=class UC{static shouldBacktrack(e){return e.numInst()<=D_}static maxBitStateLen(e){return UC.shouldBacktrack(e)?Math.floor(w_/e.numInst()):0}static execute(e,t,n,s,i){const o=e.cond;if(o===W.EMPTY_ALL||(s===x.ANCHOR_START||s===x.ANCHOR_BOTH)&&n!==0||o&W.EMPTY_BEGIN_TEXT&&n!==0)return null;const B=Gi.length>0?Gi.pop():new I_,u=t.endPos();B.reset(e.prog,u,i);let c=!1;if(o&W.EMPTY_BEGIN_TEXT||s===x.ANCHOR_START||s===x.ANCHOR_BOTH)B.ncap>0&&(B.cap[0]=n),B.tryBacktrack(e,t,e.prog.start,n,s)&&(c=!0);else{let f=-1;for(;n<=u&&f!==0;n+=f){if(e.prefix.length>0){const w=t.index(e,n);if(w<0)break;n+=w}if(B.ncap>0&&(B.cap[0]=n),B.tryBacktrack(e,t,e.prog.start,n,s)){c=!0;break}const p=t.step(n);f=p===rt.EOF()?0:p&7}}if(!c)return Gi.push(B),null;const h=i===0?[]:W.toArray(B.matchcap.subarray(0,i));return Gi.push(B),h}},El=class{constructor(r){this.sparse=new Uint32Array(r),this.dense=new Uint32Array(r),this.size=0,this.nextIndex=0}empty(){return this.nextIndex>=this.size}next(){return this.dense[this.nextIndex++]}clear(){this.size=0,this.nextIndex=0}contains(r){return r<this.sparse.length&&this.sparse[r]<this.size&&this.dense[this.sparse[r]]===r}insert(r){this.contains(r)||this.insertNew(r)}insertNew(r){r>=this.sparse.length||(this.sparse[r]=this.size,this.dense[this.size]=r,this.size++)}};const y_=(r,e,t,n)=>{const s=r.length,i=e.length;let o=0,B=0;const u=[],c=[];let h=!0,f=-1;const p=w=>{const R=w?r:e,k=w?o:B,M=w?t:n;return f>0&&R[k]<=u[f]?!1:(u.push(R[k],R[k+1]),w?o+=2:B+=2,f+=2,c.push(M),!0)};for(;o<s||B<i;)if(B>=i?h=p(!0):o>=s||e[B]<r[o]?h=p(!1):h=p(!0),!h)return null;return{merged:u,next:c}};var T_=class{constructor(r){this.start=r.start,this.numCap=r.numCap,this.inst=new Array(r.inst.length);for(let e=0;e<r.inst.length;e++){const t=r.inst[e],n=new N(t.op);n.out=t.out,n.arg=t.arg,n.runes=t.runes?t.runes.slice():[],n.next=null,this.inst[e]=n}}};const A_=r=>{const e=new T_(r);for(let t=0;t<e.inst.length;t++){const n=e.inst[t];if(n.op!==N.ALT&&n.op!==N.ALT_MATCH)continue;let s="out",i="arg",o=e.inst[n[i]];if(o.op!==N.ALT&&o.op!==N.ALT_MATCH&&(s="arg",i="out",o=e.inst[n[i]],o.op!==N.ALT&&o.op!==N.ALT_MATCH))continue;const B=e.inst[n[s]];if(B.op===N.ALT||B.op===N.ALT_MATCH)continue;let u="out",c="arg",h=!1;o.out===t?h=!0:o.arg===t&&(h=!0,u="arg",c="out"),h&&(o[u]=n[s]),n[s]===o[u]&&(n[i]=o[c])}return e},R_=r=>{if(r.inst.length>=1e3)return null;const e=new El(r.inst.length),t=new El(r.inst.length),n=new Array(r.inst.length),s=new Array(r.inst.length).fill(!1),i=o=>{let B=!0;const u=r.inst[o];if(t.contains(o))return!0;switch(t.insert(o),u.op){case N.ALT:case N.ALT_MATCH:{B=i(u.out)&&i(u.arg);let c=s[u.out],h=s[u.arg];if(c&&h)return!1;if(h){const R=u.out;u.out=u.arg,u.arg=R;const k=c;c=h,h=k}c&&(s[o]=!0,u.op=N.ALT_MATCH);const f=n[u.out]||[],p=n[u.arg]||[],w=y_(f,p,u.out,u.arg);if(!w)return!1;n[o]=w.merged,u.next=new Uint32Array(w.next);break}case N.CAPTURE:case N.EMPTY_WIDTH:case N.NOP:B=i(u.out),s[o]=s[u.out],n[o]=n[u.out]?n[u.out].slice():[],u.next=new Uint32Array(Math.floor(n[o].length/2)+1).fill(u.out);break;case N.MATCH:case N.FAIL:s[o]=u.op===N.MATCH;break;case N.RUNE:{if(s[o]=!1,u.next&&u.next.length>0)break;if(e.insert(u.out),!u.runes||u.runes.length===0){n[o]=[],u.next=new Uint32Array([u.out]);break}let c=[];if(u.runes.length===1&&u.arg&x.FOLD_CASE){const h=u.runes[0];c.push(h,h);for(let f=z.simpleFold(h);f!==h;f=z.simpleFold(f))c.push(f,f);c.sort((f,p)=>f-p)}else for(let h=0;h<u.runes.length;h++)c.push(u.runes[h]);n[o]=c,u.next=new Uint32Array(Math.floor(c.length/2)+1).fill(u.out),u.op=N.RUNE;break}case N.RUNE1:{if(s[o]=!1,u.next&&u.next.length>0)break;e.insert(u.out);let c=[];if(u.arg&x.FOLD_CASE){const h=u.runes[0];c.push(h,h);for(let f=z.simpleFold(h);f!==h;f=z.simpleFold(f))c.push(f,f);c.sort((f,p)=>f-p)}else c.push(u.runes[0],u.runes[0]);n[o]=c,u.next=new Uint32Array(Math.floor(c.length/2)+1).fill(u.out),u.op=N.RUNE;break}case N.RUNE_ANY:if(s[o]=!1,u.next&&u.next.length>0)break;e.insert(u.out),n[o]=[0,z.MAX_RUNE],u.next=new Uint32Array([u.out]);break;case N.RUNE_ANY_NOT_NL:if(s[o]=!1,u.next&&u.next.length>0)break;e.insert(u.out),n[o]=[0,9,11,z.MAX_RUNE],u.next=new Uint32Array(Math.floor(n[o].length/2)+1).fill(u.out);break}return B};for(e.clear(),e.insert(r.start);!e.empty();)if(t.clear(),!i(e.next()))return null;for(let o=0;o<r.inst.length;o++)n[o]&&(r.inst[o].runes=n[o]);return r},v_=(r,e)=>{for(let t=0;t<e.inst.length;t++){const n=e.inst[t];switch(n.op){case N.ALT:case N.ALT_MATCH:case N.RUNE:break;case N.CAPTURE:case N.EMPTY_WIDTH:case N.NOP:case N.MATCH:case N.FAIL:r.inst[t].next=null;break;case N.RUNE1:case N.RUNE_ANY:case N.RUNE_ANY_NOT_NL:r.inst[t].next=null,r.inst[t].op=n.op,r.inst[t].runes=n.runes?n.runes.slice():[];break}}};var _l=class HC{static compile(e){if(e.start===0||e.numLb>0)return null;const t=e.inst[e.start];if(t.op!==N.EMPTY_WIDTH||!(t.arg&W.EMPTY_BEGIN_TEXT))return null;let n=!1;for(let i=0;i<e.inst.length;i++)if(e.inst[i].op===N.ALT||e.inst[i].op===N.ALT_MATCH){n=!0;break}for(let i=0;i<e.inst.length;i++){const o=e.inst[i],B=e.inst[o.out].op;switch(o.op){case N.ALT:case N.ALT_MATCH:if(B===N.MATCH||e.inst[o.arg].op===N.MATCH)return null;break;case N.EMPTY_WIDTH:if(B===N.MATCH){if((o.arg&W.EMPTY_END_TEXT)===W.EMPTY_END_TEXT)continue;return null}break;default:if(B===N.MATCH&&n)return null;break}}let s=A_(e);return s=R_(s),s!==null&&v_(s,e),s}static next(e,t){const n=e.matchRunePos(t);return n>=0?e.next[n]:e.op===N.ALT_MATCH?e.out:0}static execute(e,t,n,s,i){const o=e.onepass;if(!o)return null;const B=new Int32Array(i).fill(-1);let u=!1,c=t.step(n),h=c>>3,f=c&7,p=rt.EOF(),w=-1,R=0;c!==rt.EOF()&&(p=t.step(n+f),p!==rt.EOF()&&(w=p>>3,R=p&7));let k=n===0?W.emptyOpContext(-1,h):t.context(n),M=o.start,K;for(;;){switch(K=o.inst[M],M=K.out,K.op){case N.MATCH:return s===x.ANCHOR_BOTH&&n!==t.endPos()?null:(u=!0,B.length>0&&(B[0]=0,B[1]=n),i===0?[]:W.toArray(B));case N.RUNE:if(!K.matchRune(h))return null;break;case N.RUNE1:if(h!==K.runes[0])return null;break;case N.RUNE_ANY:break;case N.RUNE_ANY_NOT_NL:if(h===10)return null;break;case N.ALT:case N.ALT_MATCH:M=HC.next(K,h);continue;case N.FAIL:return null;case N.NOP:continue;case N.EMPTY_WIDTH:if(K.arg&~k)return null;continue;case N.CAPTURE:K.arg<B.length&&(B[K.arg]=n);continue;default:throw new ys("bad inst")}if(f===0)break;k=W.emptyOpContext(h,w),n+=f,h=w,f=R,h!==-1&&(p=t.step(n+f),p!==rt.EOF()?(w=p>>3,R=p&7):(w=-1,R=0))}return u?i===0?[]:W.toArray(B):null}},Y,y=(Y=class{static isPseudoOp(e){return e>=Y.Op.LEFT_PAREN}static emptySubs(){return[]}static quoteIfHyphen(e){return e===O.CODES.get("-")?"\\":""}static fromRegexp(e){const t=new Y(e.op);return t.flags=e.flags,t.subs=e.subs,t.runes=e.runes,t.cap=e.cap,t.min=e.min,t.max=e.max,t.name=e.name,t.namedGroups=e.namedGroups,t.lb=e.lb,t}constructor(e){this.op=e,this.flags=0,this.subs=Y.emptySubs(),this.runes=[],this.min=0,this.max=0,this.cap=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}reinit(){this.flags=0,this.subs=Y.emptySubs(),this.runes=[],this.cap=0,this.min=0,this.max=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}toString(){return this.appendTo()}appendTo(){let e="";switch(this.op){case Y.Op.NO_MATCH:e+="[^\\x00-\\x{10FFFF}]";break;case Y.Op.EMPTY_MATCH:e+="(?:)";break;case Y.Op.STAR:case Y.Op.PLUS:case Y.Op.QUEST:case Y.Op.REPEAT:{const t=this.subs[0];switch(t.op>Y.Op.CAPTURE||t.op===Y.Op.LITERAL&&t.runes.length>1?e+=`(?:${t.appendTo()})`:e+=t.appendTo(),this.op){case Y.Op.STAR:e+="*";break;case Y.Op.PLUS:e+="+";break;case Y.Op.QUEST:e+="?";break;case Y.Op.REPEAT:e+=`{${this.min}`,this.min!==this.max&&(e+=",",this.max>=0&&(e+=this.max)),e+="}";break}this.flags&x.NON_GREEDY&&(e+="?");break}case Y.Op.CONCAT:for(let t of this.subs)t.op===Y.Op.ALTERNATE?e+=`(?:${t.appendTo()})`:e+=t.appendTo();break;case Y.Op.ALTERNATE:{let t="";for(let n of this.subs)e+=t,t="|",e+=n.appendTo();break}case Y.Op.LITERAL:this.flags&x.FOLD_CASE&&(e+="(?i:");for(let t of this.runes)e+=W.escapeRune(t);this.flags&x.FOLD_CASE&&(e+=")");break;case Y.Op.ANY_CHAR_NOT_NL:e+="(?-s:.)";break;case Y.Op.ANY_CHAR:e+="(?s:.)";break;case Y.Op.PLB:e+=`(?<=${this.subs[0].appendTo()})`;break;case Y.Op.NLB:e+=`(?<!${this.subs[0].appendTo()})`;break;case Y.Op.CAPTURE:this.name===null||this.name.length===0?e+="(":e+=`(?P<${this.name}>`,this.subs[0].op!==Y.Op.EMPTY_MATCH&&(e+=this.subs[0].appendTo()),e+=")";break;case Y.Op.BEGIN_TEXT:e+="\\A";break;case Y.Op.END_TEXT:this.flags&x.WAS_DOLLAR?e+="(?-m:$)":e+="\\z";break;case Y.Op.BEGIN_LINE:e+="^";break;case Y.Op.END_LINE:e+="$";break;case Y.Op.WORD_BOUNDARY:e+="\\b";break;case Y.Op.NO_WORD_BOUNDARY:e+="\\B";break;case Y.Op.CHAR_CLASS:if(this.runes.length%2!==0){e+="[invalid char class]";break}if(e+="[",this.runes.length===0)e+="^\\x00-\\x{10FFFF}";else if(this.runes[0]===0&&this.runes[this.runes.length-1]===z.MAX_RUNE){e+="^";for(let t=1;t<this.runes.length-1;t+=2){const n=this.runes[t]+1,s=this.runes[t+1]-1;e+=Y.quoteIfHyphen(n),e+=W.escapeRune(n),n!==s&&(e+="-",e+=Y.quoteIfHyphen(s),e+=W.escapeRune(s))}}else for(let t=0;t<this.runes.length;t+=2){const n=this.runes[t],s=this.runes[t+1];e+=Y.quoteIfHyphen(n),e+=W.escapeRune(n),n!==s&&(e+="-",e+=Y.quoteIfHyphen(s),e+=W.escapeRune(s))}e+="]";break;default:e+=this.op;break}return e}maxCap(){let e=0;if(this.op===Y.Op.CAPTURE&&(e=this.cap),this.subs!==null)for(let t of this.subs){const n=t.maxCap();e<n&&(e=n)}return e}equals(e){if(!(e!==null&&e instanceof Y)||this.op!==e.op)return!1;switch(this.op){case Y.Op.END_TEXT:if((this.flags&x.WAS_DOLLAR)!==(e.flags&x.WAS_DOLLAR))return!1;break;case Y.Op.LITERAL:case Y.Op.CHAR_CLASS:if(this.runes===null&&e.runes===null)break;if(this.runes===null||e.runes===null||this.runes.length!==e.runes.length)return!1;for(let t=0;t<this.runes.length;t++)if(this.runes[t]!==e.runes[t])return!1;break;case Y.Op.ALTERNATE:case Y.Op.CONCAT:if(this.subs.length!==e.subs.length)return!1;for(let t=0;t<this.subs.length;++t)if(!this.subs[t].equals(e.subs[t]))return!1;break;case Y.Op.STAR:case Y.Op.PLUS:case Y.Op.QUEST:if((this.flags&x.NON_GREEDY)!==(e.flags&x.NON_GREEDY)||!this.subs[0].equals(e.subs[0]))return!1;break;case Y.Op.REPEAT:if((this.flags&x.NON_GREEDY)!==(e.flags&x.NON_GREEDY)||this.min!==e.min||this.max!==e.max||!this.subs[0].equals(e.subs[0]))return!1;break;case Y.Op.CAPTURE:if(this.cap!==e.cap||(this.name===null?e.name!==null:this.name!==e.name)||!this.subs[0].equals(e.subs[0]))return!1;break;case Y.Op.PLB:case Y.Op.NLB:if(this.lb!==e.lb||!this.subs[0].equals(e.subs[0]))return!1;break}return!0}},G(Y,"Op",GC(["NO_MATCH","EMPTY_MATCH","LITERAL","CHAR_CLASS","ANY_CHAR_NOT_NL","ANY_CHAR","BEGIN_LINE","END_LINE","BEGIN_TEXT","END_TEXT","WORD_BOUNDARY","NO_WORD_BOUNDARY","CAPTURE","STAR","PLUS","QUEST","REPEAT","CONCAT","ALTERNATE","PLB","NLB","LEFT_PAREN","VERTICAL_BAR"])),Y),Dl=class{constructor(r){this.next=[Object.create(null)],this.fail=[0],this.match=[!1];for(const t of r){let n=0;for(let s=0;s<t.length;s++){const i=t[s];i in this.next[n]||(this.next.push(Object.create(null)),this.fail.push(0),this.match.push(!1),this.next[n][i]=this.next.length-1),n=this.next[n][i]}this.match[n]=!0}const e=[];for(const t in this.next[0])if(Object.prototype.hasOwnProperty.call(this.next[0],t)){const n=this.next[0][t];this.fail[n]=0,e.push(n)}for(;e.length>0;){const t=e.shift();for(const n in this.next[t])if(Object.prototype.hasOwnProperty.call(this.next[t],n)){const s=this.next[t][n];let i=this.fail[t];for(;i!==0&&!(n in this.next[i]);)i=this.fail[i];n in this.next[i]?this.fail[s]=this.next[i][n]:this.fail[s]=0,this.match[s]=this.match[s]||this.match[this.fail[s]],e.push(s)}}}searchUTF16(r,e,t){let n=0;for(let s=e;s<t;s++){const i=r.charCodeAt(s);for(;n!==0&&!(i in this.next[n]);)n=this.fail[n];if(i in this.next[n]&&(n=this.next[n][i]),this.match[n])return!0}return!1}searchUTF8(r,e,t){let n=0;for(let s=e;s<t;s++){const i=r[s];for(;n!==0&&!(i in this.next[n]);)n=this.fail[n];if(i in this.next[n]&&(n=this.next[n][i]),this.match[n])return!0}return!1}},Vt,Ce=(Vt=class{constructor(e){this.type=e,this.subs=[],this.str="",this.bytes=null,this.ac16=null,this.ac8=null}eval(e,t){switch(this.type){case Vt.Type.NONE:return!0;case Vt.Type.EXACT:return e.hasString(this,t);case Vt.Type.AND:for(let n=0;n<this.subs.length;n++)if(!this.subs[n].eval(e,t))return!1;return!0;case Vt.Type.OR:if(this.ac16&&this.ac8)return e.hasAnyString(this,t);for(let n=0;n<this.subs.length;n++)if(this.subs[n].eval(e,t))return!0;return!1;default:return!0}}},G(Vt,"Type",{NONE:0,EXACT:1,AND:2,OR:3}),Vt),P_=class Qt{static build(e){const t=Qt.fromRegexp(e);return Qt.simplify(t)}static fromRegexp(e){if(!e)return new Ce(Ce.Type.NONE);switch(e.op){case y.Op.PLB:case y.Op.NLB:case y.Op.NO_MATCH:case y.Op.EMPTY_MATCH:case y.Op.BEGIN_LINE:case y.Op.END_LINE:case y.Op.BEGIN_TEXT:case y.Op.END_TEXT:case y.Op.WORD_BOUNDARY:case y.Op.NO_WORD_BOUNDARY:case y.Op.CHAR_CLASS:case y.Op.ANY_CHAR_NOT_NL:case y.Op.ANY_CHAR:return new Ce(Ce.Type.NONE);case y.Op.LITERAL:{if(e.runes.length===0||e.flags&x.FOLD_CASE)return new Ce(Ce.Type.NONE);const t=new Ce(Ce.Type.EXACT);let n="";for(let s=0;s<e.runes.length;s++)n+=String.fromCodePoint(e.runes[s]);return t.str=n,t.bytes=W.stringToUtf8ByteArray(t.str),t}case y.Op.CAPTURE:case y.Op.PLUS:return Qt.fromRegexp(e.subs[0]);case y.Op.REPEAT:return e.min>=1?Qt.fromRegexp(e.subs[0]):new Ce(Ce.Type.NONE);case y.Op.CONCAT:{const t=new Ce(Ce.Type.AND);for(const n of e.subs)t.subs.push(Qt.fromRegexp(n));return t}case y.Op.ALTERNATE:{const t=new Ce(Ce.Type.OR);for(const n of e.subs)t.subs.push(Qt.fromRegexp(n));return t}default:return new Ce(Ce.Type.NONE)}}static simplify(e){if(e.type===Ce.Type.EXACT||e.type===Ce.Type.NONE)return e;if(e.type===Ce.Type.AND){const t=[];for(const n of e.subs){const s=Qt.simplify(n);if(s.type!==Ce.Type.NONE)if(s.type===Ce.Type.AND)for(let i=0;i<s.subs.length;i++)t.push(s.subs[i]);else t.push(s)}return t.length===0?new Ce(Ce.Type.NONE):t.length===1?t[0]:(e.subs=t,e)}if(e.type===Ce.Type.OR){const t=[];for(const o of e.subs){const B=Qt.simplify(o);if(B.type===Ce.Type.NONE)return new Ce(Ce.Type.NONE);if(B.type===Ce.Type.OR)for(let u=0;u<B.subs.length;u++)t.push(B.subs[u]);else t.push(B)}if(t.length===0)return new Ce(Ce.Type.NONE);if(t.length===1)return t[0];const n=new Set,s=[];for(const o of t)o.type===Ce.Type.EXACT?n.has(o.str)||(n.add(o.str),s.push(o)):s.push(o);e.subs=s;let i=!0;for(const o of s)if(o.type!==Ce.Type.EXACT){i=!1;break}return i&&s.length>1&&(e.ac16=new Dl(s.map(o=>{const B=[];for(let u=0;u<o.str.length;u++)B.push(o.str.charCodeAt(u));return B})),e.ac8=new Dl(s.map(o=>o.bytes))),e}return e}},It=class{constructor(r=0,e=0){this.head=r,this.tail=e}},b_=class{constructor(){this.inst=[],this.start=0,this.numCap=2,this.lbStarts=[],this.numLb=0}getInst(r){return this.inst[r]}numInst(){return this.inst.length}addInst(r){this.inst.push(new N(r))}skipNop(r){let e=this.inst[r];for(;e.op===N.NOP||e.op===N.CAPTURE;)e=this.inst[r],r=e.out;return e}prefix(){let r="",e=this.skipNop(this.start);if(!N.isRuneOp(e.op)||e.runes.length!==1)return[e.op===N.MATCH,r];for(;N.isRuneOp(e.op)&&e.runes.length===1&&!(e.arg&x.FOLD_CASE);)r+=String.fromCodePoint(e.runes[0]),e=this.skipNop(e.out);return[e.op===N.MATCH,r]}startCond(){let r=0,e=this.start;e:for(;;){const t=this.inst[e];switch(t.op){case N.EMPTY_WIDTH:r|=t.arg;break;case N.FAIL:return-1;case N.CAPTURE:case N.NOP:break;default:break e}e=t.out}return r}patch(r,e){let t=r.head;for(;t!==0;){const n=this.inst[t>>1];t&1?(t=n.arg,n.arg=e):(t=n.out,n.out=e)}}append(r,e){if(r.head===0)return e;if(e.head===0)return r;const t=this.inst[r.tail>>1];return r.tail&1?t.arg=e.head:t.out=e.head,new It(r.head,e.tail)}toString(){let r="";for(let e=0;e<this.inst.length;e++){const t=r.length;r+=e,e===this.start&&(r+="*"),r+="        ".substring(r.length-t),r+=this.inst[e],r+=`
`}return r}},Hi=class{constructor(r=0,e=new It,t=!1){this.i=r,this.out=e,this.nullable=t}},S_=class Rr{static ANY_RUNE_NOT_NL(){return[0,O.CODES.get(`
`)-1,O.CODES.get(`
`)+1,z.MAX_RUNE]}static ANY_RUNE(){return[0,z.MAX_RUNE]}static compileRegexp(e){const t=new Rr,n=t.compile(e);return t.prog.patch(n.out,t.newInst(N.MATCH).i),t.prog.start=n.i,t.prog}static compileSet(e){const t=new Rr;if(e.length===0)return t.prog.start=t.newInst(N.FAIL).i,t.prog;let n=[];for(let i=0;i<e.length;i++){const o=t.compile(e[i]),B=t.newInst(N.MATCH);t.prog.getInst(B.i).arg=i,t.prog.patch(o.out,B.i),n.push(o.i)}let s=n[0];for(let i=1;i<n.length;i++){const o=t.newInst(N.ALT),B=t.prog.getInst(o.i);B.out=s,B.arg=n[i],s=o.i}return t.prog.start=s,t.prog}constructor(){this.prog=new b_,this.newInst(N.FAIL)}newInst(e){return this.prog.addInst(e),new Hi(this.prog.numInst()-1,new It,!0)}nop(){const e=this.newInst(N.NOP);return e.out=new It(e.i<<1,e.i<<1),e}fail(){return new Hi}cap(e){const t=this.newInst(N.CAPTURE);return t.out=new It(t.i<<1,t.i<<1),this.prog.getInst(t.i).arg=e,this.prog.numCap<e+1&&(this.prog.numCap=e+1),t}cat(e,t){return e.i===0||t.i===0?this.fail():(this.prog.patch(e.out,t.i),new Hi(e.i,t.out,e.nullable&&t.nullable))}alt(e,t){if(e.i===0)return t;if(t.i===0)return e;const n=this.newInst(N.ALT),s=this.prog.getInst(n.i);return s.out=e.i,s.arg=t.i,n.out=this.prog.append(e.out,t.out),n.nullable=e.nullable||t.nullable,n}loop(e,t){const n=this.newInst(N.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new It(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new It(n.i<<1|1,n.i<<1|1)),this.prog.patch(e.out,n.i),n}quest(e,t){const n=this.newInst(N.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new It(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new It(n.i<<1|1,n.i<<1|1)),n.out=this.prog.append(n.out,e.out),n}star(e,t){return e.nullable?this.quest(this.plus(e,t),t):this.loop(e,t)}plus(e,t){return new Hi(e.i,this.loop(e,t).out,e.nullable)}empty(e){const t=this.newInst(N.EMPTY_WIDTH);return this.prog.getInst(t.i).arg=e,t.out=new It(t.i<<1,t.i<<1),t}rune(e,t){const n=this.newInst(N.RUNE);n.nullable=!1;const s=this.prog.getInst(n.i);return s.runes=e,t&=x.FOLD_CASE,(e.length!==1||z.simpleFold(e[0])===e[0])&&(t&=-2),s.arg=t,n.out=new It(n.i<<1,n.i<<1),!(t&x.FOLD_CASE)&&e.length===1||e.length===2&&e[0]===e[1]?s.op=N.RUNE1:e.length===2&&e[0]===0&&e[1]===z.MAX_RUNE?s.op=N.RUNE_ANY:e.length===4&&e[0]===0&&e[1]===O.CODES.get(`
`)-1&&e[2]===O.CODES.get(`
`)+1&&e[3]===z.MAX_RUNE&&(s.op=N.RUNE_ANY_NOT_NL),n}lookBehind(e,t){const n=this.newInst(N.LB_WRITE);this.prog.getInst(n.i).arg=t;const s=this.rune(Rr.ANY_RUNE(),0),i=this.star(s,!0),o=this.cat(i,e);this.prog.patch(o.out,n.i);const B=this.newInst(N.LB_CHECK);return this.prog.getInst(B.i).arg=t,this.prog.lbStarts.push(o.i),Math.abs(t)>this.prog.numLb&&(this.prog.numLb=Math.abs(t)),B.out=new It(B.i<<1,B.i<<1),B}compile(e){switch(e.op){case y.Op.NO_MATCH:return this.fail();case y.Op.EMPTY_MATCH:return this.nop();case y.Op.LITERAL:if(e.runes.length===0)return this.nop();{let t=null;for(let n of e.runes){const s=this.rune([n],e.flags);t=t===null?s:this.cat(t,s)}return t}case y.Op.CHAR_CLASS:return this.rune(e.runes,e.flags);case y.Op.ANY_CHAR_NOT_NL:return this.rune(Rr.ANY_RUNE_NOT_NL(),0);case y.Op.ANY_CHAR:return this.rune(Rr.ANY_RUNE(),0);case y.Op.BEGIN_LINE:return this.empty(W.EMPTY_BEGIN_LINE);case y.Op.END_LINE:return this.empty(W.EMPTY_END_LINE);case y.Op.BEGIN_TEXT:return this.empty(W.EMPTY_BEGIN_TEXT);case y.Op.END_TEXT:return this.empty(W.EMPTY_END_TEXT);case y.Op.WORD_BOUNDARY:return this.empty(W.EMPTY_WORD_BOUNDARY);case y.Op.NO_WORD_BOUNDARY:return this.empty(W.EMPTY_NO_WORD_BOUNDARY);case y.Op.PLB:case y.Op.NLB:return this.lookBehind(this.compile(e.subs[0]),e.lb);case y.Op.CAPTURE:{const t=this.cap(e.cap<<1),n=this.compile(e.subs[0]),s=this.cap(e.cap<<1|1);return this.cat(this.cat(t,n),s)}case y.Op.STAR:return this.star(this.compile(e.subs[0]),(e.flags&x.NON_GREEDY)!==0);case y.Op.PLUS:return this.plus(this.compile(e.subs[0]),(e.flags&x.NON_GREEDY)!==0);case y.Op.QUEST:return this.quest(this.compile(e.subs[0]),(e.flags&x.NON_GREEDY)!==0);case y.Op.CONCAT:if(e.subs.length===0)return this.nop();{let t=null;for(let n of e.subs){const s=this.compile(n);t=t===null?s:this.cat(t,s)}return t}case y.Op.ALTERNATE:if(e.subs.length===0)return this.nop();{let t=null;for(let n of e.subs){const s=this.compile(n);t=t===null?s:this.alt(t,s)}return t}default:throw new f_("regexp: unhandled case in compile")}}},O_=class pt{static simplify(e){if(e===null)return null;switch(e.op){case y.Op.PLB:case y.Op.NLB:case y.Op.CAPTURE:{const t=pt.simplify(e.subs[0]);if(t!==e.subs[0]){const n=y.fromRegexp(e);return n.runes=[],n.subs=[t],n}return e}case y.Op.CONCAT:case y.Op.ALTERNATE:{const t=[];let n=!1;for(let s=0;s<e.subs.length;s++){const i=e.subs[s],o=pt.simplify(i);if(o!==i&&(n=!0),e.op===y.Op.CONCAT){if(o.op===y.Op.NO_MATCH)return new y(y.Op.NO_MATCH);if(o.op===y.Op.EMPTY_MATCH){n=!0;continue}if(o.op===y.Op.CONCAT){n=!0;for(let B=0;B<o.subs.length;B++)t.push(o.subs[B]);continue}}else if(e.op===y.Op.ALTERNATE){if(o.op===y.Op.NO_MATCH){n=!0;continue}if(o.op===y.Op.ALTERNATE){n=!0;for(let B=0;B<o.subs.length;B++)t.push(o.subs[B]);continue}}t.push(o)}if(n){if(t.length===0)return new y(e.op===y.Op.CONCAT?y.Op.EMPTY_MATCH:y.Op.NO_MATCH);if(t.length===1)return t[0];const s=y.fromRegexp(e);return s.runes=[],s.subs=t,s}return e}case y.Op.CHAR_CLASS:return e.runes===null?e:e.runes.length===0?new y(y.Op.NO_MATCH):e.runes.length===2&&e.runes[0]===0&&e.runes[1]===z.MAX_RUNE?new y(y.Op.ANY_CHAR):e.runes.length===4&&e.runes[0]===0&&e.runes[1]===O.CODES.get(`
`)-1&&e.runes[2]===O.CODES.get(`
`)+1&&e.runes[3]===z.MAX_RUNE?new y(y.Op.ANY_CHAR_NOT_NL):e;case y.Op.STAR:case y.Op.PLUS:case y.Op.QUEST:{const t=pt.simplify(e.subs[0]);return pt.simplify1(e.op,e.flags,t,e)}case y.Op.REPEAT:{if(e.min===0&&e.max===0)return new y(y.Op.EMPTY_MATCH);const t=pt.simplify(e.subs[0]);if(e.max===-1){if(e.min===0)return pt.simplify1(y.Op.STAR,e.flags,t,null);if(e.min===1)return pt.simplify1(y.Op.PLUS,e.flags,t,null);const s=new y(y.Op.CONCAT),i=[];for(let o=0;o<e.min-1;o++)i.push(t);return i.push(pt.simplify1(y.Op.PLUS,e.flags,t,null)),s.subs=i.slice(0),pt.simplify(s)}if(e.min===1&&e.max===1)return t;let n=null;if(e.min>0){n=[];for(let s=0;s<e.min;s++)n.push(t)}if(e.max>e.min){let s=pt.simplify1(y.Op.QUEST,e.flags,t,null);for(let i=e.min+1;i<e.max;i++){const o=new y(y.Op.CONCAT);o.subs=[t,s],s=pt.simplify1(y.Op.QUEST,e.flags,o,null)}if(n===null)return s;n.push(s)}if(n!==null){const s=new y(y.Op.CONCAT);return s.subs=n.slice(0),pt.simplify(s)}return new y(y.Op.NO_MATCH)}}return e}static simplify1(e,t,n,s){if(n.op===y.Op.EMPTY_MATCH)return n;if(n.op===y.Op.NO_MATCH)return e===y.Op.PLUS?n:new y(y.Op.EMPTY_MATCH);if(e===n.op&&(t&x.NON_GREEDY)===(n.flags&x.NON_GREEDY))return n;if(s!==null&&s.op===e&&(s.flags&x.NON_GREEDY)===(t&x.NON_GREEDY)&&n===s.subs[0])return s;const i=new y(e);return i.flags=t,i.subs=[n],i}},le=class{constructor(r,e){this.sign=r,this.cls=e}};const wl=[48,57],Il=[9,10,12,13,32,32],yl=[48,57,65,90,95,95,97,122],Tl=new Map([["\\d",new le(1,wl)],["\\D",new le(-1,wl)],["\\s",new le(1,Il)],["\\S",new le(-1,Il)],["\\w",new le(1,yl)],["\\W",new le(-1,yl)]]),Al=[48,57,65,90,97,122],Rl=[65,90,97,122],vl=[0,127],Pl=[9,9,32,32],bl=[0,31,127,127],Sl=[48,57],Ol=[33,126],Nl=[97,122],Fl=[32,126],Ll=[33,47,58,64,91,96,123,126],kl=[9,13,32,32],Vl=[65,90],xl=[48,57,65,90,95,95,97,122],Ml=[48,57,65,70,97,102],Gl=new Map([["[:alnum:]",new le(1,Al)],["[:^alnum:]",new le(-1,Al)],["[:alpha:]",new le(1,Rl)],["[:^alpha:]",new le(-1,Rl)],["[:ascii:]",new le(1,vl)],["[:^ascii:]",new le(-1,vl)],["[:blank:]",new le(1,Pl)],["[:^blank:]",new le(-1,Pl)],["[:cntrl:]",new le(1,bl)],["[:^cntrl:]",new le(-1,bl)],["[:digit:]",new le(1,Sl)],["[:^digit:]",new le(-1,Sl)],["[:graph:]",new le(1,Ol)],["[:^graph:]",new le(-1,Ol)],["[:lower:]",new le(1,Nl)],["[:^lower:]",new le(-1,Nl)],["[:print:]",new le(1,Fl)],["[:^print:]",new le(-1,Fl)],["[:punct:]",new le(1,Ll)],["[:^punct:]",new le(-1,Ll)],["[:space:]",new le(1,kl)],["[:^space:]",new le(-1,kl)],["[:upper:]",new le(1,Vl)],["[:^upper:]",new le(-1,Vl)],["[:word:]",new le(1,xl)],["[:^word:]",new le(-1,xl)],["[:xdigit:]",new le(1,Ml)],["[:^xdigit:]",new le(-1,Ml)]]);var pn=class mn{static charClassToString(e,t){let n="[";for(let s=0;s<t;s+=2){s>0&&(n+=" ");const i=e[s],o=e[s+1];i===o?n+=`0x${i.toString(16)}`:n+=`0x${i.toString(16)}-0x${o.toString(16)}`}return n+="]",n}static cmp(e,t,n,s){const i=e[t]-n;return i!==0?i:s-e[t+1]}static qsortIntPair(e,t,n){const s=((t+n)/2|0)&-2,i=e[s],o=e[s+1];let B=t,u=n;for(;B<=u;){for(;B<n&&mn.cmp(e,B,i,o)<0;)B+=2;for(;u>t&&mn.cmp(e,u,i,o)>0;)u-=2;if(B<=u){if(B!==u){let c=e[B];e[B]=e[u],e[u]=c,c=e[B+1],e[B+1]=e[u+1],e[u+1]=c}B+=2,u-=2}}t<u&&mn.qsortIntPair(e,t,u),B<n&&mn.qsortIntPair(e,B,n)}constructor(e=W.emptyInts()){this.r=e,this.len=e.length}toArray(){return this.len===this.r.length?this.r:this.r.slice(0,this.len)}cleanClass(){if(this.len<4)return this;mn.qsortIntPair(this.r,0,this.len-2);let e=2;for(let t=2;t<this.len;t+=2){const n=this.r[t],s=this.r[t+1];if(n<=this.r[e-1]+1){s>this.r[e-1]&&(this.r[e-1]=s);continue}this.r[e]=n,this.r[e+1]=s,e+=2}return this.len=e,this}appendLiteral(e,t){return t&x.FOLD_CASE?this.appendFoldedRange(e,e):this.appendRange(e,e)}appendRange(e,t){if(this.len>0){for(let n=2;n<=4;n+=2)if(this.len>=n){const s=this.r[this.len-n],i=this.r[this.len-n+1];if(e<=i+1&&s<=t+1)return e<s&&(this.r[this.len-n]=e),t>i&&(this.r[this.len-n+1]=t),this}}return this.r[this.len++]=e,this.r[this.len++]=t,this}appendFoldedRange(e,t){if(e<=z.MIN_FOLD&&t>=z.MAX_FOLD)return this.appendRange(e,t);if(t<z.MIN_FOLD||e>z.MAX_FOLD)return this.appendRange(e,t);e<z.MIN_FOLD&&(this.appendRange(e,z.MIN_FOLD-1),e=z.MIN_FOLD),t>z.MAX_FOLD&&(this.appendRange(z.MAX_FOLD+1,t),t=z.MAX_FOLD);for(let n=e;n<=t;n++){this.appendRange(n,n);for(let s=z.simpleFold(n);s!==n;s=z.simpleFold(s))this.appendRange(s,s)}return this}appendClass(e){for(let t=0;t<e.length;t+=2)this.appendRange(e[t],e[t+1]);return this}appendFoldedClass(e){for(let t=0;t<e.length;t+=2)this.appendFoldedRange(e[t],e[t+1]);return this}appendNegatedClass(e){let t=0;for(let n=0;n<e.length;n+=2){const s=e[n],i=e[n+1];t<=s-1&&this.appendRange(t,s-1),t=i+1}return t<=z.MAX_RUNE&&this.appendRange(t,z.MAX_RUNE),this}appendTable(e){for(let t=0;t<e.length;++t){const n=e.getLo(t),s=e.getHi(t),i=e.getStride(t);if(i===1){this.appendRange(n,s);continue}for(let o=n;o<=s;o+=i)this.appendRange(o,o)}return this}appendNegatedTable(e){let t=0;for(let n=0;n<e.length;++n){const s=e.getLo(n),i=e.getHi(n),o=e.getStride(n);if(o===1){t<=s-1&&this.appendRange(t,s-1),t=i+1;continue}for(let B=s;B<=i;B+=o)t<=B-1&&this.appendRange(t,B-1),t=B+1}return t<=z.MAX_RUNE&&this.appendRange(t,z.MAX_RUNE),this}appendTableWithSign(e,t){return t<0?this.appendNegatedTable(e):this.appendTable(e)}negateClass(){let e=0,t=0;for(let n=0;n<this.len;n+=2){const s=this.r[n],i=this.r[n+1];e<=s-1&&(this.r[t]=e,this.r[t+1]=s-1,t+=2),e=i+1}return this.len=t,e<=z.MAX_RUNE&&(this.r[this.len++]=e,this.r[this.len++]=z.MAX_RUNE),this}appendClassWithSign(e,t){return t<0?this.appendNegatedClass(e):this.appendClass(e)}appendGroup(e,t){let n=e.cls;return t&&(n=new mn().appendFoldedClass(n).cleanClass().toArray()),this.appendClassWithSign(n,e.sign)}toString(){return mn.charClassToString(this.r,this.len)}},N_=class{constructor(r){this.str=r,this.position=0}pos(){return this.position}rewindTo(r){this.position=r}more(){return this.position<this.str.length}peek(){return this.str.codePointAt(this.position)}skip(r){this.position+=r}skipString(r){this.position+=r.length}pop(){const r=this.str.codePointAt(this.position);return this.position+=W.charCount(r),r}lookingAt(r){return this.str.startsWith(r,this.position)}rest(){return this.str.substring(this.position)}from(r){return this.str.substring(r,this.position)}toString(){return this.rest()}},U,F_=(U=class{static unicodeTable(e){return e==="Any"?{tab:U.ANY_TABLE,fold:U.ANY_TABLE,sign:1}:e==="Ascii"?{tab:U.ASCII_TABLE,fold:U.ASCII_FOLD_TABLE,sign:1}:e==="Assigned"?{tab:Bt.CATEGORIES.get("Cn"),fold:Bt.CATEGORIES.get("Cn"),sign:-1}:e==="Lc"?{tab:Bt.CATEGORIES.get("LC"),fold:Bt.FOLD_CATEGORIES.get("LC"),sign:1}:Bt.CATEGORIES.has(e)?{tab:Bt.CATEGORIES.get(e),fold:Bt.FOLD_CATEGORIES.get(e),sign:1}:Bt.SCRIPTS.has(e)?{tab:Bt.SCRIPTS.get(e),fold:Bt.FOLD_SCRIPT.get(e),sign:1}:null}static minFoldRune(e){if(e<z.MIN_FOLD||e>z.MAX_FOLD)return e;let t=e;const n=e;for(e=z.simpleFold(e);e!==n;e=z.simpleFold(e))t>e&&(t=e);return t}static leadingRegexp(e){if(e.op===y.Op.EMPTY_MATCH)return null;if(e.op===y.Op.CONCAT&&e.subs.length>0){const t=e.subs[0];return t.op===y.Op.EMPTY_MATCH?null:t}return e}static literalRegexp(e,t){const n=new y(y.Op.LITERAL);return n.flags=t,n.runes=W.stringToRunes(e),n}static parse(e,t){return new U(e,t).parseInternal()}static parseRepeat(e){const t=e.pos();if(!e.more()||!e.lookingAt("{"))return-1;e.skip(1);const n=U.parseInt(e);if(n===-1||!e.more())return-1;let s;if(!e.lookingAt(","))s=n;else{if(e.skip(1),!e.more())return-1;if(e.lookingAt("}"))s=-1;else if((s=U.parseInt(e))===-1)return-1}if(!e.more()||!e.lookingAt("}"))return-1;if(e.skip(1),n<0||n>1e3||s===-2||s>1e3||s>=0&&n>s)throw new _e(U.ERR_INVALID_REPEAT_SIZE,e.from(t));return n<<16|s&z.MAX_BMP}static isValidCaptureName(e){if(e.length===0)return!1;for(let t=0;t<e.length;t++){const n=e.codePointAt(t);if(n!==O.CODES.get("_")&&!W.isalnum(n))return!1}return!0}static parseInt(e){const t=e.pos();for(;e.more()&&e.peek()>=O.CODES.get("0")&&e.peek()<=O.CODES.get("9");)e.skip(1);const n=e.from(t);return n.length===0||n.length>1&&n.codePointAt(0)===O.CODES.get("0")?-1:n.length>8?-2:parseInt(n,10)}static isCharClass(e){return e.op===y.Op.LITERAL&&e.runes.length===1||e.op===y.Op.CHAR_CLASS||e.op===y.Op.ANY_CHAR_NOT_NL||e.op===y.Op.ANY_CHAR}static matchRune(e,t){switch(e.op){case y.Op.LITERAL:return e.runes.length===1&&e.runes[0]===t;case y.Op.CHAR_CLASS:for(let n=0;n<e.runes.length;n+=2)if(e.runes[n]<=t&&t<=e.runes[n+1])return!0;return!1;case y.Op.ANY_CHAR_NOT_NL:return t!==O.CODES.get(`
`);case y.Op.ANY_CHAR:return!0}return!1}static mergeCharClass(e,t){switch(e.op){case y.Op.ANY_CHAR:break;case y.Op.ANY_CHAR_NOT_NL:U.matchRune(t,O.CODES.get(`
`))&&(e.op=y.Op.ANY_CHAR);break;case y.Op.CHAR_CLASS:t.op===y.Op.LITERAL?e.runes=new pn(e.runes).appendLiteral(t.runes[0],t.flags).toArray():e.runes=new pn(e.runes).appendClass(t.runes).toArray();break;case y.Op.LITERAL:if(t.runes[0]===e.runes[0]&&t.flags===e.flags)break;e.op=y.Op.CHAR_CLASS,e.runes=new pn().appendLiteral(e.runes[0],e.flags).appendLiteral(t.runes[0],t.flags).toArray();break}}static parseEscape(e){const t=e.pos();if(e.skip(1),!e.more())throw new _e(U.ERR_TRAILING_BACKSLASH);let n=e.pop();e:switch(n){case O.CODES.get("1"):case O.CODES.get("2"):case O.CODES.get("3"):case O.CODES.get("4"):case O.CODES.get("5"):case O.CODES.get("6"):case O.CODES.get("7"):if(!e.more()||e.peek()<O.CODES.get("0")||e.peek()>O.CODES.get("7"))break;case O.CODES.get("0"):{let s=n-O.CODES.get("0");for(let i=1;i<3&&!(!e.more()||e.peek()<O.CODES.get("0")||e.peek()>O.CODES.get("7"));i++)s=s*8+e.peek()-O.CODES.get("0"),e.skip(1);return s}case O.CODES.get("x"):{if(!e.more())break;if(n=e.pop(),n===O.CODES.get("{")){let o=0,B=0;for(;;){if(!e.more())break e;if(n=e.pop(),n===O.CODES.get("}"))break;const u=W.unhex(n);if(u<0||(B=B*16+u,B>z.MAX_RUNE))break e;o++}if(o===0)break e;return B}const s=W.unhex(n);if(!e.more())break;n=e.pop();const i=W.unhex(n);if(s<0||i<0)break;return s*16+i}case O.CODES.get("a"):return O.CODES.get("\x07");case O.CODES.get("f"):return O.CODES.get("\f");case O.CODES.get("n"):return O.CODES.get(`
`);case O.CODES.get("r"):return O.CODES.get("\r");case O.CODES.get("t"):return O.CODES.get("	");case O.CODES.get("v"):return O.CODES.get("\v");default:if(n<=z.MAX_ASCII&&!W.isalnum(n))return n;break}throw new _e(U.ERR_INVALID_ESCAPE,e.from(t))}static parseClassChar(e,t){if(!e.more())throw new _e(U.ERR_MISSING_BRACKET,e.from(t));return e.lookingAt("\\")?U.parseEscape(e):e.pop()}static concatRunes(e,t){for(let n=0;n<t.length;n++)e.push(t[n]);return e}static hasCapture(e){if(e===null)return!1;if(e.op===y.Op.CAPTURE)return!0;if(e.subs){for(let t of e.subs)if(U.hasCapture(t))return!0}return!1}constructor(e,t=0){this.wholeRegexp=e,this.flags=t,this.numCap=0,this.namedGroups=Object.create(null),this.stack=[],this.free=null,this.numRegexp=0,this.numRunes=0,this.repeats=0,this.height=null,this.size=null,this.nlb=0}newRegexp(e){let t=this.free;return t!==null&&t.subs!==null&&t.subs.length>0?(this.free=t.subs[0],t.reinit(),t.op=e):(t=new y(e),this.numRegexp+=1),t}reuse(e){this.height!==null&&this.height.has(e)&&this.height.delete(e),e.subs!==null&&e.subs.length>0&&(e.subs[0]=this.free),this.free=e}checkLimits(e){if(this.numRunes>U.MAX_RUNES)throw new _e(U.ERR_LARGE);this.checkSize(e),this.checkHeight(e)}checkSize(e){if(this.size===null){if(this.repeats===0&&(this.repeats=1),e.op===y.Op.REPEAT){let t=e.max;t===-1&&(t=e.min),t<=0&&(t=1),t>Math.floor(U.MAX_SIZE/this.repeats)?this.repeats=U.MAX_SIZE:this.repeats*=t}if(this.numRegexp<Math.floor(U.MAX_SIZE/this.repeats))return;this.size=new Map;for(let t of this.stack)this.checkSize(t)}if(this.calcSize(e,!0)>U.MAX_SIZE)throw new _e(U.ERR_LARGE)}calcSize(e,t=!1){if(!t&&this.size!==null&&this.size.has(e))return this.size.get(e);let n=0;switch(e.op){case y.Op.LITERAL:n=e.runes.length;break;case y.Op.PLB:case y.Op.NLB:case y.Op.CAPTURE:case y.Op.STAR:n=2+this.calcSize(e.subs[0]);break;case y.Op.PLUS:case y.Op.QUEST:n=1+this.calcSize(e.subs[0]);break;case y.Op.CONCAT:for(let s of e.subs)n=n+this.calcSize(s);break;case y.Op.ALTERNATE:for(let s of e.subs)n=n+this.calcSize(s);e.subs.length>1&&(n=n+e.subs.length-1);break;case y.Op.REPEAT:{let s=this.calcSize(e.subs[0]);if(e.max===-1){e.min===0?n=2+s:n=1+e.min*s;break}n=e.max*s+(e.max-e.min);break}}return n=Math.max(1,n),this.size===null&&(this.size=new Map),this.size.set(e,n),n}checkHeight(e){if(!(this.numRegexp<U.MAX_HEIGHT)){if(this.height===null){this.height=new Map;for(let t of this.stack)this.checkHeight(t)}if(this.calcHeight(e,!0)>U.MAX_HEIGHT)throw new _e(U.ERR_NESTING_DEPTH)}}calcHeight(e,t=!1){if(!t&&this.height!==null&&this.height.has(e))return this.height.get(e);let n=1;for(let s of e.subs){const i=this.calcHeight(s);n<1+i&&(n=1+i)}return this.height===null&&(this.height=new Map),this.height.set(e,n),n}pop(){return this.stack.pop()}popToPseudo(){const e=this.stack.length;let t=e;for(;t>0&&!y.isPseudoOp(this.stack[t-1].op);)t--;const n=this.stack.slice(t,e);return this.stack=this.stack.slice(0,t),n}push(e){if(this.numRunes+=e.runes.length,e.op===y.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]===e.runes[1]){if(this.maybeConcat(e.runes[0],this.flags&-2))return null;e.op=y.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags&-2}else if(e.op===y.Op.CHAR_CLASS&&e.runes.length===4&&e.runes[0]===e.runes[1]&&e.runes[2]===e.runes[3]&&z.simpleFold(e.runes[0])===e.runes[2]&&z.simpleFold(e.runes[2])===e.runes[0]||e.op===y.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]+1===e.runes[1]&&z.simpleFold(e.runes[0])===e.runes[1]&&z.simpleFold(e.runes[1])===e.runes[0]){if(this.maybeConcat(e.runes[0],this.flags|x.FOLD_CASE))return null;e.op=y.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags|x.FOLD_CASE}else this.maybeConcat(-1,0);return this.stack.push(e),this.checkLimits(e),e}maybeConcat(e,t){const n=this.stack.length;if(n<2)return!1;const s=this.stack[n-1],i=this.stack[n-2];return s.op!==y.Op.LITERAL||i.op!==y.Op.LITERAL||(s.flags&x.FOLD_CASE)!==(i.flags&x.FOLD_CASE)?!1:(i.runes=U.concatRunes(i.runes,s.runes),e>=0?(s.runes=[e],s.flags=t,!0):(this.pop(),this.reuse(s),!1))}newLiteral(e,t){const n=this.newRegexp(y.Op.LITERAL);return n.flags=t,t&x.FOLD_CASE&&(e=U.minFoldRune(e)),n.runes=[e],n}literal(e){this.push(this.newLiteral(e,this.flags))}op(e){const t=this.newRegexp(e);return t.flags=this.flags,this.push(t)}repeat(e,t,n,s,i,o){let B=this.flags;if(B&x.PERL_X&&(i.more()&&i.lookingAt("?")&&(i.skip(1),B^=x.NON_GREEDY),o!==-1))throw new _e(U.ERR_INVALID_REPEAT_OP,i.from(o));const u=this.stack.length;if(u===0)throw new _e(U.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));const c=this.stack[u-1];if(y.isPseudoOp(c.op))throw new _e(U.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));const h=this.newRegexp(e);if(h.min=t,h.max=n,h.flags=B,h.subs=[c],this.stack[u-1]=h,this.checkLimits(h),e===y.Op.REPEAT&&(t>=2||n>=2)&&!this.repeatIsValid(h,1e3))throw new _e(U.ERR_INVALID_REPEAT_SIZE,i.from(s))}repeatIsValid(e,t){if(e.op===y.Op.REPEAT){let n=e.max;if(n===0)return!0;if(n<0&&(n=e.min),n>t)return!1;n>0&&(t=Math.trunc(t/n))}for(let n of e.subs)if(!this.repeatIsValid(n,t))return!1;return!0}concat(){this.maybeConcat(-1,0);const e=this.popToPseudo();return e.length===0?this.push(this.newRegexp(y.Op.EMPTY_MATCH)):this.push(this.collapse(e,y.Op.CONCAT))}alternate(){const e=this.popToPseudo();return e.length>0&&this.cleanAlt(e[e.length-1]),e.length===0?this.push(this.newRegexp(y.Op.NO_MATCH)):this.push(this.collapse(e,y.Op.ALTERNATE))}cleanAlt(e){e.op===y.Op.CHAR_CLASS&&(e.runes=new pn(e.runes).cleanClass().toArray(),e.runes.length===2&&e.runes[0]===0&&e.runes[1]===z.MAX_RUNE?(e.runes=[],e.op=y.Op.ANY_CHAR):e.runes.length===4&&e.runes[0]===0&&e.runes[1]===O.CODES.get(`
`)-1&&e.runes[2]===O.CODES.get(`
`)+1&&e.runes[3]===z.MAX_RUNE&&(e.runes=[],e.op=y.Op.ANY_CHAR_NOT_NL))}collapse(e,t){if(e.length===1)return e[0];let n=0;for(let B of e)n+=B.op===t?B.subs.length:1;let s=new Array(n).fill(null),i=0;for(let B of e)if(B.op===t){for(let u=0;u<B.subs.length;u++)s[i++]=B.subs[u];this.reuse(B)}else s[i++]=B;let o=this.newRegexp(t);if(o.subs=s,t===y.Op.ALTERNATE&&(o.subs=this.factor(o.subs),o.subs.length===1)){const B=o;o=o.subs[0],this.reuse(B)}return o}factor(e){if(e.length<2)return e;let t=0,n=e.length,s=0,i=null,o=0,B=0,u=0;for(let h=0;h<=n;h++){let f=null,p=0,w=0;if(h<n){let R=e[t+h];if(R.op===y.Op.CONCAT&&R.subs.length>0&&(R=R.subs[0]),R.op===y.Op.LITERAL&&(f=R.runes,p=R.runes.length,w=R.flags&x.FOLD_CASE),w===B){let k=0;for(;k<o&&k<p&&i[k]===f[k];)k++;if(k>0){o=k;continue}}}if(h!==u)if(h===u+1)e[s++]=e[t+u];else{const R=this.newRegexp(y.Op.LITERAL);R.flags=B,R.runes=i.slice(0,o);for(let K=u;K<h;K++)e[t+K]=this.removeLeadingString(e[t+K],o),this.checkLimits(e[t+K]);const k=this.collapse(e.slice(t+u,t+h),y.Op.ALTERNATE),M=this.newRegexp(y.Op.CONCAT);M.subs=[R,k],e[s++]=M}u=h,i=f,o=p,B=w}n=s,t=0,u=0,s=0;let c=null;for(let h=0;h<=n;h++){let f=null;if(!(h<n&&(f=U.leadingRegexp(e[t+h]),c!==null&&c.equals(f)&&(U.isCharClass(c)||c.op===y.Op.REPEAT&&c.min===c.max&&U.isCharClass(c.subs[0]))))){if(h!==u)if(h===u+1)e[s++]=e[t+u];else{const p=c;for(let k=u;k<h;k++){const M=k!==u;e[t+k]=this.removeLeadingRegexp(e[t+k],M),this.checkLimits(e[t+k])}const w=this.collapse(e.slice(t+u,t+h),y.Op.ALTERNATE),R=this.newRegexp(y.Op.CONCAT);R.subs=[p,w],e[s++]=R}u=h,c=f}}n=s,t=0,u=0,s=0;for(let h=0;h<=n;h++)if(!(h<n&&U.isCharClass(e[t+h]))){if(h!==u)if(h===u+1)e[s++]=e[t+u];else{let f=u;for(let w=u+1;w<h;w++){const R=e[t+f],k=e[t+w];(R.op<k.op||R.op===k.op&&(R.runes!==null?R.runes.length:0)<(k.runes!==null?k.runes.length:0))&&(f=w)}const p=e[t+u];e[t+u]=e[t+f],e[t+f]=p;for(let w=u+1;w<h;w++)U.mergeCharClass(e[t+u],e[t+w]),this.reuse(e[t+w]);this.cleanAlt(e[t+u]),e[s++]=e[t+u]}h<n&&(e[s++]=e[t+h]),u=h+1}n=s,t=0,u=0,s=0;for(let h=0;h<n;++h)h+1<n&&e[t+h].op===y.Op.EMPTY_MATCH&&e[t+h+1].op===y.Op.EMPTY_MATCH||(e[s++]=e[t+h]);return n=s,t=0,e.slice(t,n)}removeLeadingString(e,t){if(e.op===y.Op.CONCAT&&e.subs.length>0){const n=this.removeLeadingString(e.subs[0],t);if(e.subs[0]=n,n.op===y.Op.EMPTY_MATCH)switch(this.reuse(n),e.subs.length){case 0:case 1:e.op=y.Op.EMPTY_MATCH,e.subs=y.emptySubs();break;case 2:{const s=e;e=e.subs[1],this.reuse(s);break}default:e.subs=e.subs.slice(1,e.subs.length);break}return e}return e.op===y.Op.LITERAL&&(e.runes=e.runes.slice(t,e.runes.length),e.runes.length===0&&(e.op=y.Op.EMPTY_MATCH)),e}removeLeadingRegexp(e,t){if(e.op===y.Op.CONCAT&&e.subs.length>0){switch(t&&this.reuse(e.subs[0]),e.subs=e.subs.slice(1,e.subs.length),e.subs.length){case 0:e.op=y.Op.EMPTY_MATCH,e.subs=y.emptySubs();break;case 1:{const n=e;e=e.subs[0],this.reuse(n);break}}return e}return t&&this.reuse(e),this.newRegexp(y.Op.EMPTY_MATCH)}parseInternal(){if(this.flags&x.LITERAL)return U.literalRegexp(this.wholeRegexp,this.flags);let e=-1,t=-1,n=-1;const s=new N_(this.wholeRegexp);for(;s.more();){let i=-1;e:switch(s.peek()){case O.CODES.get("("):if(this.flags&x.LOOKBEHIND){if(s.lookingAt("(?<=")){this.parsePosLookBehind(),s.skip(4);break}if(s.lookingAt("(?<!")){this.parseNegLookBehind(),s.skip(4);break}}if(this.flags&x.PERL_X&&s.lookingAt("(?")){this.parsePerlFlags(s);break}this.op(y.Op.LEFT_PAREN).cap=++this.numCap,s.skip(1);break;case O.CODES.get("|"):this.parseVerticalBar(),s.skip(1);break;case O.CODES.get(")"):this.parseRightParen(),s.skip(1);break;case O.CODES.get("^"):this.flags&x.ONE_LINE?this.op(y.Op.BEGIN_TEXT):this.op(y.Op.BEGIN_LINE),s.skip(1);break;case O.CODES.get("$"):this.flags&x.ONE_LINE?this.op(y.Op.END_TEXT).flags|=x.WAS_DOLLAR:this.op(y.Op.END_LINE),s.skip(1);break;case O.CODES.get("."):this.flags&x.DOT_NL?this.op(y.Op.ANY_CHAR):this.op(y.Op.ANY_CHAR_NOT_NL),s.skip(1);break;case O.CODES.get("["):this.parseClass(s);break;case O.CODES.get("*"):case O.CODES.get("+"):case O.CODES.get("?"):{i=s.pos();let o=null;switch(s.pop()){case O.CODES.get("*"):o=y.Op.STAR;break;case O.CODES.get("+"):o=y.Op.PLUS;break;case O.CODES.get("?"):o=y.Op.QUEST;break}this.repeat(o,t,n,i,s,e);break}case O.CODES.get("{"):{i=s.pos();const o=U.parseRepeat(s);if(o<0){s.rewindTo(i),this.literal(s.pop());break}t=o>>16,n=(o&z.MAX_BMP)<<16>>16,this.repeat(y.Op.REPEAT,t,n,i,s,e);break}case O.CODES.get("\\"):{const o=s.pos();if(s.skip(1),this.flags&x.PERL_X&&s.more())switch(s.pop()){case O.CODES.get("A"):this.op(y.Op.BEGIN_TEXT);break e;case O.CODES.get("b"):this.op(y.Op.WORD_BOUNDARY);break e;case O.CODES.get("B"):this.op(y.Op.NO_WORD_BOUNDARY);break e;case O.CODES.get("C"):throw new _e(U.ERR_INVALID_ESCAPE,"\\C");case O.CODES.get("Q"):{let c=s.rest();const h=c.indexOf("\\E");h>=0?(c=c.substring(0,h),s.skipString(c),s.skipString("\\E")):s.skipString(c);let f=0;for(;f<c.length;){const p=c.codePointAt(f);this.literal(p),f+=W.charCount(p)}break e}case O.CODES.get("z"):this.op(y.Op.END_TEXT);break e;default:s.rewindTo(o);break}else s.rewindTo(o);const B=this.newRegexp(y.Op.CHAR_CLASS);if(B.flags=this.flags,s.lookingAt("\\p")||s.lookingAt("\\P")){const c=new pn;if(this.parseUnicodeClass(s,c)){B.runes=c.toArray(),this.push(B);break e}}const u=new pn;if(this.parsePerlClassEscape(s,u)){B.runes=u.toArray(),this.push(B);break e}s.rewindTo(o),this.reuse(B),this.literal(U.parseEscape(s));break}default:this.literal(s.pop());break}e=i}if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length!==1)throw new _e(U.ERR_MISSING_PAREN,this.wholeRegexp);return this.stack[0].namedGroups=this.namedGroups,this.stack[0]}parsePerlFlags(e){const t=e.pos(),n=e.rest();if(n.startsWith("(?P<")||n.startsWith("(?<")){const B=n.charAt(2)==="P"?4:3,u=n.indexOf(">");if(u<0)throw new _e(U.ERR_INVALID_NAMED_CAPTURE,n);const c=n.substring(B,u);if(e.skipString(c),e.skip(B+1),!U.isValidCaptureName(c))throw new _e(U.ERR_INVALID_NAMED_CAPTURE,n.substring(0,u+1));const h=this.op(y.Op.LEFT_PAREN);if(h.cap=++this.numCap,this.namedGroups[c])throw new _e(U.ERR_DUPLICATE_NAMED_CAPTURE,c);this.namedGroups[c]=this.numCap,h.name=c;return}e.skip(2);let s=this.flags,i=1,o=!1;e:for(;e.more();){const B=e.pop();switch(B){case O.CODES.get("i"):s|=x.FOLD_CASE,o=!0;break;case O.CODES.get("m"):s&=-17,o=!0;break;case O.CODES.get("s"):s|=x.DOT_NL,o=!0;break;case O.CODES.get("U"):s|=x.NON_GREEDY,o=!0;break;case O.CODES.get("-"):if(i<0)break e;i=-1,s=~s,o=!1;break;case O.CODES.get(":"):case O.CODES.get(")"):if(i<0){if(!o)break e;s=~s}B===O.CODES.get(":")&&this.op(y.Op.LEFT_PAREN),this.flags=s;return;default:break e}}throw new _e(U.ERR_INVALID_PERL_OP,e.from(t))}parsePosLookBehind(){const e=this.newRegexp(y.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=++this.nlb,this.push(e)}parseNegLookBehind(){const e=this.newRegexp(y.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=-++this.nlb,this.push(e)}parseVerticalBar(){this.concat(),this.swapVerticalBar()||this.op(y.Op.VERTICAL_BAR)}swapVerticalBar(){const e=this.stack.length;if(e>=3&&this.stack[e-2].op===y.Op.VERTICAL_BAR&&U.isCharClass(this.stack[e-1])&&U.isCharClass(this.stack[e-3])){let t=this.stack[e-1],n=this.stack[e-3];if(t.op>n.op){const s=n;n=t,t=s,this.stack[e-3]=n}return U.mergeCharClass(n,t),this.reuse(t),this.pop(),!0}if(e>=2){const t=this.stack[e-1],n=this.stack[e-2];if(n.op===y.Op.VERTICAL_BAR)return e>=3&&this.cleanAlt(this.stack[e-3]),this.stack[e-2]=t,this.stack[e-1]=n,!0}return!1}parseRightParen(){if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length<2)throw new _e(U.ERR_UNEXPECTED_PAREN,this.wholeRegexp);const e=this.pop(),t=this.pop();if(t.op!==y.Op.LEFT_PAREN)throw new _e(U.ERR_UNEXPECTED_PAREN,this.wholeRegexp);if(this.flags=t.flags,t.lb!==0){if(U.hasCapture(e))throw new _e(U.ERR_INVALID_CAPTURE_IN_LOOKBEHIND,this.wholeRegexp);t.lb>0?t.op=y.Op.PLB:t.op=y.Op.NLB,t.subs=[e],this.push(t);return}t.cap===0?this.push(e):(t.op=y.Op.CAPTURE,t.subs=[e],this.push(t))}parsePerlClassEscape(e,t){const n=e.pos();if(!(this.flags&x.PERL_X)||!e.more()||e.pop()!==O.CODES.get("\\")||!e.more())return!1;e.pop();const s=e.from(n),i=Tl.has(s)?Tl.get(s):null;return i===null?!1:(t.appendGroup(i,(this.flags&x.FOLD_CASE)!==0),!0)}parseNamedClass(e,t){const n=e.rest(),s=n.indexOf(":]");if(s<0)return!1;const i=n.substring(0,s+2);e.skipString(i);const o=Gl.has(i)?Gl.get(i):null;if(o===null)throw new _e(U.ERR_INVALID_CHAR_RANGE,i);return t.appendGroup(o,(this.flags&x.FOLD_CASE)!==0),!0}parseUnicodeClass(e,t){const n=e.pos();if(!(this.flags&x.UNICODE_GROUPS)||!e.lookingAt("\\p")&&!e.lookingAt("\\P"))return!1;e.skip(1);let s=1,i=e.pop();if(i===O.CODES.get("P")&&(s=-1),!e.more())throw e.rewindTo(n),new _e(U.ERR_INVALID_CHAR_RANGE,e.rest());i=e.pop();let o;if(i!==O.CODES.get("{"))o=W.runeToString(i);else{const h=e.rest(),f=h.indexOf("}");if(f<0)throw e.rewindTo(n),new _e(U.ERR_INVALID_CHAR_RANGE,e.rest());o=h.substring(0,f),e.skipString(o),e.skip(1)}o.length!==0&&o.codePointAt(0)===O.CODES.get("^")&&(s=0-s,o=o.substring(1));const B=U.unicodeTable(o);if(B===null)throw new _e(U.ERR_INVALID_CHAR_RANGE,e.from(n));B.sign<0&&(s=0-s);const u=B.tab,c=B.fold;if(!(this.flags&x.FOLD_CASE)||c===null)t.appendTableWithSign(u,s);else{const h=new pn().appendTable(u).appendTable(c).cleanClass().toArray();t.appendClassWithSign(h,s)}return!0}parseClass(e){const t=e.pos();e.skip(1);const n=this.newRegexp(y.Op.CHAR_CLASS);n.flags=this.flags;const s=new pn;let i=1;e.more()&&e.lookingAt("^")&&(i=-1,e.skip(1),this.flags&x.CLASS_NL||s.appendRange(O.CODES.get(`
`),O.CODES.get(`
`)));let o=!0;for(;!e.more()||e.peek()!==O.CODES.get("]")||o;){if(e.more()&&e.lookingAt("-")&&!(this.flags&x.PERL_X)&&!o){const h=e.rest();if(h==="-"||!h.startsWith("-]"))throw e.rewindTo(t),new _e(U.ERR_INVALID_CHAR_RANGE,e.rest())}o=!1;const B=e.pos();if(e.lookingAt("[:")){if(this.parseNamedClass(e,s))continue;e.rewindTo(B)}if(this.parseUnicodeClass(e,s)||this.parsePerlClassEscape(e,s))continue;e.rewindTo(B);const u=U.parseClassChar(e,t);let c=u;if(e.more()&&e.lookingAt("-")){if(e.skip(1),e.more()&&e.lookingAt("]"))e.skip(-1);else if(c=U.parseClassChar(e,t),c<u)throw new _e(U.ERR_INVALID_CHAR_RANGE,e.from(B))}this.flags&x.FOLD_CASE?s.appendFoldedRange(u,c):s.appendRange(u,c)}e.skip(1),s.cleanClass(),i<0&&s.negateClass(),n.runes=s.toArray(),this.push(n)}},G(U,"ERR_INTERNAL_ERROR","regexp/syntax: internal error"),G(U,"ERR_INVALID_CHAR_RANGE","invalid character class range"),G(U,"ERR_INVALID_ESCAPE","invalid escape sequence"),G(U,"ERR_INVALID_NAMED_CAPTURE","invalid named capture"),G(U,"ERR_INVALID_PERL_OP","invalid or unsupported Perl syntax"),G(U,"ERR_INVALID_REPEAT_OP","invalid nested repetition operator"),G(U,"ERR_INVALID_REPEAT_SIZE","invalid repeat count"),G(U,"ERR_MISSING_BRACKET","missing closing ]"),G(U,"ERR_MISSING_PAREN","missing closing )"),G(U,"ERR_MISSING_REPEAT_ARGUMENT","missing argument to repetition operator"),G(U,"ERR_TRAILING_BACKSLASH","trailing backslash at end of expression"),G(U,"ERR_DUPLICATE_NAMED_CAPTURE","duplicate capture group name"),G(U,"ERR_UNEXPECTED_PAREN","unexpected )"),G(U,"ERR_NESTING_DEPTH","expression nests too deeply"),G(U,"ERR_LARGE","expression too large"),G(U,"ERR_INVALID_CAPTURE_IN_LOOKBEHIND","invalid capture in lookbehind"),G(U,"MAX_HEIGHT",1e3),G(U,"MAX_SIZE",3355443),G(U,"MAX_RUNES",33554432),G(U,"ANY_TABLE",new g(new Uint32Array([0,z.MAX_RUNE,1]))),G(U,"ASCII_TABLE",new g(new Uint32Array([0,127,1]))),G(U,"ASCII_FOLD_TABLE",new g(new Uint32Array([0,127,1,383,383,1,8490,8490,1]))),U),L_=class er{static initTest(e){const t=er.compile(e),n=new er(t.expr,t.prog,t.numSubexp,t.longest);return n.cond=t.cond,n.prefix=t.prefix,n.prefixUTF8=t.prefixUTF8,n.prefixComplete=t.prefixComplete,n.prefixRune=t.prefixRune,n.prefilter=t.prefilter,n}static compile(e){return er.compileImpl(e,x.PERL,!1)}static compilePOSIX(e){return er.compileImpl(e,x.POSIX,!0)}static compileImpl(e,t,n){let s=F_.parse(e,t);const i=s.maxCap();s=O_.simplify(s);const o=P_.build(s),B=S_.compileRegexp(s),u=new er(e,B,i,n);u.prefilter=o.type===Ce.Type.NONE?null:o;const[c,h]=B.prefix();return u.prefixComplete=c,u.prefix=h,u.prefixUTF8=W.stringToUtf8ByteArray(u.prefix),u.prefix.length>0&&(u.prefixRune=u.prefix.codePointAt(0)),u.namedGroups=s.namedGroups,u}static match(e,t){return er.compile(e).match(t)}constructor(e,t,n=0,s=0){this.expr=e,this.prog=t,this.numSubexp=n,this.longest=s,this.cond=t.startCond(),this.prefix=null,this.prefixUTF8=null,this.prefixComplete=!1,this.prefixRune=0,this.machinePool=[],this.dfa=new E_(this.prog),this.onepass=_l.compile(this.prog),this.prefilter=null}matchPrefixComplete(e,t,n,s){if((n===x.ANCHOR_START||n===x.ANCHOR_BOTH)&&t!==0)return null;let i=-1,o=-1;const B=e.prefixLength(this);if(n===x.UNANCHORED){const u=e.index(this,t);if(u<0)return null;i=t+u,o=i+B}else if(n===x.ANCHOR_BOTH){if(e.endPos()!==B||e.index(this,0)!==0)return null;i=0,o=B}else if(n===x.ANCHOR_START){if(e.index(this,0)!==0)return null;i=0,o=B}if(i<0)return null;if(s>0){const u=new Int32Array(s).fill(-1);return u[0]=i,u[1]=o,Array.from(u)}return[]}executeEngine(e,t,n,s){if(this.prefixComplete&&(s===0||this.numSubexp===0))return this.matchPrefixComplete(e,t,n,s);if(this.prefilter!==null&&n===x.UNANCHORED&&!this.prefilter.eval(e,t))return null;if(this.onepass!==null)return _l.execute(this,e,t,n,s);if(s>0)return this.prog.numLb===0&&e.endPos()<=Ui.maxBitStateLen(this.prog)?Ui.execute(this,e,t,n,s):this.doExecuteNFA(e,t,n,s);if(this.prog.numLb===0){const i=this.dfa.match(e,t,n);if(i!==null)return i?[]:null;if(e.endPos()<=Ui.maxBitStateLen(this.prog))return Ui.execute(this,e,t,n,s)}return this.doExecuteNFA(e,t,n,s)}numberOfCapturingGroups(){return this.numSubexp}numberOfInstructions(){return this.prog.numInst()}get(){return this.machinePool.length>0?this.machinePool.pop():null}reset(){this.machinePool.length=0}put(e){this.machinePool.push(e)}toString(){return this.expr}doExecuteNFA(e,t,n,s){let i=this.get();i||(i=p_.fromRE2(this)),i.init(s);const o=i.match(e,t,n)?i.submatches():null;return this.put(i),o}match(e){return this.executeEngine(we.fromUTF16(e),0,x.UNANCHORED,0)!==null}matchWithGroup(e,t,n,s,i){return e instanceof dr||(W.isByteArray(e)?e=rr.utf8(e):e=rr.utf16(e)),this.matchMachineInput(e,t,n,s,i)}matchMachineInput(e,t,n,s,i){if(t>n)return[!1,null];const o=e.isUTF16Encoding()?we.fromUTF16(e.asCharSequence(),0,n):we.fromUTF8(e.asBytes(),0,n),B=this.executeEngine(o,t,s,2*i);return B===null?[!1,null]:[!0,B]}matchUTF8(e){return this.executeEngine(we.fromUTF8(e),0,x.UNANCHORED,0)!==null}replaceAll(e,t){return this.replaceAllFunc(e,()=>t,2*e.length+1)}replaceFirst(e,t){return this.replaceAllFunc(e,()=>t,1)}replaceAllFunc(e,t,n){let s=0,i=0,o="";const B=we.fromUTF16(e);let u=0;for(;i<=e.length;){const c=this.executeEngine(B,i,x.UNANCHORED,2);if(c===null||c.length===0)break;o+=e.substring(s,c[0]),(c[1]>s||c[0]===0)&&(o+=t(e.substring(c[0],c[1])),u++),s=c[1];const h=B.step(i)&7;if(i+h>c[1]?i+=h:i+1>c[1]?i++:i=c[1],u>=n)break}return o+=e.substring(s),o}pad(e){if(e===null)return null;let t=(1+this.numSubexp)*2;if(e.length<t){let n=new Array(t).fill(-1);for(let s=0;s<e.length;s++)n[s]=e[s];e=n}return e}allMatches(e,t,n=s=>s){let s=[];const i=e.endPos();t<0&&(t=i+1);let o=0,B=0,u=-1;for(;B<t&&o<=i;){const c=this.executeEngine(e,o,x.UNANCHORED,this.prog.numCap);if(c===null||c.length===0)break;let h=!0;if(c[1]===o){c[0]===u&&(h=!1);const f=e.step(o);f<0?o=i+1:o+=f&7}else o=c[1];u=c[1],h&&(s.push(n(this.pad(c))),B++)}return s}findUTF8(e){const t=this.executeEngine(we.fromUTF8(e),0,x.UNANCHORED,2);return t===null?null:e.slice(t[0],t[1])}findUTF8Index(e){const t=this.executeEngine(we.fromUTF8(e),0,x.UNANCHORED,2);return t===null?null:t.slice(0,2)}find(e){const t=this.executeEngine(we.fromUTF16(e),0,x.UNANCHORED,2);return t===null?"":e.substring(t[0],t[1])}findIndex(e){return this.executeEngine(we.fromUTF16(e),0,x.UNANCHORED,2)}findUTF8Submatch(e){const t=this.executeEngine(we.fromUTF8(e),0,x.UNANCHORED,this.prog.numCap);if(t===null)return null;const n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.slice(t[2*s],t[2*s+1]));return n}findUTF8SubmatchIndex(e){return this.pad(this.executeEngine(we.fromUTF8(e),0,x.UNANCHORED,this.prog.numCap))}findSubmatch(e){const t=this.executeEngine(we.fromUTF16(e),0,x.UNANCHORED,this.prog.numCap);if(t===null)return null;const n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.substring(t[2*s],t[2*s+1]));return n}findSubmatchIndex(e){return this.pad(this.executeEngine(we.fromUTF16(e),0,x.UNANCHORED,this.prog.numCap))}findAllUTF8(e,t){const n=this.allMatches(we.fromUTF8(e),t,s=>e.slice(s[0],s[1]));return n.length===0?null:n}findAllUTF8Index(e,t){const n=this.allMatches(we.fromUTF8(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAll(e,t){const n=this.allMatches(we.fromUTF16(e),t,s=>e.substring(s[0],s[1]));return n.length===0?null:n}findAllIndex(e,t){const n=this.allMatches(we.fromUTF16(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAllUTF8Submatch(e,t){const n=this.allMatches(we.fromUTF8(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let o=0;o<i.length;o++)s[2*o]>=0&&(i[o]=e.slice(s[2*o],s[2*o+1]));return i});return n.length===0?null:n}findAllUTF8SubmatchIndex(e,t){const n=this.allMatches(we.fromUTF8(e),t);return n.length===0?null:n}findAllSubmatch(e,t){const n=this.allMatches(we.fromUTF16(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let o=0;o<i.length;o++)s[2*o]>=0&&(i[o]=e.substring(s[2*o],s[2*o+1]));return i});return n.length===0?null:n}findAllSubmatchIndex(e,t){const n=this.allMatches(we.fromUTF16(e),t);return n.length===0?null:n}},k_=class vr{static isHexadecimal(e){return"0"<=e&&e<="9"||"A"<=e&&e<="F"||"a"<=e&&e<="f"}static translate(e){let t="";if(e instanceof RegExp&&(e.ignoreCase&&(t+="i"),e.multiline&&(t+="m"),e.dotAll&&(t+="s"),e=e.source),typeof e!="string")return e;let n="",s=!1,i=e.length;i===0&&(n="(?:)",s=!0);let o=!1,B=0;for(;B<i;){let c=e[B];if(c==="\\"){if(B+1<i)switch(c=e[B+1],c){case"\\":n+="\\\\",B+=2;continue;case"c":if(B+2<i){let p=e[B+2].charCodeAt(0);if(p>=65&&p<=90||p>=97&&p<=122){let w=p%32;n+="\\x",n+=(w>>4).toString(16).toUpperCase(),n+=(w&15).toString(16).toUpperCase(),B+=3,s=!0;continue}}n+="c",B+=2,s=!0;continue;case"u":if(B+2<i){if(e[B+2]==="{"){let p=B+3,w=!1,R=!1;for(;p<i;){const k=e[p];if(k==="}"){R=!0;break}if(!vr.isHexadecimal(k))break;w=!0,p++}if(R&&w){n+="\\x",B+=2,s=!0;continue}}else if(B+5<i){let p=!0;for(let w=0;w<4;w++)if(!vr.isHexadecimal(e[B+2+w])){p=!1;break}if(p){n+="\\x{"+e.substring(B+2,B+6)+"}",B+=6,s=!0;continue}}}n+="u",B+=2,s=!0;continue;case"x":{let p=!1;if(B+2<i&&e[B+2]==="{"){let w=B+3,R=!1,k=!1;for(;w<i;){const M=e[w];if(M==="}"){k=!0;break}if(!vr.isHexadecimal(M))break;R=!0,w++}k&&R&&(p=!0)}else B+3<i&&vr.isHexadecimal(e[B+2])&&vr.isHexadecimal(e[B+3])&&(p=!0);p?(n+="\\x",B+=2):(n+="x",B+=2,s=!0);continue}case"n":case"r":case"t":case"a":case"f":case"v":case"d":case"D":case"s":case"S":case"w":case"W":case"b":case"B":case"p":case"P":case"A":case"z":case"Q":case"E":case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":n+="\\"+c,B+=2;continue;default:{let p=e.codePointAt(B+1);if(p>=48&&p<=57||p>=65&&p<=90||p>=97&&p<=122){let w=W.charCount(p);n+=e.substring(B+1,B+1+w),B+=w+1,s=!0}else{n+="\\";let w=W.charCount(p);n+=e.substring(B+1,B+1+w),B+=w+1}continue}}}else if(c==="/"){n+="\\/",B+=1,s=!0;continue}else if(c==="[")o=!0;else if(c==="]")o=!1;else if(!o&&c==="("&&B+2<i&&e[B+1]==="?"&&e[B+2]==="<"&&B+3<i&&!"=!>)".includes(e[B+3])){n+="(?P<",B+=3,s=!0;continue}let h=e.codePointAt(B),f=W.charCount(h);n+=e.substring(B,B+f),B+=f}const u=s?n:e;return t.length>0?`(?${t})${u}`:u}},Ne,xB=(Ne=class{static quote(e){return W.quoteMeta(e)}static quoteReplacement(e,t=!1){return pl.quoteReplacement(e,t)}static translateRegExp(e){return k_.translate(e)}static compile(e,t=0){let n=e;if(t&Ne.CASE_INSENSITIVE&&(n=`(?i)${n}`),t&Ne.DOTALL&&(n=`(?s)${n}`),t&Ne.MULTILINE&&(n=`(?m)${n}`),t&-544)throw new d_("Flags should only be a combination of MULTILINE, DOTALL, CASE_INSENSITIVE, DISABLE_UNICODE_GROUPS, LONGEST_MATCH, LOOKBEHINDS");let s=x.PERL;t&Ne.DISABLE_UNICODE_GROUPS&&(s&=-129),t&Ne.LOOKBEHINDS&&(s|=x.LOOKBEHIND);const i=new Ne(e,t);return i.re2Input=L_.compileImpl(n,s,(t&Ne.LONGEST_MATCH)!==0),i}static matches(e,t){return Ne.compile(e).testExact(t)}static initTest(e,t,n){if(e==null)throw new Error("pattern is null");if(n==null)throw new Error("re2 is null");const s=new Ne(e,t);return s.re2Input=n,s}constructor(e,t){this.patternInput=e,this.flagsInput=t,this.re2Input=null}reset(){this.re2Input.reset()}flags(){return this.flagsInput}pattern(){return this.patternInput}re2(){return this.re2Input}matches(e){return this.testExact(e)}matcher(e){return W.isByteArray(e)&&(e=rr.utf8(e)),new pl(this,e)}test(e){return W.isByteArray(e)?this.re2Input.matchUTF8(e):this.re2Input.match(e)}testExact(e){const t=W.isByteArray(e)?we.fromUTF8(e):we.fromUTF16(e);return this.re2Input.executeEngine(t,0,x.ANCHOR_BOTH,0)!==null}exec(e){const t=this.matcher(e);if(!t.find())return null;const n=[t.group(0)];for(let i=1;i<=t.groupCount();i++){const o=t.group(i);n.push(o===null?void 0:o)}n.index=t.start(0),n.input=e;const s=this.namedGroups();if(Object.keys(s).length>0){const i=t.getNamedGroups();for(const o in i)i[o]===null&&(i[o]=void 0);n.groups=i}else n.groups=void 0;return n}split(e,t=0){const n=this.matcher(e),s=[];let i=0,o=0;for(;n.find();){if(o===0&&n.end()===0){o=n.end();continue}if(t>0&&s.length===t-1)break;if(o===n.start()){if(t===0){i+=1,o=n.end();continue}}else for(;i>0;)s.push(""),i-=1;s.push(n.substring(o,n.start())),o=n.end()}if(t===0&&o!==n.inputLength()){for(;i>0;)s.push(""),i-=1;s.push(n.substring(o,n.inputLength()))}return(t!==0||s.length===0&&!(o===n.inputLength()&&o>0))&&s.push(n.substring(o,n.inputLength())),s}*matchAll(e){const t=this.matcher(e);for(;t.find();){const n=[t.group(0)];for(let i=1;i<=t.groupCount();i++){const o=t.group(i);n.push(o===null?void 0:o)}n.index=t.start(0),n.input=e;const s=this.namedGroups();if(Object.keys(s).length>0){const i=t.getNamedGroups();for(const o in i)i[o]===null&&(i[o]=void 0);n.groups=i}else n.groups=void 0;yield n}}toString(){return this.patternInput}programSize(){return this.re2Input.numberOfInstructions()}groupCount(){return this.re2Input.numberOfCapturingGroups()}namedGroups(){return this.re2Input.namedGroups}equals(e){return this===e?!0:e===null||this.constructor!==e.constructor?!1:this.flagsInput===e.flagsInput&&this.patternInput===e.patternInput}},G(Ne,"CASE_INSENSITIVE",Ar.CASE_INSENSITIVE),G(Ne,"DOTALL",Ar.DOTALL),G(Ne,"MULTILINE",Ar.MULTILINE),G(Ne,"DISABLE_UNICODE_GROUPS",Ar.DISABLE_UNICODE_GROUPS),G(Ne,"LONGEST_MATCH",Ar.LONGEST_MATCH),G(Ne,"LOOKBEHINDS",Ar.LOOKBEHINDS),Ne);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let qr="12.19.0";function V_(r){qr=r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pr=new TB("@firebase/firestore");function Pr(){return pr.logLevel}function q(r,...e){if(pr.logLevel<=ae.DEBUG){const t=e.map(MB);pr.debug(`Firestore (${qr}): ${r}`,...t)}}function on(r,...e){if(pr.logLevel<=ae.ERROR){const t=e.map(MB);pr.error(`Firestore (${qr}): ${r}`,...t)}}function Pt(r,...e){if(pr.logLevel<=ae.WARN){const t=e.map(MB);pr.warn(`Firestore (${qr}): ${r}`,...t)}}function MB(r){if(typeof r=="string")return r;try{return function(t){return JSON.stringify(t)}(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function X(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,JC(r,n,t)}function JC(r,e,t){let n=`FIRESTORE (${qr}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw on(n),new Error(n)}function Q(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||JC(e,s,n)}function re(r,e){return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function x_(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class GB{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=x_(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}}function oe(r,e){return r<e?-1:r>e?1:0}function uB(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const s=r.charAt(n),i=e.charAt(n);if(s!==i)return Ua(s)===Ua(i)?oe(s,i):Ua(s)?1:-1}return oe(r.length,e.length)}const M_=55296,G_=57343;function Ua(r){const e=r.charCodeAt(0);return e>=M_&&e<=G_}function xr(r,e,t){return r.length===e.length&&r.every((n,s)=>t(n,e[s]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Te{constructor(e,t){this.comparator=e,this.root=t||je.EMPTY}insert(e,t){return new Te(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,je.BLACK,null,null))}remove(e){return new Te(this.comparator,this.root.remove(e,this.comparator).copy(null,null,je.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,n)=>(e(t,n),!1))}toString(){const e=[];return this.inorderTraversal((t,n)=>(e.push(`${t}:${n}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Ji(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Ji(this.root,e,this.comparator,!1)}getReverseIterator(){return new Ji(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Ji(this.root,e,this.comparator,!0)}}class Ji{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class je{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??je.RED,this.left=s??je.EMPTY,this.right=i??je.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new je(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this;const i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return je.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return je.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,je.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,je.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw X(43730,{key:this.key,value:this.value});if(this.right.isRed())throw X(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw X(27949);return e+(this.isRed()?0:1)}}je.EMPTY=null,je.RED=!0,je.BLACK=!1;je.EMPTY=new class{constructor(){this.size=0}get key(){throw X(57766)}get value(){throw X(16141)}get color(){throw X(16727)}get left(){throw X(29726)}get right(){throw X(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new je(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ke{constructor(e){this.comparator=e,this.data=new Te(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,n)=>(e(t),!1))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Ul(this.data.getIterator())}getIteratorFrom(e){return new Ul(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(n=>{t=t.add(n)}),t}isEqual(e){if(!(e instanceof ke)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new ke(this.comparator);return t.data=e,t}}class Ul{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const L={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class H extends zt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ft="__name__";class Nt{constructor(e,t,n){t===void 0?t=0:t>e.length&&X(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&X(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return Nt.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof Nt?e.forEach(n=>{t.push(n)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let s=0;s<n;s++){const i=Nt.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return oe(e.length,t.length)}static compareSegments(e,t){const n=Nt.isNumericId(e),s=Nt.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?Nt.extractNumericId(e).compare(Nt.extractNumericId(t)):uB(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Rn.fromString(e.substring(4,e.length-2))}}class fe extends Nt{construct(e,t,n){return new fe(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new H(L.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter(s=>s.length>0))}return new fe(t)}static emptyPath(){return new fe([])}}const U_=/^[_a-zA-Z][_a-zA-Z0-9]*$/;let Dt=class br extends Nt{construct(e,t,n){return new br(e,t,n)}static isValidIdentifier(e){return U_.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),br.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Ft}static keyField(){return new br([Ft])}static fromServerFormat(e){const t=[];let n="",s=0;const i=()=>{if(n.length===0)throw new H(L.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let o=!1;for(;s<e.length;){const B=e[s];if(B==="\\"){if(s+1===e.length)throw new H(L.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[s+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new H(L.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=u,s+=2}else B==="`"?(o=!o,s++):B!=="."||o?(n+=B,s++):(i(),s++)}if(i(),o)throw new H(L.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new br(t)}static emptyPath(){return new br([])}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(e){this.fields=e,e.sort(Dt.comparator)}static empty(){return new mt([])}unionWith(e){let t=new ke(Dt.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new mt(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return xr(this.fields,e.fields,(t,n)=>t.isEqual(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function po(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function qn(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function H_(r,e){const t=[];for(const n in r)Object.prototype.hasOwnProperty.call(r,n)&&t.push(e(r[n],n,r));return t}function jC(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ${constructor(e){this.path=e}static fromPath(e){return new $(fe.fromString(e))}static fromName(e){return new $(fe.fromString(e).popFirst(5))}static empty(){return new $(fe.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&fe.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return fe.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new $(new fe(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qC(r,e,t){if(!t)throw new H(L.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function J_(r,e,t,n){if(e===!0&&n===!0)throw new H(L.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function Hl(r){if(!$.isDocumentKey(r))throw new H(L.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function Jl(r){if($.isDocumentKey(r))throw new H(L.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function Bi(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function Vo(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=function(n){return n.constructor?n.constructor.name:null}(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":X(12329,{type:typeof r})}function st(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new H(L.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Vo(r);throw new H(L.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}function j_(r,e){if(e<=0)throw new H(L.INVALID_ARGUMENT,`Function ${r}() requires a positive number, but it was: ${e}.`)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Le(r,e){const t={typeString:r};return e&&(t.value=e),t}function ui(r,e){if(!Bi(r))throw new H(L.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const o=r[n];if(s&&typeof o!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&o!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new H(L.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jl=-62135596800,ql=1e6;class de{static now(){return de.fromMillis(Date.now())}static fromDate(e){return de.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*ql);return new de(t,n)}static fromInstant(e){if(!e||typeof e.t!="bigint")throw new H(L.INVALID_ARGUMENT,"Invalid Temporal.Instant object provided.");return de._fromEpochNanoseconds(e.t)}static _fromEpochNanoseconds(e){let t,n;if(e>=0n)t=Number(e/1000000000n),n=Number(e%1000000000n);else{const s=e%1000000000n;s===0n?(t=Number(e/1000000000n),n=0):(t=Number(e/1000000000n-1n),n=Number(s+1000000000n))}return new de(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new H(L.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new H(L.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<jl)throw new H(L.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new H(L.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/ql}toInstant(){if(typeof Temporal>"u"||!Temporal.Instant)throw new H(L.FAILED_PRECONDITION,"The Temporal object is not available in the current environment.");const e=1000000000n*BigInt(this.seconds)+BigInt(this.nanoseconds);return Temporal.Instant.__PRIVATE_fromEpochNanoseconds(e)}_compareTo(e){return this.seconds===e.seconds?oe(this.nanoseconds,e.nanoseconds):oe(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:de._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(ui(e,de._jsonSchema))return new de(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-jl;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}de._jsonSchemaVersion="firestore/timestamp/1.0",de._jsonSchema={type:Le("string",de._jsonSchemaVersion),seconds:Le("number"),nanoseconds:Le("number")};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class KC extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ve{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new KC("Invalid base64 string: "+i):i}}(e);return new Ve(t)}static fromUint8Array(e){const t=function(s){let i="";for(let o=0;o<s.length;++o)i+=String.fromCharCode(s[o]);return i}(e);return new Ve(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return oe(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Ve.EMPTY_BYTE_STRING=new Ve("");const q_=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Nn(r){if(Q(!!r,39018),typeof r=="string"){let e=0;const t=q_.exec(r);if(Q(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:Re(r.seconds),nanos:Re(r.nanos)}}function Re(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function Fn(r){return typeof r=="string"?Ve.fromBase64String(r):Ve.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zC="server_timestamp",QC="__type__",WC="__previous_value__",$C="__local_write_time__";function xo(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[QC])==null?void 0:n.stringValue)===zC}function ci(r){const e=r.mapValue.fields[WC];return xo(e)?ci(e):e}function Mr(r){const e=Nn(r.mapValue.fields[$C].timestampValue);return new de(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class K_{constructor(e,t,n,s,i,o,B,u,c,h,f,p,w){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=o,this.autoDetectLongPolling=B,this.longPollingOptions=u,this.useFetchStreams=c,this.isUsingEmulator=h,this.apiKey=f,this._customHeaders=p,this.grpcFlowControlWindow=w}}const xs="(default)";class Ms{constructor(e,t){this.projectId=e,this.database=t||xs}static empty(){return new Ms("","")}get isDefaultDatabase(){return this.database===xs}isEqual(e){return e instanceof Ms&&e.projectId===this.projectId&&e.database===this.database}}function z_(r,e){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new H(L.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Ms(r.options.projectId,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const UB=-1;function Mo(r){return r==null}function Gs(r){return r===0&&1/r==-1/0}function Q_(r){return typeof r=="number"&&Number.isInteger(r)&&!Gs(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}function W_(r){return typeof r=="string"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const YC="__type__",$_="__max__",ji={mapValue:{}},XC="__vector__",Us="value",Gr={nullValue:"NULL_VALUE"},ht={booleanValue:!0},Je={booleanValue:!1};function xe(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?xo(r)?4:Y_(r)?9007199254740991:go(r)?10:11:X(28295,{value:r})}function At(r,e,t){if(r===e)return!0;const n=xe(r);if(n!==xe(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return Mr(r).isEqual(Mr(e));case 3:return function(i,o){if(typeof i.timestampValue=="string"&&typeof o.timestampValue=="string"&&i.timestampValue.length===o.timestampValue.length)return i.timestampValue===o.timestampValue;const B=Nn(i.timestampValue),u=Nn(o.timestampValue);return B.seconds===u.seconds&&B.nanos===u.nanos}(r,e);case 5:return r.stringValue===e.stringValue;case 6:return function(i,o){return Fn(i.bytesValue).isEqual(Fn(o.bytesValue))}(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return function(i,o){return Re(i.geoPointValue.latitude)===Re(o.geoPointValue.latitude)&&Re(i.geoPointValue.longitude)===Re(o.geoPointValue.longitude)}(r,e);case 2:return function(i,o,B){if("integerValue"in i&&"integerValue"in o)return Re(i.integerValue)===Re(o.integerValue);let u,c;if("doubleValue"in i&&"doubleValue"in o)u=Re(i.doubleValue),c=Re(o.doubleValue);else{if(!(B!=null&&B.i))return!1;u=Re(i.integerValue??i.doubleValue),c=Re(o.integerValue??o.doubleValue)}return u===c?!!(B!=null&&B.o)||Gs(u)===Gs(c):!!(B===void 0||B.u)&&isNaN(u)&&isNaN(c)}(r,e,t);case 9:return xr(r.arrayValue.values||[],e.arrayValue.values||[],(s,i)=>At(s,i,t));case 10:case 11:return function(i,o,B){const u=i.mapValue.fields||{},c=o.mapValue.fields||{};if(po(u)!==po(c))return!1;for(const h in u)if(u.hasOwnProperty(h)&&(c[h]===void 0||!At(u[h],c[h],B)))return!1;return!0}(r,e,t);default:return X(52216,{left:r})}}function Hs(r,e){return(r.values||[]).find(t=>At(t,e))!==void 0}function Ct(r,e){if(r===e)return 0;const t=xe(r),n=xe(e);if(t!==n)return oe(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return oe(r.booleanValue,e.booleanValue);case 2:return function(i,o){const B=Re(i.integerValue||i.doubleValue),u=Re(o.integerValue||o.doubleValue);return B<u?-1:B>u?1:B===u?0:isNaN(B)?isNaN(u)?0:-1:1}(r,e);case 3:return Kl(r.timestampValue,e.timestampValue);case 4:return Kl(Mr(r),Mr(e));case 5:return uB(r.stringValue,e.stringValue);case 6:return function(i,o){const B=Fn(i),u=Fn(o);return B.compareTo(u)}(r.bytesValue,e.bytesValue);case 7:return function(i,o){const B=i.split("/"),u=o.split("/");for(let c=0;c<B.length&&c<u.length;c++){const h=oe(B[c],u[c]);if(h!==0)return h}return oe(B.length,u.length)}(r.referenceValue,e.referenceValue);case 8:return function(i,o){const B=oe(Re(i.latitude),Re(o.latitude));return B!==0?B:oe(Re(i.longitude),Re(o.longitude))}(r.geoPointValue,e.geoPointValue);case 9:return zl(r.arrayValue,e.arrayValue);case 10:return function(i,o){var p,w,R,k;const B=i.fields||{},u=o.fields||{},c=(p=B[Us])==null?void 0:p.arrayValue,h=(w=u[Us])==null?void 0:w.arrayValue,f=oe(((R=c==null?void 0:c.values)==null?void 0:R.length)||0,((k=h==null?void 0:h.values)==null?void 0:k.length)||0);return f!==0?f:zl(c,h)}(r.mapValue,e.mapValue);case 11:return function(i,o){if(i===ji.mapValue&&o===ji.mapValue)return 0;if(i===ji.mapValue)return 1;if(o===ji.mapValue)return-1;const B=i.fields||{},u=Object.keys(B),c=o.fields||{},h=Object.keys(c);u.sort(),h.sort();for(let f=0;f<u.length&&f<h.length;++f){const p=uB(u[f],h[f]);if(p!==0)return p;const w=Ct(B[u[f]],c[h[f]]);if(w!==0)return w}return oe(u.length,h.length)}(r.mapValue,e.mapValue);default:throw X(23264,{l:t})}}function Kl(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return oe(r,e);const t=Nn(r),n=Nn(e),s=oe(t.seconds,n.seconds);return s!==0?s:oe(t.nanos,n.nanos)}function zl(r,e){const t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){const i=Ct(t[s],n[s]);if(i!==void 0&&i!==0)return i}return oe(t.length,n.length)}function Ur(r){return cB(r)}function cB(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?function(t){const n=Nn(t);return`time(${n.seconds},${n.nanos})`}(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?function(t){return Fn(t).toBase64()}(r.bytesValue):"referenceValue"in r?function(t){return $.fromName(t).toString()}(r.referenceValue):"geoPointValue"in r?function(t){return`geo(${t.latitude},${t.longitude})`}(r.geoPointValue):"arrayValue"in r?function(t){let n="[",s=!0;for(const i of t.values||[])s?s=!1:n+=",",n+=cB(i);return n+"]"}(r.arrayValue):"mapValue"in r?function(t){const n=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const o of n)i?i=!1:s+=",",s+=`${o}:${cB(t.fields[o])}`;return s+"}"}(r.mapValue):X(61005,{value:r})}function no(r){switch(xe(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=ci(r);return e?16+no(e):16;case 5:return 2*r.stringValue.length;case 6:return Fn(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return function(n){return(n.values||[]).reduce((s,i)=>s+no(i),0)}(r.arrayValue);case 10:case 11:return function(n){let s=0;return qn(n.fields,(i,o)=>{s+=i.length+no(o)}),s}(r.mapValue);default:throw X(13486,{value:r})}}function Ql(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function Lt(r){return!!r&&"integerValue"in r}function sr(r){return!!r&&"doubleValue"in r}function Ln(r){return Lt(r)||sr(r)}function Hr(r){return!!r&&"arrayValue"in r}function Et(r){return!!r&&"nullValue"in r}function ft(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function Br(r){return!!r&&"mapValue"in r}function go(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[YC])==null?void 0:n.stringValue)===XC}function lB(r){var e,t;return(t=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Us])==null?void 0:t.arrayValue}function Ts(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return qn(r.mapValue.fields,(t,n)=>e.mapValue.fields[t]=Ts(n)),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Ts(r.arrayValue.values[t]);return e}return{...r}}function Y_(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===$_}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nt{constructor(e){this.value=e}static empty(){return new nt({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!Br(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Ts(t)}setAll(e){let t=Dt.emptyPath(),n={},s=[];e.forEach((o,B)=>{if(!t.isImmediateParentOf(B)){const u=this.getFieldsMap(t);this.applyChanges(u,n,s),n={},s=[],t=B.popLast()}o?n[B.lastSegment()]=Ts(o):s.push(B.lastSegment())});const i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){const t=this.field(e.popLast());Br(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return At(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];Br(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){qn(t,(s,i)=>e[s]=i);for(const s of n)delete e[s]}clone(){return new nt(Ts(this.value))}}function ZC(r){const e=[];return qn(r.fields,(t,n)=>{const s=new Dt([t]);if(Br(n)){const i=ZC(n.mapValue).fields;if(i.length===0)e.push(s);else for(const o of i)e.push(s.child(o))}else e.push(s)}),new mt(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Go(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Gs(e)?"-0":e}}function HB(r){return{integerValue:""+r}}function JB(r,e,t){return Q_(e)?HB(e):Go(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uo{constructor(){this._=void 0}}function X_(r,e,t){return r instanceof Js?function(s,i){const o={fields:{[QC]:{stringValue:zC},[$C]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&xo(i)&&(i=ci(i)),i&&(o.fields[WC]=i),{mapValue:o}}(t,e):r instanceof js?tf(r,e):r instanceof qs?nf(r,e):r instanceof Ks?function(s,i){const o=ef(s,i),B=_o(o)+_o(s.h);return Lt(o)&&Lt(s.h)?HB(B):Go(s.serializer,B)}(r,e):r instanceof mo?function(s,i){return Wl(s,i,Math.min)}(r,e):r instanceof Eo?function(s,i){return Wl(s,i,Math.max)}(r,e):void 0}function Z_(r,e,t){return r instanceof js?tf(r,e):r instanceof qs?nf(r,e):t}function ef(r,e){return r instanceof Ks?Ln(e)?e:{integerValue:0}:null}class Js extends Uo{}class js extends Uo{constructor(e){super(),this.elements=e}}function tf(r,e){const t=rf(e);for(const n of r.elements)t.some(s=>At(s,n))||t.push(n);return{arrayValue:{values:t}}}class qs extends Uo{constructor(e){super(),this.elements=e}}function nf(r,e){let t=rf(e);for(const n of r.elements)t=t.filter(s=>!At(s,n));return{arrayValue:{values:t}}}class jB extends Uo{constructor(e,t){super(),this.serializer=e,this.h=t}}class Ks extends jB{}class mo extends jB{}class Eo extends jB{}function Wl(r,e,t){if(!Ln(e))return r.h;const n=t(_o(e),_o(r.h));return Lt(e)&&Lt(r.h)?HB(n):Go(r.serializer,n)}function _o(r){return Re(r.integerValue||r.doubleValue)}function rf(r){return Hr(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eD{constructor(e,t){this.field=e,this.transform=t}}function tD(r,e){return r.field.isEqual(e.field)&&function(n,s){return n instanceof js&&s instanceof js||n instanceof qs&&s instanceof qs?xr(n.elements,s.elements,At):n instanceof Ks&&s instanceof Ks||n instanceof mo&&s instanceof mo||n instanceof Eo&&s instanceof Eo?At(n.h,s.h):n instanceof Js&&s instanceof Js}(r.transform,e.transform)}class nD{constructor(e,t){this.version=e,this.transformResults=t}}class it{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new it}static exists(e){return new it(void 0,e)}static updateTime(e){return new it(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function ro(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class Ho{}function sf(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new Jo(r.key,it.none()):new li(r.key,r.data,it.none());{const t=r.data,n=nt.empty();let s=new ke(Dt.comparator);for(let i of e.fields)if(!s.has(i)){let o=t.field(i);o===null&&i.length>1&&(i=i.popLast(),o=t.field(i)),o===null?n.delete(i):n.set(i,o),s=s.add(i)}return new Kn(r.key,n,new mt(s.toArray()),it.none())}}function rD(r,e,t){r instanceof li?function(s,i,o){const B=s.value.clone(),u=Yl(s.fieldTransforms,i,o.transformResults);B.setAll(u),i.convertToFoundDocument(o.version,B).setHasCommittedMutations()}(r,e,t):r instanceof Kn?function(s,i,o){if(!ro(s.precondition,i))return void i.convertToUnknownDocument(o.version);const B=Yl(s.fieldTransforms,i,o.transformResults),u=i.data;u.setAll(of(s)),u.setAll(B),i.convertToFoundDocument(o.version,u).setHasCommittedMutations()}(r,e,t):function(s,i,o){i.convertToNoDocument(o.version).setHasCommittedMutations()}(0,e,t)}function As(r,e,t,n){return r instanceof li?function(i,o,B,u){if(!ro(i.precondition,o))return B;const c=i.value.clone(),h=Xl(i.fieldTransforms,u,o);return c.setAll(h),o.convertToFoundDocument(o.version,c).setHasLocalMutations(),null}(r,e,t,n):r instanceof Kn?function(i,o,B,u){if(!ro(i.precondition,o))return B;const c=Xl(i.fieldTransforms,u,o),h=o.data;return h.setAll(of(i)),h.setAll(c),o.convertToFoundDocument(o.version,h).setHasLocalMutations(),B===null?null:B.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map(f=>f.field))}(r,e,t,n):function(i,o,B){return ro(i.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):B}(r,e,t)}function sD(r,e){let t=null;for(const n of r.fieldTransforms){const s=e.data.field(n.field),i=ef(n.transform,s||null);i!=null&&(t===null&&(t=nt.empty()),t.set(n.field,i))}return t||null}function $l(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&xr(n,s,(i,o)=>tD(i,o))}(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class li extends Ho{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class Kn extends Ho{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function of(r){const e=new Map;return r.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}}),e}function Yl(r,e,t){const n=new Map;Q(r.length===t.length,32656,{T:t.length,P:r.length});for(let s=0;s<t.length;s++){const i=r[s],o=i.transform,B=e.data.field(i.field);n.set(i.field,Z_(o,B,t[s]))}return n}function Xl(r,e,t){const n=new Map;for(const s of r){const i=s.transform,o=t.data.field(s.field);n.set(s.field,X_(i,o,e))}return n}class Jo extends Ho{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class iD extends Ho{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Do{constructor(e,t){this.position=e,this.inclusive=t}}function Zl(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){const i=e[s],o=r.position[s];if(i.field.isKeyField()?n=$.comparator($.fromName(o.referenceValue),t.key):n=Ct(o,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function eh(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!At(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class af{}class Fe extends af{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new aD(e,t,n):t==="array-contains"?new cD(e,n):t==="in"?new lD(e,n):t==="not-in"?new hD(e,n):t==="array-contains-any"?new CD(e,n):new Fe(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new BD(e,n):new uD(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(Ct(t,this.value)):t!==null&&xe(this.value)===xe(t)&&this.matchesComparison(Ct(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return X(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class bt extends af{constructor(e,t){super(),this.filters=e,this.op=t,this.I=null}static create(e,t){return new bt(e,t)}matches(e){return Bf(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.I!==null||(this.I=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.I}getFilters(){return Object.assign([],this.filters)}}function Bf(r){return r.op==="and"}function uf(r){return oD(r)&&Bf(r)}function oD(r){for(const e of r.filters)if(e instanceof bt)return!1;return!0}function hB(r){if(r instanceof Fe)return r.field.canonicalString()+r.op.toString()+Ur(r.value);if(uf(r))return r.filters.map(e=>hB(e)).join(",");{const e=r.filters.map(t=>hB(t)).join(",");return`${r.op}(${e})`}}function cf(r,e){return r instanceof Fe?function(n,s){return s instanceof Fe&&n.op===s.op&&n.field.isEqual(s.field)&&At(n.value,s.value)}(r,e):r instanceof bt?function(n,s){return s instanceof bt&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce((i,o,B)=>i&&cf(o,s.filters[B]),!0):!1}(r,e):void X(19439)}function lf(r){return r instanceof Fe?function(t){return`${t.field.canonicalString()} ${t.op} ${Ur(t.value)}`}(r):r instanceof bt?function(t){return t.op.toString()+" {"+t.getFilters().map(lf).join(" ,")+"}"}(r):"Filter"}class aD extends Fe{constructor(e,t,n){super(e,t,n),this.key=$.fromName(n.referenceValue)}matches(e){const t=$.comparator(e.key,this.key);return this.matchesComparison(t)}}class BD extends Fe{constructor(e,t){super(e,"in",t),this.keys=hf("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class uD extends Fe{constructor(e,t){super(e,"not-in",t),this.keys=hf("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function hf(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map(n=>$.fromName(n.referenceValue))}class cD extends Fe{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return Hr(t)&&Hs(t.arrayValue,this.value)}}class lD extends Fe{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&Hs(this.value.arrayValue,t)}}class hD extends Fe{constructor(e,t){super(e,"not-in",t)}matches(e){if(Hs(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!Hs(this.value.arrayValue,t)}}class CD extends Fe{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!Hr(t)||!t.arrayValue.values)&&t.arrayValue.values.some(n=>Hs(this.value.arrayValue,n))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zs{constructor(e,t="asc"){this.field=e,this.dir=t}}function fD(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ne{static fromTimestamp(e){return new ne(e)}static min(){return new ne(new de(0,0))}static max(){return new ne(new de(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class We{constructor(e,t,n,s,i,o,B){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=o,this.documentState=B}static newInvalidDocument(e){return new We(e,0,ne.min(),ne.min(),ne.min(),nt.empty(),0)}static newFoundDocument(e,t,n,s){return new We(e,1,t,ne.min(),n,s,0)}static newNoDocument(e,t){return new We(e,2,t,ne.min(),ne.min(),nt.empty(),0)}static newUnknownDocument(e,t){return new We(e,3,t,ne.min(),ne.min(),nt.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(ne.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=nt.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=nt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=ne.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof We&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new We(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qs=-1;function dD(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=ne.fromTimestamp(n===1e9?new de(t+1,0):new de(t,n));return new kn(s,$.empty(),e)}function pD(r){return new kn(r.readTime,r.key,Qs)}class kn{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new kn(ne.min(),$.empty(),Qs)}static max(){return new kn(ne.max(),$.empty(),Qs)}}function gD(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=$.comparator(r.documentKey,e.documentKey),t!==0?t:oe(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mD{constructor(e,t=null,n=[],s=[],i=null,o=null,B=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=o,this.endAt=B,this.R=null}}function th(r,e=null,t=[],n=[],s=null,i=null,o=null){return new mD(r,e,t,n,s,i,o)}function Cf(r){const e=re(r);if(e.R===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(n=>hB(n)).join(","),t+="|ob:",t+=e.orderBy.map(n=>function(i){return i.field.canonicalString()+i.dir}(n)).join(","),Mo(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(n=>Ur(n)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(n=>Ur(n)).join(",")),e.R=t}return e.R}function ff(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!fD(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!cf(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!eh(r.startAt,e.startAt)&&eh(r.endAt,e.endAt)}function tr(r){return!!r.isCorePipeline}function df(r){return!!r.path&&$.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kr{constructor(e,t=null,n=[],s=[],i=null,o="F",B=null,u=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=o,this.startAt=B,this.endAt=u,this.A=null,this.V=null,this.m=null,this.startAt,this.endAt}}function ED(r,e,t,n,s,i,o,B){return new Kr(r,e,t,n,s,i,o,B)}function jo(r){return new Kr(r)}function nh(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function _D(r){return $.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function pf(r){return r.collectionGroup!==null}function Rs(r){const e=re(r);if(e.A===null){e.A=[];const t=new Set;for(const i of e.explicitOrderBy)e.A.push(i),t.add(i.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let B=new ke(Dt.comparator);return o.filters.forEach(u=>{u.getFlattenedFilters().forEach(c=>{c.isInequality()&&(B=B.add(c.field))})}),B})(e).forEach(i=>{t.has(i.canonicalString())||i.isKeyField()||e.A.push(new zs(i,n))}),t.has(Dt.keyField().canonicalString())||e.A.push(new zs(Dt.keyField(),n))}return e.A}function Gt(r){const e=re(r);return e.V||(e.V=DD(e,Rs(r))),e.V}function DD(r,e){if(r.limitType==="F")return th(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map(s=>{const i=s.dir==="desc"?"asc":"desc";return new zs(s.field,i)});const t=r.endAt?new Do(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new Do(r.startAt.position,r.startAt.inclusive):null;return th(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function CB(r,e){const t=r.filters.concat([e]);return new Kr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function wD(r,e){const t=r.explicitOrderBy.concat([e]);return new Kr(r.path,r.collectionGroup,t,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)}function wo(r,e,t){return new Kr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function ID(r,e){return ff(Gt(r),Gt(e))&&r.limitType===e.limitType}function vs(r){return`Query(target=${function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map(s=>lf(s)).join(", ")}]`),Mo(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map(s=>function(o){return`${o.field.canonicalString()} (${o.dir})`}(s)).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map(s=>Ur(s)).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map(s=>Ur(s)).join(",")),`Target(${n})`}(Gt(r))}; limitType=${r.limitType})`}function qo(r,e){return e.isFoundDocument()&&function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):$.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)}(r,e)&&function(n,s){for(const i of Rs(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0}(r,e)&&function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0}(r,e)&&function(n,s){return!(n.startAt&&!function(o,B,u){const c=Zl(o,B,u);return o.inclusive?c<=0:c<0}(n.startAt,Rs(n),s)||n.endAt&&!function(o,B,u){const c=Zl(o,B,u);return o.inclusive?c>=0:c>0}(n.endAt,Rs(n),s))}(r,e)}function qB(r){return(e,t)=>{let n=!1;for(const s of Rs(r)){const i=yD(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function yD(r,e,t){const n=r.field.isKeyField()?$.comparator(e.key,t.key):function(i,o,B){const u=o.data.field(i),c=B.data.field(i);return u!==null&&c!==null?Ct(u,c):X(42886)}(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return X(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class TD{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Oe,ce;function AD(r){switch(r){case L.OK:return X(64938);case L.CANCELLED:case L.UNKNOWN:case L.DEADLINE_EXCEEDED:case L.RESOURCE_EXHAUSTED:case L.INTERNAL:case L.UNAVAILABLE:case L.UNAUTHENTICATED:return!1;case L.INVALID_ARGUMENT:case L.NOT_FOUND:case L.ALREADY_EXISTS:case L.PERMISSION_DENIED:case L.FAILED_PRECONDITION:case L.ABORTED:case L.OUT_OF_RANGE:case L.UNIMPLEMENTED:case L.DATA_LOSS:return!0;default:return X(15467,{code:r})}}function gf(r){if(r===void 0)return on("GRPC error has no .code"),L.UNKNOWN;switch(r){case Oe.OK:return L.OK;case Oe.CANCELLED:return L.CANCELLED;case Oe.UNKNOWN:return L.UNKNOWN;case Oe.DEADLINE_EXCEEDED:return L.DEADLINE_EXCEEDED;case Oe.RESOURCE_EXHAUSTED:return L.RESOURCE_EXHAUSTED;case Oe.INTERNAL:return L.INTERNAL;case Oe.UNAVAILABLE:return L.UNAVAILABLE;case Oe.UNAUTHENTICATED:return L.UNAUTHENTICATED;case Oe.INVALID_ARGUMENT:return L.INVALID_ARGUMENT;case Oe.NOT_FOUND:return L.NOT_FOUND;case Oe.ALREADY_EXISTS:return L.ALREADY_EXISTS;case Oe.PERMISSION_DENIED:return L.PERMISSION_DENIED;case Oe.FAILED_PRECONDITION:return L.FAILED_PRECONDITION;case Oe.ABORTED:return L.ABORTED;case Oe.OUT_OF_RANGE:return L.OUT_OF_RANGE;case Oe.UNIMPLEMENTED:return L.UNIMPLEMENTED;case Oe.DATA_LOSS:return L.DATA_LOSS;default:return X(39323,{code:r})}}(ce=Oe||(Oe={}))[ce.OK=0]="OK",ce[ce.CANCELLED=1]="CANCELLED",ce[ce.UNKNOWN=2]="UNKNOWN",ce[ce.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",ce[ce.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",ce[ce.NOT_FOUND=5]="NOT_FOUND",ce[ce.ALREADY_EXISTS=6]="ALREADY_EXISTS",ce[ce.PERMISSION_DENIED=7]="PERMISSION_DENIED",ce[ce.UNAUTHENTICATED=16]="UNAUTHENTICATED",ce[ce.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",ce[ce.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",ce[ce.ABORTED=10]="ABORTED",ce[ce.OUT_OF_RANGE=11]="OUT_OF_RANGE",ce[ce.UNIMPLEMENTED=12]="UNIMPLEMENTED",ce[ce.INTERNAL=13]="INTERNAL",ce[ce.UNAVAILABLE=14]="UNAVAILABLE",ce[ce.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _r{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){qn(this.inner,(t,n)=>{for(const[s,i]of n)e(s,i)})}isEmpty(){return jC(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const RD=new Te($.comparator);function ct(){return RD}const mf=new Te($.comparator);function Sr(...r){let e=mf;for(const t of r)e=e.insert(t.key,t);return e}function Ef(r){let e=mf;return r.forEach((t,n)=>e=e.insert(t,n.overlayedDocument)),e}function In(){return Ps()}function _f(){return Ps()}function Ps(){return new _r(r=>r.toString(),(r,e)=>r.isEqual(e))}const vD=new Te($.comparator),PD=new ke($.comparator);function ie(...r){let e=PD;for(const t of r)e=e.add(t);return e}const bD=new ke(oe);function SD(){return bD}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function OD(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ND=new Rn([4294967295,4294967295],0);function rh(r){const e=OD().encode(r),t=new SC;return t.update(e),new Uint8Array(t.digest())}function sh(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Rn([t,n],0),new Rn([s,i],0)]}class KB{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new _s(`Invalid padding: ${t}`);if(n<0)throw new _s(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new _s(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new _s(`Invalid padding when bitmap length is 0: ${t}`);this.p=8*e.length-t,this.S=Rn.fromNumber(this.p)}v(e,t,n){let s=e.add(t.multiply(Rn.fromNumber(n)));return s.compare(ND)===1&&(s=new Rn([s.getBits(0),s.getBits(1)],0)),s.modulo(this.S).toNumber()}D(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.p===0)return!1;const t=rh(e),[n,s]=sh(t);for(let i=0;i<this.hashCount;i++){const o=this.v(n,s,i);if(!this.D(o))return!1}return!0}static create(e,t,n){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),o=new KB(i,s,t);return n.forEach(B=>o.insert(B)),o}insert(e){if(this.p===0)return;const t=rh(e),[n,s]=sh(t);for(let i=0;i<this.hashCount;i++){const o=this.v(n,s,i);this.C(o)}}C(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class _s extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hi{constructor(e,t,n,s,i,o){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.augmentedDocumentUpdates=i,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const s=new Map;return s.set(e,Ci.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new hi(ne.min(),s,new Te(oe),ct(),ct(),ie())}}class Ci{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new Ci(n,t,ie(),ie(),ie())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class so{constructor(e,t,n,s){this.F=e,this.removedTargetIds=t,this.key=n,this.O=s}}class Df{constructor(e,t){this.targetId=e,this.M=t}}class wf{constructor(e,t,n=Ve.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}}class ih{constructor(e){this.targetId=e,this.N=0,this.L=oh(),this.B=Ve.EMPTY_BYTE_STRING,this.U=!1,this.k=!0}get current(){return this.U}get resumeToken(){return this.B}get q(){return this.N!==0}get $(){return this.k}K(e){e.approximateByteSize()>0&&(this.k=!0,this.B=e)}W(){let e=ie(),t=ie(),n=ie();return this.L.forEach((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:X(38017,{changeType:i})}}),new Ci(this.B,this.U,e,t,n)}G(){this.k=!1,this.L=oh()}j(e,t){this.k=!0,this.L=this.L.insert(e,t)}H(e){this.k=!0,this.L=this.L.remove(e)}J(){this.N+=1}Y(){this.N-=1,Q(this.N>=0,3241,{N:this.N,targetId:this.targetId})}Z(){this.k=!0,this.U=!0}}const ps="WatchChangeAggregator";class FD{constructor(e){this.X=e,this.ee=new Map,this.te=ct(),this.ne=qi(),this.re=ct(),this.ie=qi(),this.se=new Te(oe)}_e(e){for(const t of e.F)e.O&&e.O.isFoundDocument()?this.oe(t,e.O):this.ae(t,e.key,e.O);for(const t of e.removedTargetIds)this.ae(t,e.key,e.O)}ue(e){this.forEachTarget(e,t=>{const n=this.ee.get(t);if(n)switch(e.state){case 0:this.ce(t)&&n.K(e.resumeToken);break;case 1:n.Y(),n.q||n.G(),n.K(e.resumeToken);break;case 2:n.Y(),n.q||this.removeTarget(t);break;case 3:this.ce(t)&&(n.Z(),n.K(e.resumeToken));break;case 4:this.ce(t)&&(this.le(t),n.K(e.resumeToken));break;default:X(56790,{state:e.state})}else q(ps,`handleTargetChange received targetChange for untracked target ID (${t}) with state (${e.state})`)})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ee.forEach((n,s)=>{this.ce(s)&&t(s)})}Ee(e){var t;return tr(e)?e.getPipelineSourceType()==="documents"&&((t=e.getPipelineDocuments())==null?void 0:t.length)===1:df(e)}he(e){const t=e.targetId,n=e.M.count,s=this.Te(t);if(s){const i=s.target;if(this.Ee(i))if(n===0){const o=new $(tr(i)?fe.fromString(i.getPipelineDocuments()[0]):i.path);this.ae(t,o,We.newNoDocument(o,ne.min()))}else Q(n===1,20013,"Single document existence filter with count: "+n);else{const o=this.Pe(t);if(o!==n){const B=this.Ie(e),u=B?this.Re(B,e,o):1;if(u!==0){this.le(t);const c=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.se=this.se.insert(t,c)}}}}}Ie(e){const t=e.M.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t;let o,B;try{o=Fn(n).toUint8Array()}catch(u){if(u instanceof KC)return Pt("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{B=new KB(o,s,i)}catch(u){return Pt(u instanceof _s?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return B.p===0?null:B}Re(e,t,n){return t.M.count===n-this.de(e,t.targetId)?0:2}de(e,t){const n=this.X.getRemoteKeysForTarget(t);let s=0;return n.forEach(i=>{const o=this.X.Ve(),B=`projects/${o.projectId}/databases/${o.database}/documents/${i.path.canonicalString()}`;e.mightContain(B)||(this.ae(t,i,null),s++)}),s}fe(e){const t=new Map;this.ee.forEach((i,o)=>{const B=this.Te(o);if(B){if(i.current&&this.Ee(B.target)){const u=tr(B.target)?fe.fromString(B.target.getPipelineDocuments()[0]):B.target.path,c=new $(u);this.me(c).has(o)||this.pe(o,c)||this.ae(o,c,We.newNoDocument(c,e))}i.$&&(t.set(o,i.W()),i.G())}});let n=ie();this.ie.forEach((i,o)=>{let B=!0;o.forEachWhile(u=>{const c=this.Te(u);return!c||c.purpose==="TargetPurposeLimboResolution"||(B=!1,!1)}),B&&(n=n.add(i))}),this.te.forEach((i,o)=>o.setReadTime(e)),this.re.forEach((i,o)=>o.setReadTime(e));const s=new hi(e,t,this.se,this.te,this.re,n);return this.te=ct(),this.ne=qi(),this.re=ct(),this.ie=qi(),this.se=new Te(oe),s}oe(e,t){const n=this.ee.get(e);if(!n||!this.ce(e))return void q(ps,`addDocumentToTarget received document for unknown inactive target (${e})`);const s=this.pe(e,t.key)?2:0;n.j(t.key,s),tr(this.Te(e).target)&&this.Te(e).target.getPipelineFlavor()!=="exact"?this.re=this.re.insert(t.key,t):this.te=this.te.insert(t.key,t),this.ne=this.ne.insert(t.key,this.me(t.key).add(e)),this.ie=this.ie.insert(t.key,this.ge(t.key).add(e))}ae(e,t,n){const s=this.ee.get(e);s&&this.ce(e)?(this.pe(e,t)?s.j(t,1):s.H(t),this.ie=this.ie.insert(t,this.ge(t).delete(e)),this.ie=this.ie.insert(t,this.ge(t).add(e)),n&&(tr(this.Te(e).target)&&this.Te(e).target.getPipelineFlavor()!=="exact"?this.re=this.re.insert(t,n):this.te=this.te.insert(t,n))):q(ps,`removeDocumentFromTarget received document for unknown or inactive target (${e})`)}removeTarget(e){this.ee.delete(e)}Pe(e){const t=this.ee.get(e);if(!t)return 0;const n=t.W();return this.X.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}J(e){let t=this.ee.get(e);t||(q(ps,`recordPendingTargetRequest set up tracking for target ID ${e}`),t=new ih(e),this.ee.set(e,t)),t.J()}ge(e){let t=this.ie.get(e);return t||(t=new ke(oe),this.ie=this.ie.insert(e,t)),t}me(e){let t=this.ne.get(e);return t||(t=new ke(oe),this.ne=this.ne.insert(e,t)),t}ce(e){const t=this.Te(e)!==null;return t||q(ps,"Detected inactive target",e),t}Te(e){const t=this.ee.get(e);return t===void 0||t.q?null:this.X.ye(e)}le(e){this.ee.set(e,new ih(e)),this.X.getRemoteKeysForTarget(e).forEach(t=>{this.ae(e,t,null)})}pe(e,t){return this.X.getRemoteKeysForTarget(e).has(t)}}function qi(){return new Te($.comparator)}function oh(){return new Te($.comparator)}const LD={asc:"ASCENDING",desc:"DESCENDING"},kD={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},VD={and:"AND",or:"OR"};class xD{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function fB(r,e){return r.useProto3Json||Mo(e)?e:{value:e}}function bs(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function zB(r){const e=Nn(r);return new de(e.seconds,e.nanos)}function If(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function io(r,e){return bs(r,e.toTimestamp())}function Ut(r){return Q(!!r,49232),ne.fromTimestamp(zB(r))}function QB(r,e){return dB(r,e).canonicalString()}function dB(r,e){const t=function(s){return new fe(["projects",s.projectId,"databases",s.database])}(r).child("documents");return e===void 0?t:t.child(e)}function yf(r){const e=fe.fromString(r);return Q(Pf(e),10190,{key:e.toString()}),e}function Io(r,e){return QB(r.databaseId,e.path)}function Ha(r,e){const t=yf(e);if(t.get(1)!==r.databaseId.projectId)throw new H(L.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new H(L.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new $(Af(t))}function Tf(r,e){return QB(r.databaseId,e)}function MD(r){const e=yf(r);return e.length===4?fe.emptyPath():Af(e)}function pB(r){return new fe(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function Af(r){return Q(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function ah(r,e,t){return{name:Io(r,e),fields:t.value.mapValue.fields}}function GD(r,e){let t;if("targetChange"in e){e.targetChange;const n=function(c){return c==="NO_CHANGE"?0:c==="ADD"?1:c==="REMOVE"?2:c==="CURRENT"?3:c==="RESET"?4:X(39313,{state:c})}(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=function(c,h){return c.useProto3Json?(Q(h===void 0||typeof h=="string",58123),Ve.fromBase64String(h||"")):(Q(h===void 0||h instanceof Buffer||h instanceof Uint8Array,16193),Ve.fromUint8Array(h||new Uint8Array))}(r,e.targetChange.resumeToken),o=e.targetChange.cause,B=o&&function(c){const h=c.code===void 0?L.UNKNOWN:gf(c.code);return new H(h,c.message||"")}(o);t=new wf(n,s,i,B||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const s=Ha(r,n.document.name),i=Ut(n.document.updateTime),o=n.document.createTime?Ut(n.document.createTime):ne.min(),B=new nt({mapValue:{fields:n.document.fields}}),u=We.newFoundDocument(s,i,o,B),c=n.targetIds||[],h=n.removedTargetIds||[];t=new so(c,h,u.key,u)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const s=Ha(r,n.document),i=n.readTime?Ut(n.readTime):ne.min(),o=We.newNoDocument(s,i),B=n.removedTargetIds||[];t=new so([],B,o.key,o)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const s=Ha(r,n.document),i=n.removedTargetIds||[];t=new so([],i,s,null)}else{if(!("filter"in e))return X(11601,{we:e});{e.filter;const n=e.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,o=new TD(s,i),B=n.targetId;t=new Df(B,o)}}return t}function UD(r,e){let t;if(e instanceof li)t={update:ah(r,e.key,e.value)};else if(e instanceof Jo)t={delete:Io(r,e.key)};else if(e instanceof Kn)t={update:ah(r,e.key,e.data),updateMask:YD(e.fieldMask)};else{if(!(e instanceof iD))return X(16599,{be:e.type});t={verify:Io(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(n=>function(i,o){const B=o.transform;if(B instanceof Js)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(B instanceof js)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:B.elements}};if(B instanceof qs)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:B.elements}};if(B instanceof Ks)return{fieldPath:o.field.canonicalString(),increment:B.h};if(B instanceof mo)return{fieldPath:o.field.canonicalString(),minimum:B.h};if(B instanceof Eo)return{fieldPath:o.field.canonicalString(),maximum:B.h};throw X(20930,{transform:o.transform})}(0,n))),e.precondition.isNone||(t.currentDocument=function(s,i){return i.updateTime!==void 0?{updateTime:io(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:X(27497)}(r,e.precondition)),t}function HD(r,e){return r&&r.length>0?(Q(e!==void 0,14353),r.map(t=>function(s,i){let o=s.updateTime?Ut(s.updateTime):Ut(i);return o.isEqual(ne.min())&&(o=Ut(i)),new nD(o,s.transformResults||[])}(t,e))):[]}function JD(r,e){return{documents:[Tf(r,e.path)]}}function jD(r,e){const t={structuredQuery:{}},n=e.path;let s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=Tf(r,s);const i=function(c){if(c.length!==0)return vf(bt.create(c,"and"))}(e.filters);i&&(t.structuredQuery.where=i);const o=function(c){if(c.length!==0)return c.map(h=>function(p){return{field:Or(p.field),direction:QD(p.dir)}}(h))}(e.orderBy);o&&(t.structuredQuery.orderBy=o);const B=fB(r,e.limit);return B!==null&&(t.structuredQuery.limit=B),e.startAt&&(t.structuredQuery.startAt=function(c){return{before:c.inclusive,values:c.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(c){return{before:!c.inclusive,values:c.position}}(e.endAt)),{Se:t,parent:s}}function qD(r){let e=MD(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let s=null;if(n>0){Q(n===1,65062);const h=t.from[0];h.allDescendants?s=h.collectionId:e=e.child(h.collectionId)}let i=[];t.where&&(i=function(f){const p=Rf(f);return p instanceof bt&&uf(p)?p.getFilters():[p]}(t.where));let o=[];t.orderBy&&(o=function(f){return f.map(p=>function(R){return new zs(Nr(R.field),function(M){switch(M){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(R.direction))}(p))}(t.orderBy));let B=null;t.limit&&(B=function(f){let p;return p=typeof f=="object"?f.value:f,Mo(p)?null:p}(t.limit));let u=null;t.startAt&&(u=function(f){const p=!!f.before,w=f.values||[];return new Do(w,p)}(t.startAt));let c=null;return t.endAt&&(c=function(f){const p=!f.before,w=f.values||[];return new Do(w,p)}(t.endAt)),ED(e,s,o,i,B,"F",u,c)}function KD(r,e){const t=function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return X(28987,{purpose:s})}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function zD(r,e){return{structuredPipeline:{pipeline:{stages:e.stages.map(t=>t._toProto(r))}}}}function Rf(r){return r.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=Nr(t.unaryFilter.field);return Fe.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=Nr(t.unaryFilter.field);return Fe.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Nr(t.unaryFilter.field);return Fe.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Nr(t.unaryFilter.field);return Fe.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return X(61313);default:return X(60726)}}(r):r.fieldFilter!==void 0?function(t){return Fe.create(Nr(t.fieldFilter.field),function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return X(58110);default:return X(50506)}}(t.fieldFilter.op),t.fieldFilter.value)}(r):r.compositeFilter!==void 0?function(t){return bt.create(t.compositeFilter.filters.map(n=>Rf(n)),function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return X(1026)}}(t.compositeFilter.op))}(r):X(30097,{filter:r})}function QD(r){return LD[r]}function WD(r){return kD[r]}function $D(r){return VD[r]}function Or(r){return{fieldPath:r.canonicalString()}}function Nr(r){return Dt.fromServerFormat(r.fieldPath)}function vf(r){return r instanceof Fe?function(t){if(t.op==="=="){if(ft(t.value))return{unaryFilter:{field:Or(t.field),op:"IS_NAN"}};if(Et(t.value))return{unaryFilter:{field:Or(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(ft(t.value))return{unaryFilter:{field:Or(t.field),op:"IS_NOT_NAN"}};if(Et(t.value))return{unaryFilter:{field:Or(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Or(t.field),op:WD(t.op),value:t.value}}}(r):r instanceof bt?function(t){const n=t.getFilters().map(s=>vf(s));return n.length===1?n[0]:{compositeFilter:{op:$D(t.op),filters:n}}}(r):X(54877,{filter:r})}function YD(r){const e=[];return r.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function Pf(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function bf(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}function Ws(r,e){const t={fields:{}};return e.forEach((n,s)=>{if(typeof s!="string")throw new Error(`Cannot encode map with non-string key: ${s}`);t.fields[s]=n._toProto(r)}),{mapValue:t}}function Sf(r){return{stringValue:r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ko(r){return new xD(r,!0)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tt{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Tt(Ve.fromBase64String(e))}catch(t){throw new H(L.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Tt(Ve.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Tt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(ui(e,Tt._jsonSchema))return Tt.fromBase64String(e.bytes)}}Tt._jsonSchemaVersion="firestore/bytes/1.0",Tt._jsonSchema={type:Le("string",Tt._jsonSchemaVersion),bytes:Le("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fi{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new H(L.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Dt(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function XD(){return new fi(Ft)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zo{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new H(L.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new H(L.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return oe(this._lat,e._lat)||oe(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Ht._jsonSchemaVersion}}static fromJSON(e){if(ui(e,Ht._jsonSchema))return new Ht(e.latitude,e.longitude)}}Ht._jsonSchemaVersion="firestore/geoPoint/1.0",Ht._jsonSchema={type:Le("string",Ht._jsonSchemaVersion),latitude:Le("number"),longitude:Le("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qe{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}Qe.UNAUTHENTICATED=new Qe(null),Qe.GOOGLE_CREDENTIALS=new Qe("google-credentials-uid"),Qe.FIRST_PARTY=new Qe("first-party-uid"),Qe.MOCK_USER=new Qe("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tn{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Of{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class ZD{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(Qe.UNAUTHENTICATED))}shutdown(){}}class ew{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class tw{constructor(e){this.De=e,this.currentUser=Qe.UNAUTHENTICATED,this.xe=0,this.forceRefresh=!1,this.auth=null}start(e,t){Q(this.Ce===void 0,42304);let n=this.xe;const s=u=>this.xe!==n?(n=this.xe,t(u)):Promise.resolve();let i=new tn;this.Ce=()=>{this.xe++,this.currentUser=this.Fe(),i.resolve(),i=new tn,e.enqueueRetryable(()=>s(this.currentUser))};const o=()=>{const u=i;e.enqueueRetryable(async()=>{await u.promise,await s(this.currentUser)})},B=u=>{q("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.Ce&&(this.auth.addAuthTokenListener(this.Ce),o())};this.De.onInit(u=>B(u)),setTimeout(()=>{if(!this.auth){const u=this.De.getImmediate({optional:!0});u?B(u):(q("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new tn)}},0),o()}getToken(){const e=this.xe,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(n=>this.xe!==e?(q("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(Q(typeof n.accessToken=="string",31837,{Oe:n}),new Of(n.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.Ce&&this.auth.removeAuthTokenListener(this.Ce),this.Ce=void 0}Fe(){const e=this.auth&&this.auth.getUid();return Q(e===null||typeof e=="string",2055,{Me:e}),new Qe(e)}}class nw{constructor(e,t,n){this.Ne=e,this.Le=t,this.Be=n,this.type="FirstParty",this.user=Qe.FIRST_PARTY,this.Ue=new Map}ke(){return this.Be?this.Be():null}get headers(){this.Ue.set("X-Goog-AuthUser",this.Ne);const e=this.ke();return e&&this.Ue.set("Authorization",e),this.Le&&this.Ue.set("X-Goog-Iam-Authorization-Token",this.Le),this.Ue}}class rw{constructor(e,t,n){this.Ne=e,this.Le=t,this.Be=n}getToken(){return Promise.resolve(new nw(this.Ne,this.Le,this.Be))}start(e,t){e.enqueueRetryable(()=>t(Qe.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class Bh{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class sw{constructor(e,t){this.qe=t,this.forceRefresh=!1,this.appCheck=null,this.$e=null,this.Ke=null,yt(e)&&e.settings.appCheckToken&&(this.Ke=e.settings.appCheckToken)}start(e,t){Q(this.Ce===void 0,3512);const n=i=>{i.error!=null&&q("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const o=i.token!==this.$e;return this.$e=i.token,q("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(i.token):Promise.resolve()};this.Ce=i=>{e.enqueueRetryable(()=>n(i))};const s=i=>{q("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.Ce&&this.appCheck.addTokenListener(this.Ce)};this.qe.onInit(i=>s(i)),setTimeout(()=>{if(!this.appCheck){const i=this.qe.getImmediate({optional:!0});i?s(i):q("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.Ke)return Promise.resolve(new Bh(this.Ke));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(Q(typeof t.token=="string",44558,{tokenResult:t}),this.$e=t.token,new Bh(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.Ce&&this.appCheck.removeTokenListener(this.Ce),this.Ce=void 0}}function Nf(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iw{Qe(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uh="ConnectivityMonitor";class ch{constructor(){this.We=()=>this.Ge(),this.ze=()=>this.je(),this.He=[],this.Je()}Qe(e){this.He.push(e)}shutdown(){window.removeEventListener("online",this.We),window.removeEventListener("offline",this.ze)}Je(){window.addEventListener("online",this.We),window.addEventListener("offline",this.ze)}Ge(){q(uh,"Network connectivity changed: AVAILABLE");for(const e of this.He)e(0)}je(){q(uh,"Network connectivity changed: UNAVAILABLE");for(const e of this.He)e(1)}static Ye(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ki=null;function gB(){return Ki===null?Ki=function(){return 268435456+Math.round(2147483648*Math.random())}():Ki++,"0x"+Ki.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ja="RestConnection",ow={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class aw{get Ze(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Xe=t+"://"+e.host,this.et=`projects/${n}/databases/${s}`,this.tt=this.databaseId.database===xs?`project_id=${n}`:`project_id=${n}&database_id=${s}`}nt(e,t,n,s,i){const o=gB(),B=this.rt(e,t.toUriEncodedString());q(Ja,`Sending RPC '${e}' ${o}:`,B,n);const u={"google-cloud-resource-prefix":this.et,"x-goog-request-params":this.tt};this.it(u,s,i);const{host:c}=new URL(B),h=jn(c);return this.st(e,B,u,n,h).then(f=>(q(Ja,`Received RPC '${e}' ${o}: `,f),f),f=>{throw Pt(Ja,`RPC '${e}' ${o} failed with error: `,f,"url: ",B,"request:",n),f})}_t(e,t,n,s,i,o){return this.nt(e,t,n,s,i)}it(e,t,n){if(e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+qr}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((s,i)=>e[i]=s),n&&n.headers.forEach((s,i)=>e[i]=s),this.databaseInfo._customHeaders)for(const s of Object.keys(this.databaseInfo._customHeaders))e[s]=this.databaseInfo._customHeaders[s]}rt(e,t){const n=ow[e];let s=`${this.Xe}/v1/${t}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bw{constructor(e){this.ot=e.ot,this.ut=e.ut}ct(e){this.lt=e}Et(e){this.ht=e}Tt(e){this.Pt=e}onMessage(e){this.It=e}close(){this.ut()}send(e){this.ot(e)}Rt(){this.lt()}At(){this.ht()}Vt(e){this.Pt(e)}dt(e){this.It(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ze="WebChannelConnection",gs=(r,e,t)=>{r.listen(e,n=>{try{t(n)}catch(s){setTimeout(()=>{throw s},0)}})};class kr extends aw{constructor(e){super(e),this.ft=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static gt(){if(!kr.yt){const e=LC();gs(e,FC.STAT_EVENT,t=>{t.stat===iB.PROXY?q(ze,"STAT_EVENT: detected buffering proxy"):t.stat===iB.NOPROXY&&q(ze,"STAT_EVENT: detected no buffering proxy")}),kr.yt=!0}}st(e,t,n,s,i){const o=gB();return new Promise((B,u)=>{const c=new OC;c.setWithCredentials(!0),c.listenOnce(NC.COMPLETE,()=>{try{switch(c.getLastErrorCode()){case to.NO_ERROR:const f=c.getResponseJson();q(ze,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(f)),B(f);break;case to.TIMEOUT:q(ze,`RPC '${e}' ${o} timed out`),u(new H(L.DEADLINE_EXCEEDED,"Request time out"));break;case to.HTTP_ERROR:const p=c.getStatus();if(q(ze,`RPC '${e}' ${o} failed with status:`,p,"response text:",c.getResponseText()),p>0){let w=c.getResponseJson();Array.isArray(w)&&(w=w[0]);const R=w==null?void 0:w.error;if(R&&R.status&&R.message){const k=function(K){const ee=K.toLowerCase().replace(/_/g,"-");return Object.values(L).indexOf(ee)>=0?ee:L.UNKNOWN}(R.status);u(new H(k,R.message))}else u(new H(L.UNKNOWN,"Server responded with status "+c.getStatus()))}else u(new H(L.UNAVAILABLE,"Connection failed."));break;default:X(9055,{wt:e,streamId:o,bt:c.getLastErrorCode(),St:c.getLastError()})}}finally{q(ze,`RPC '${e}' ${o} completed.`)}});const h=JSON.stringify(s);q(ze,`RPC '${e}' ${o} sending request:`,s),c.send(t,"POST",h,n,15)})}vt(e,t,n){const s=gB(),i=[this.Xe,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=this.createWebChannelTransport(),B={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(B.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(B.useFetchStreams=!0),this.it(B.initMessageHeaders,t,n),B.encodeInitMessageHeaders=!0;const c=i.join("");q(ze,`Creating RPC '${e}' stream ${s}: ${c}`,B);const h=o.createWebChannel(c,B);this.Dt(h);let f=!1,p=!1;const w=new Bw({ot:R=>{p?q(ze,`Not sending because RPC '${e}' stream ${s} is closed:`,R):(f||(q(ze,`Opening RPC '${e}' stream ${s} transport.`),h.open(),f=!0),q(ze,`RPC '${e}' stream ${s} sending:`,R),h.send(R))},ut:()=>h.close()});return gs(h,Es.EventType.OPEN,()=>{p||(q(ze,`RPC '${e}' stream ${s} transport opened.`),w.Rt())}),gs(h,Es.EventType.CLOSE,()=>{p||(p=!0,q(ze,`RPC '${e}' stream ${s} transport closed`),w.Vt(),this.xt(h))}),gs(h,Es.EventType.ERROR,R=>{p||(p=!0,Pt(ze,`RPC '${e}' stream ${s} transport errored. Name:`,R.name,"Message:",R.message),w.Vt(new H(L.UNAVAILABLE,"The operation could not be completed")))}),gs(h,Es.EventType.MESSAGE,R=>{var k;if(!p){const M=R.data[0];Q(!!M,16349);const K=M,ee=(K==null?void 0:K.error)||((k=K[0])==null?void 0:k.error);if(ee){q(ze,`RPC '${e}' stream ${s} received error:`,ee);const Be=ee.status;let he=function(A){const E=Oe[A];if(E!==void 0)return gf(E)}(Be),Ae=ee.message;Be==="NOT_FOUND"&&Ae.includes("database")&&Ae.includes("does not exist")&&Ae.includes(this.databaseId.database)&&Pt(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),he===void 0&&(he=L.INTERNAL,Ae="Unknown error status: "+Be+" with message "+ee.message),p=!0,w.Vt(new H(he,Ae)),h.close()}else q(ze,`RPC '${e}' stream ${s} received:`,M),w.dt(M)}}),kr.gt(),setTimeout(()=>{w.At()},0),w}terminate(){this.ft.forEach(e=>e.close()),this.ft=[]}Dt(e){this.ft.push(e)}xt(e){this.ft=this.ft.filter(t=>t===e)}it(e,t,n){super.it(e,t,n),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return kC()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uw(r){return new kr(r)}kr.yt=!1;class Ff{constructor(e,t,n=1e3,s=1.5,i=6e4){this.Ct=e,this.timerId=t,this.Ft=n,this.Ot=s,this.Mt=i,this.Nt=0,this.Lt=null,this.Bt=Date.now(),this.reset()}reset(){this.Nt=0}Ut(){this.Nt=this.Mt}kt(e){this.cancel();const t=Math.floor(this.Nt+this.qt()),n=Math.max(0,Date.now()-this.Bt),s=Math.max(0,t-n);s>0&&q("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.Nt} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.Lt=this.Ct.enqueueAfterDelay(this.timerId,s,()=>(this.Bt=Date.now(),e())),this.Nt*=this.Ot,this.Nt<this.Ft&&(this.Nt=this.Ft),this.Nt>this.Mt&&(this.Nt=this.Mt)}$t(){this.Lt!==null&&(this.Lt.skipDelay(),this.Lt=null)}cancel(){this.Lt!==null&&(this.Lt.cancel(),this.Lt=null)}qt(){return(Math.random()-.5)*this.Nt}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lh="PersistentStream";class Lf{constructor(e,t,n,s,i,o,B,u){this.Ct=e,this.Kt=n,this.Qt=s,this.connection=i,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=B,this.listener=u,this.state=0,this.Wt=0,this.Gt=null,this.zt=null,this.stream=null,this.jt=0,this.Ht=new Ff(e,t)}Jt(){return this.state===1||this.state===5||this.Yt()}Yt(){return this.state===2||this.state===3}start(){this.jt=0,this.state!==4?this.auth():this.Zt()}async stop(){this.Jt()&&await this.close(0)}Xt(){this.state=0,this.Ht.reset()}en(){this.Yt()&&this.Gt===null&&(this.Gt=this.Ct.enqueueAfterDelay(this.Kt,6e4,()=>this.tn()))}nn(e){this.rn(),this.stream.send(e)}async tn(){if(this.Yt())return this.close(0)}rn(){this.Gt&&(this.Gt.cancel(),this.Gt=null)}sn(){this.zt&&(this.zt.cancel(),this.zt=null)}async close(e,t){this.rn(),this.sn(),this.Ht.cancel(),this.Wt++,e!==4?this.Ht.reset():t&&t.code===L.RESOURCE_EXHAUSTED?(on(t.toString()),on("Using maximum backoff delay to prevent overloading the backend."),this.Ht.Ut()):t&&t.code===L.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this._n(),this.stream.close(),this.stream=null),this.state=e,await this.listener.Tt(t)}_n(){}auth(){this.state=1;const e=this.an(this.Wt),t=this.Wt;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([n,s])=>{this.Wt===t&&this.un(n,s)},n=>{e(()=>{const s=new H(L.UNKNOWN,"Fetching auth token failed: "+n.message);return this.cn(s)})})}un(e,t){const n=this.an(this.Wt);this.stream=this.En(e,t),this.stream.ct(()=>{n(()=>this.listener.ct())}),this.stream.Et(()=>{n(()=>(this.state=2,this.zt=this.Ct.enqueueAfterDelay(this.Qt,1e4,()=>(this.Yt()&&(this.state=3),Promise.resolve())),this.listener.Et()))}),this.stream.Tt(s=>{n(()=>this.cn(s))}),this.stream.onMessage(s=>{n(()=>++this.jt==1?this.hn(s):this.onNext(s))})}Zt(){this.state=5,this.Ht.kt(async()=>{this.state=0,this.start()})}cn(e){return q(lh,`close with error: ${e}`),this.stream=null,this.close(4,e)}an(e){return t=>{this.Ct.enqueueAndForget(()=>this.Wt===e?t():(q(lh,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class cw extends Lf{constructor(e,t,n,s,i,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}En(e,t){return this.connection.vt("Listen",e,t)}hn(e){return this.onNext(e)}onNext(e){this.Ht.reset();const t=GD(this.serializer,e),n=function(i){if(!("targetChange"in i))return ne.min();const o=i.targetChange;return o.targetIds&&o.targetIds.length?ne.min():o.readTime?Ut(o.readTime):ne.min()}(e);return this.listener.Tn(t,n)}Pn(e){const t={};t.database=pB(this.serializer),t.addTarget=function(i,o){let B;const u=o.target;if(B=tr(u)?{pipelineQuery:zD(i,u)}:df(u)?{documents:JD(i,u)}:{query:jD(i,u).Se},B.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){B.resumeToken=If(i,o.resumeToken);const c=fB(i,o.expectedCount);c!==null&&(B.expectedCount=c)}else if(o.snapshotVersion.compareTo(ne.min())>0){B.readTime=bs(i,o.snapshotVersion.toTimestamp());const c=fB(i,o.expectedCount);c!==null&&(B.expectedCount=c)}return B}(this.serializer,e);const n=KD(this.serializer,e);n&&(t.labels=n),this.nn(t)}In(e){const t={};t.database=pB(this.serializer),t.removeTarget=e,this.nn(t)}}class lw extends Lf{constructor(e,t,n,s,i,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,o),this.serializer=i}get Rn(){return this.jt>0}start(){this.lastStreamToken=void 0,super.start()}_n(){this.Rn&&this.An([])}En(e,t){return this.connection.vt("Write",e,t)}hn(e){return Q(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,Q(!e.writeResults||e.writeResults.length===0,55816),this.listener.Vn()}onNext(e){Q(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.Ht.reset();const t=HD(e.writeResults,e.commitTime),n=Ut(e.commitTime);return this.listener.dn(n,t)}fn(){const e={};e.database=pB(this.serializer),this.nn(e)}An(e){const t={streamToken:this.lastStreamToken,writes:e.map(n=>UD(this.serializer,n))};this.nn(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hw{}class Cw extends hw{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.mn=!1}pn(){if(this.mn)throw new H(L.FAILED_PRECONDITION,"The client has already been terminated.")}nt(e,t,n,s){return this.pn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([i,o])=>this.connection.nt(e,dB(t,n),s,i,o)).catch(i=>{throw i.name==="FirebaseError"?(i.code===L.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new H(L.UNKNOWN,i.toString())})}_t(e,t,n,s,i){return this.pn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,B])=>this.connection._t(e,dB(t,n),s,o,B,i)).catch(o=>{throw o.name==="FirebaseError"?(o.code===L.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new H(L.UNKNOWN,o.toString())})}terminate(){this.mn=!0,this.connection.terminate()}}function fw(r,e,t,n){return new Cw(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dw="ComponentProvider",hh=new Map;function pw(r,e,t,n,s){return new K_(r,e,t,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,Nf(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n,s._customHeaders,s.grpcFlowControlWindow)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ch={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},kf=41943040;class ut{static withCacheSize(e){return new ut(e,ut.DEFAULT_COLLECTION_PERCENTILE,ut.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}ut.DEFAULT_COLLECTION_PERCENTILE=10,ut.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,ut.DEFAULT=new ut(kf,ut.DEFAULT_COLLECTION_PERCENTILE,ut.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),ut.DISABLED=new ut(-1,0,0);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qo{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.gn(n),this.yn=n=>t.writeSequenceNumber(n))}gn(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.yn&&this.yn(e),e}}Qo.wn=-1;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gw="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class mw{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function zr(r){if(r.code!==L.FAILED_PRECONDITION||r.message!==gw)throw r;q("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class V{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&X(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new V((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof V?t:V.resolve(t)}catch(t){return V.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):V.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):V.reject(t)}static resolve(e){return new V((t,n)=>{t(e)})}static reject(e){return new V((t,n)=>{n(e)})}static waitFor(e){return new V((t,n)=>{let s=0,i=0,o=!1;e.forEach(B=>{++s,B.next(()=>{++i,o&&i===s&&t()},u=>n(u))}),o=!0,i===s&&t()})}static or(e){let t=V.resolve(!1);for(const n of e)t=t.next(s=>s?V.resolve(s):n());return t}static forEach(e,t){const n=[];return e.forEach((s,i)=>{n.push(t.call(this,s,i))}),this.waitFor(n)}static mapArray(e,t){return new V((n,s)=>{const i=e.length,o=new Array(i);let B=0;for(let u=0;u<i;u++){const c=u;t(e[c]).next(h=>{o[c]=h,++B,B===i&&n(o)},h=>s(h))}})}static doWhile(e,t){return new V((n,s)=>{const i=()=>{e()===!0?t().next(()=>{i()},s):n()};i()})}}function Ew(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}function Qr(r){return r.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fh="LruGarbageCollector",Vf=1048576;function dh([r,e],[t,n]){const s=oe(r,t);return s===0?oe(e,n):s}class _w{constructor(e){this.Yn=e,this.buffer=new ke(dh),this.Zn=0}Xn(){return++this.Zn}er(e){const t=[e,this.Xn()];if(this.buffer.size<this.Yn)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();dh(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class Dw{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.tr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.nr(6e4)}stop(){this.tr&&(this.tr.cancel(),this.tr=null)}get started(){return this.tr!==null}nr(e){q(fh,`Garbage collection scheduled in ${e}ms`),this.tr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.tr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){Qr(t)?q(fh,"Ignoring IndexedDB error during garbage collection: ",t):await zr(t)}await this.nr(3e5)})}}class ww{constructor(e,t){this.rr=e,this.params=t}calculateTargetCount(e,t){return this.rr.ir(e).next(n=>Math.floor(t/100*n))}nthSequenceNumber(e,t){if(t===0)return V.resolve(Qo.wn);const n=new _w(t);return this.rr.forEachTarget(e,s=>n.er(s.sequenceNumber)).next(()=>this.rr.sr(e,s=>n.er(s))).next(()=>n.maxValue)}removeTargets(e,t,n){return this.rr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.rr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(q("LruGarbageCollector","Garbage collection skipped; disabled"),V.resolve(Ch)):this.getCacheSize(e).next(n=>n<this.params.cacheSizeCollectionThreshold?(q("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Ch):this._r(e,t))}getCacheSize(e){return this.rr.getCacheSize(e)}_r(e,t){let n,s,i,o,B,u,c;const h=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(f=>(f>this.params.maximumSequenceNumbersToCollect?(q("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${f}`),s=this.params.maximumSequenceNumbersToCollect):s=f,o=Date.now(),this.nthSequenceNumber(e,s))).next(f=>(n=f,B=Date.now(),this.removeTargets(e,n,t))).next(f=>(i=f,u=Date.now(),this.removeOrphanedDocuments(e,n))).next(f=>(c=Date.now(),Pr()<=ae.DEBUG&&q("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-h}ms
	Determined least recently used ${s} in `+(B-o)+`ms
	Removed ${i} targets in `+(u-B)+`ms
	Removed ${f} documents in `+(c-u)+`ms
Total Duration: ${c-h}ms`),V.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:f})))}}function Iw(r,e){return new ww(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xf="firestore.googleapis.com",ph=!0;class gh{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new H(L.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=xf,this.ssl=ph}else this.host=e.host,this.ssl=e.ssl??ph;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e._customHeaders&&(this._customHeaders={...e._customHeaders}),e.cacheSizeBytes===void 0)this.cacheSizeBytes=kf;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Vf)throw new H(L.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}if(J_("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Nf(e.experimentalLongPollingOptions??{}),function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new H(L.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new H(L.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new H(L.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams,e.grpcFlowControlWindow!==void 0){if(typeof e.grpcFlowControlWindow!="number"||e.grpcFlowControlWindow<=0||e.grpcFlowControlWindow>2147483647||!Number.isInteger(e.grpcFlowControlWindow))throw new H(L.INVALID_ARGUMENT,"grpcFlowControlWindow must be a positive integer and cannot exceed 2147483647");this.grpcFlowControlWindow=e.grpcFlowControlWindow}}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(n,s){return n.timeoutSeconds===s.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams&&this.grpcFlowControlWindow===e.grpcFlowControlWindow&&function(n,s){if(n===s)return!0;if(!n||!s)return!1;const i=Object.keys(n),o=Object.keys(s);if(i.length!==o.length)return!1;for(const B of i)if(n[B]!==s[B])return!1;return!0}(this._customHeaders,e._customHeaders)}}let Wo=class{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new gh({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new H(L.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new H(L.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new gh(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(n){if(!n)return new ZD;switch(n.type){case"firstParty":return new rw(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new H(L.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const n=hh.get(t);n&&(q(dw,"Removing Datastore"),hh.delete(t),n.terminate())}(this),Promise.resolve()}};function yw(r,e,t,n={}){var c;r=st(r,Wo);const s=jn(e),i=r._getSettings(),o={...i,emulatorOptions:r._getEmulatorOptions()},B=`${e}:${t}`;s&&Oo(`https://${B}`),i.host!==xf&&i.host!==B&&Pt("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const u={...i,host:B,ssl:s,emulatorOptions:n};if(!Sn(u,o)&&(r._setSettings(u),n.mockUserToken)){let h,f;if(typeof n.mockUserToken=="string")h=n.mockUserToken,f=Qe.MOCK_USER;else{h=Wh(n.mockUserToken,(c=r._app)==null?void 0:c.options.projectId);const p=n.mockUserToken.sub||n.mockUserToken.user_id;if(!p)throw new H(L.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");f=new Qe(p)}r._authCredentials=new ew(new Of(h,f))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bn{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new Bn(this.firestore,e,this._query)}}class ve{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new vn(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ve(this.firestore,e,this._key)}toJSON(){return{type:ve._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(ui(t,ve._jsonSchema))return new ve(e,n||null,new $(fe.fromString(t.referencePath)))}}ve._jsonSchemaVersion="firestore/documentReference/1.0",ve._jsonSchema={type:Le("string",ve._jsonSchemaVersion),referencePath:Le("string")};class vn extends Bn{constructor(e,t,n){super(e,t,jo(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ve(this.firestore,null,new $(e))}withConverter(e){return new vn(this.firestore,e,this._path)}}function WA(r,e,...t){if(r=ye(r),qC("collection","path",e),r instanceof Wo){const n=fe.fromString(e,...t);return Jl(n),new vn(r,null,n)}{if(!(r instanceof ve||r instanceof vn))throw new H(L.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(fe.fromString(e,...t));return Jl(n),new vn(r.firestore,null,n)}}function Tw(r,e,...t){if(r=ye(r),arguments.length===1&&(e=GB.newId()),qC("doc","path",e),r instanceof Wo){const n=fe.fromString(e,...t);return Hl(n),new ve(r,null,new $(n))}{if(!(r instanceof ve||r instanceof vn))throw new H(L.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(fe.fromString(e,...t));return Hl(n),new ve(r.firestore,r instanceof vn?r.converter:null,new $(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lt{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0}(this._values,e._values)}toJSON(){return{type:lt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(ui(e,lt._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(t=>typeof t=="number"))return new lt(e.vectorValues);throw new H(L.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}lt._jsonSchemaVersion="firestore/vectorValue/1.0",lt._jsonSchema={type:Le("string",lt._jsonSchemaVersion),vectorValues:Le("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Aw=/^__.*__$/;class Rw{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new Kn(e,this.data,this.fieldMask,t,this.fieldTransforms):new li(e,this.data,t,this.fieldTransforms)}}class Mf{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new Kn(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function Gf(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw X(40011,{dataSource:r})}}class WB{constructor(e,t,n,s,i,o){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.validatePath(),this.fieldTransforms=i||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(e){return new WB({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePathSegment(e),n}childContextForFieldPath(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePath(),n}childContextForArray(e){return this.contextWith({path:void 0,arrayElement:!0})}createError(e){return yo(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}validatePath(){if(this.path)for(let e=0;e<this.path.length;e++)this.validatePathSegment(this.path.get(e))}validatePathSegment(e){if(e.length===0)throw this.createError("Document fields must not be empty");if(Gf(this.dataSource)&&Aw.test(e))throw this.createError('Document fields cannot begin and end with "__"')}}class vw{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||Ko(e)}createContext(e,t,n,s=!1){return new WB({dataSource:e,methodName:t,targetDoc:n,path:Dt.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function di(r){const e=r._freezeSettings(),t=Ko(r._databaseId);return new vw(r._databaseId,!!e.ignoreUndefinedProperties,t)}function $B(r,e,t,n,s,i={}){const o=r.createContext(i.merge||i.mergeFields?2:0,e,t,s);XB("Data must be an object, but it was:",o,n);const B=Jf(n,o);let u,c;if(i.merge)u=new mt(o.fieldMask),c=o.fieldTransforms;else if(i.mergeFields){const h=[];for(const f of i.mergeFields){const p=xn(e,f,t);if(!o.contains(p))throw new H(L.INVALID_ARGUMENT,`Field '${p}' is specified in your field mask but missing from your input data.`);zf(h,p)||h.push(p)}u=new mt(h),c=o.fieldTransforms.filter(f=>u.covers(f.field))}else u=null,c=o.fieldTransforms;return new Rw(new nt(B),u,c)}class $o extends zo{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.createError(`${this._methodName}() can only appear at the top level of your update data`):e.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof $o}}class YB extends zo{_toFieldTransform(e){return new eD(e.path,new Js)}isEqual(e){return e instanceof YB}}function Uf(r,e,t,n){const s=r.createContext(1,e,t);XB("Data must be an object, but it was:",s,n);const i=[],o=nt.empty();qn(n,(u,c)=>{const h=Kf(e,u,t);c=ye(c);const f=s.childContextForFieldPath(h);if(c instanceof $o)i.push(h);else{const p=Vn(c,f);p!=null&&(i.push(h),o.set(h,p))}});const B=new mt(i);return new Mf(o,B,s.fieldTransforms)}function Hf(r,e,t,n,s,i){const o=r.createContext(1,e,t),B=[xn(e,n,t)],u=[s];if(i.length%2!=0)throw new H(L.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let p=0;p<i.length;p+=2)B.push(xn(e,i[p])),u.push(i[p+1]);const c=[],h=nt.empty();for(let p=B.length-1;p>=0;--p)if(!zf(c,B[p])){const w=B[p];let R=u[p];R=ye(R);const k=o.childContextForFieldPath(w);if(R instanceof $o)c.push(w);else{const M=Vn(R,k);M!=null&&(c.push(w),h.set(w,M))}}const f=new mt(c);return new Mf(h,f,o.fieldTransforms)}function Pw(r,e,t,n=!1){return Vn(t,r.createContext(n?4:3,e))}function Vn(r,e,t){if(qf(r=ye(r)))return XB("Unsupported field value:",e,r),Jf(r,e);if(r instanceof zo)return function(s,i){if(!Gf(i.dataSource))throw i.createError(`${s._methodName}() can only be used with update() and set()`);if(!i.path)throw i.createError(`${s._methodName}() is not currently supported inside arrays`);const o=s._toFieldTransform(i);o&&i.fieldTransforms.push(o)}(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return function(s,i){const o=[];let B=0;for(const u of s){let c=Vn(u,i.childContextForArray(B));c==null&&(c={nullValue:"NULL_VALUE"}),o.push(c),B++}return{arrayValue:{values:o}}}(r,e)}return function(s,i,o){if((s=ye(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return JB(i.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const B=de.fromDate(s);return{timestampValue:bs(i.serializer,B)}}if(s instanceof de){const B=new de(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:bs(i.serializer,B)}}if(jf(s)){const B=de.fromInstant(s),u=new de(B.seconds,1e3*Math.floor(B.nanoseconds/1e3));return{timestampValue:bs(i.serializer,u)}}if(s instanceof Ht)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof Tt)return{bytesValue:If(i.serializer,s._byteString)};if(s instanceof ve){const B=i.databaseId,u=s.firestore._databaseId;if(!u.isEqual(B))throw i.createError(`Document reference is for database ${u.projectId}/${u.database} but should be for database ${B.projectId}/${B.database}`);return{referenceValue:QB(s.firestore._databaseId||i.databaseId,s._key.path)}}if(s instanceof lt)return function(u,c){const h=u instanceof lt?u.toArray():u;return{mapValue:{fields:{[YC]:{stringValue:XC},[Us]:{arrayValue:{values:h.map(p=>{if(typeof p!="number")throw c.createError("VectorValues must only contain numeric values.");return Go(c.serializer,p)})}}}}}}(s,i);if(bf(s))return s._toProto(i.serializer);throw i.createError(`Unsupported field value: ${Vo(s)}`)}(r,e)}function Jf(r,e){const t={};return jC(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):qn(r,(n,s)=>{const i=Vn(s,e.childContextForField(n));i!=null&&(t[n]=i)}),{mapValue:{fields:t}}}function jf(r){if(typeof r!="object"||r===null)return!1;if(typeof Temporal<"u"&&typeof Temporal.Instant=="function"&&r instanceof Temporal.Instant)return!0;const e=r;return e[Symbol.toStringTag]==="Temporal.Instant"&&typeof e.t=="bigint"}function qf(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof de||r instanceof Ht||r instanceof Tt||r instanceof ve||r instanceof zo||r instanceof lt||jf(r)||bf(r))}function XB(r,e,t){if(!qf(t)||!Bi(t)){const n=Vo(t);throw n==="an object"?e.createError(r+" a custom object"):e.createError(r+" "+n)}}function xn(r,e,t){if((e=ye(e))instanceof fi)return e._internalPath;if(typeof e=="string")return Kf(r,e);throw yo("Field path arguments must be of type string or ",r,!1,void 0,t)}const bw=new RegExp("[~\\*/\\[\\]]");function Kf(r,e,t){if(e.search(bw)>=0)throw yo(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new fi(...e.split("."))._internalPath}catch{throw yo(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function yo(r,e,t,n,s){const i=n&&!n.isEmpty(),o=s!==void 0;let B=`Function ${e}() called with invalid data`;t&&(B+=" (via `toFirestore()`)"),B+=". ";let u="";return(i||o)&&(u+=" (found",i&&(u+=` in field ${n}`),o&&(u+=` in document ${s}`),u+=")"),new H(L.INVALID_ARGUMENT,B+r+u)}function zf(r,e){return r.some(t=>t.isEqual(e))}function Qf(r){return typeof r._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ye{constructor(e){this.optionDefinitions=e}_getKnownOptions(e,t){const n=nt.empty();for(const s in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(s)){const i=this.optionDefinitions[s];if(s in e){const o=e[s];let B;i.nestedOptions&&Bi(o)?B={mapValue:{fields:new Ye(i.nestedOptions).getOptionsProto(t,o)}}:o&&(B=Vn(o,t)??void 0),B&&n.set(Dt.fromServerFormat(i.serverName),B)}}return n}getOptionsProto(e,t,n){const s=this._getKnownOptions(t,e);if(n){const i=new Map(H_(n,(o,B)=>[Dt.fromServerFormat(B),o!==void 0?Vn(o,e):null]));s.setAll(i)}return s.value.mapValue.fields??{}}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Sw(r){return typeof r=="object"&&r!==null&&!!("nullValue"in r&&(r.nullValue===null||r.nullValue==="NULL_VALUE")||"booleanValue"in r&&(r.booleanValue===null||typeof r.booleanValue=="boolean")||"integerValue"in r&&(r.integerValue===null||typeof r.integerValue=="number"||typeof r.integerValue=="string")||"doubleValue"in r&&(r.doubleValue===null||typeof r.doubleValue=="number")||"timestampValue"in r&&(r.timestampValue===null||function(t){return typeof t=="object"&&t!==null&&"seconds"in t&&(t.seconds===null||typeof t.seconds=="number"||typeof t.seconds=="string")&&"nanos"in t&&(t.nanos===null||typeof t.nanos=="number")}(r.timestampValue))||"stringValue"in r&&(r.stringValue===null||typeof r.stringValue=="string")||"bytesValue"in r&&(r.bytesValue===null||r.bytesValue instanceof Uint8Array)||"referenceValue"in r&&(r.referenceValue===null||typeof r.referenceValue=="string")||"geoPointValue"in r&&(r.geoPointValue===null||function(t){return typeof t=="object"&&t!==null&&"latitude"in t&&(t.latitude===null||typeof t.latitude=="number")&&"longitude"in t&&(t.longitude===null||typeof t.longitude=="number")}(r.geoPointValue))||"arrayValue"in r&&(r.arrayValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("values"in t)||t.values!==null&&!Array.isArray(t.values))}(r.arrayValue))||"mapValue"in r&&(r.mapValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("fields"in t)||t.fields!==null&&!Bi(t.fields))}(r.mapValue))||"fieldReferenceValue"in r&&(r.fieldReferenceValue===null||typeof r.fieldReferenceValue=="string")||"functionValue"in r&&(r.functionValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("name"in t)||t.name!==null&&typeof t.name!="string"||!("args"in t)||t.args!==null&&!Array.isArray(t.args))}(r.functionValue))||"pipelineValue"in r&&(r.pipelineValue===null||function(t){return typeof t=="object"&&t!==null&&!(!("stages"in t)||t.stages!==null&&!Array.isArray(t.stages))}(r.pipelineValue)))}function $A(){return new YB("serverTimestamp")}function Ow(r){return new lt(r)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function J(r){let e;return r instanceof Dr?r:(e=Bi(r)?Vw(r):r instanceof Array?xw(r):Wf(r,void 0),e)}function ja(r){if(r instanceof Dr)return r;if(r instanceof lt)return $s(r);if(Array.isArray(r))return $s(Ow(r));throw new Error("Unsupported value: "+typeof r)}function ZB(r){return W_(r)?oo(r):J(r)}class Dr{constructor(){this._protoValueType="ProtoValue"}add(e){return new F("add",[this,J(e)],"add")}asBoolean(){if(this instanceof Mn)return this;if(this instanceof $r)return new Yf(this);if(this instanceof Wr)return new kw(this);if(this instanceof F)return new $f(this);throw new H("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(e){return new F("subtract",[this,J(e)],"subtract")}multiply(e){return new F("multiply",[this,J(e)],"multiply")}divide(e){return new F("divide",[this,J(e)],"divide")}mod(e){return new F("mod",[this,J(e)],"mod")}equal(e){return new F("equal",[this,J(e)],"equal").asBoolean()}notEqual(e){return new F("not_equal",[this,J(e)],"notEqual").asBoolean()}lessThan(e){return new F("less_than",[this,J(e)],"lessThan").asBoolean()}lessThanOrEqual(e){return new F("less_than_or_equal",[this,J(e)],"lessThanOrEqual").asBoolean()}greaterThan(e){return new F("greater_than",[this,J(e)],"greaterThan").asBoolean()}greaterThanOrEqual(e){return new F("greater_than_or_equal",[this,J(e)],"greaterThanOrEqual").asBoolean()}arrayConcat(e,...t){const n=[e,...t].map(s=>J(s));return new F("array_concat",[this,...n],"arrayConcat")}arrayContains(e){return new F("array_contains",[this,J(e)],"arrayContains").asBoolean()}arrayContainsAll(e){const t=Array.isArray(e)?new Ds(e.map(J),"arrayContainsAll"):e;return new F("array_contains_all",[this,t],"arrayContainsAll").asBoolean()}arrayContainsAny(e){const t=Array.isArray(e)?new Ds(e.map(J),"arrayContainsAny"):e;return new F("array_contains_any",[this,t],"arrayContainsAny").asBoolean()}arrayReverse(){return new F("array_reverse",[this])}arrayLength(){return new F("array_length",[this],"arrayLength")}equalAny(e){const t=Array.isArray(e)?new Ds(e.map(J),"equalAny"):e;return new F("equal_any",[this,t],"equalAny").asBoolean()}notEqualAny(e){const t=Array.isArray(e)?new Ds(e.map(J),"notEqualAny"):e;return new F("not_equal_any",[this,t],"notEqualAny").asBoolean()}exists(){return new F("exists",[this],"exists").asBoolean()}charLength(){return new F("char_length",[this],"charLength")}like(e){return new F("like",[this,J(e)],"like").asBoolean()}regexContains(e){return new F("regex_contains",[this,J(e)],"regexContains").asBoolean()}regexFind(e){return new F("regex_find",[this,J(e)],"regexFind")}regexFindAll(e){return new F("regex_find_all",[this,J(e)],"regexFindAll")}regexMatch(e){return new F("regex_match",[this,J(e)],"regexMatch").asBoolean()}stringContains(e){return new F("string_contains",[this,J(e)],"stringContains").asBoolean()}startsWith(e){return new F("starts_with",[this,J(e)],"startsWith").asBoolean()}endsWith(e){return new F("ends_with",[this,J(e)],"endsWith").asBoolean()}toLower(){return new F("to_lower",[this],"toLower")}toUpper(){return new F("to_upper",[this],"toUpper")}trim(e){const t=[this];return e&&t.push(J(e)),new F("trim",t,"trim")}ltrim(e){const t=[this];return e&&t.push(J(e)),new F("ltrim",t,"ltrim")}rtrim(e){const t=[this];return e&&t.push(J(e)),new F("rtrim",t,"rtrim")}type(){return new F("type",[this])}isType(e){return new F("is_type",[this,$s(e)],"isType").asBoolean()}stringConcat(e,...t){const n=[e,...t].map(J);return new F("string_concat",[this,...n],"stringConcat")}stringIndexOf(e){return new F("string_index_of",[this,J(e)],"stringIndexOf")}stringRepeat(e){return new F("string_repeat",[this,J(e)],"stringRepeat")}stringReplaceAll(e,t){return new F("string_replace_all",[this,J(e),J(t)],"stringReplaceAll")}stringReplaceOne(e,t){return new F("string_replace_one",[this,J(e),J(t)],"stringReplaceOne")}concat(e,...t){const n=[e,...t].map(J);return new F("concat",[this,...n],"concat")}reverse(){return new F("reverse",[this],"reverse")}arrayFilter(e,t){return new F("array_filter",[this,J(e),t],"arrayFilter")}arrayTransform(e,t){return new F("array_transform",[this,J(e),t],"arrayTransform")}arrayTransformWithIndex(e,t,n){return new F("array_transform",[this,J(e),J(t),n],"arrayTransformWithIndex")}arraySlice(e,t){const n=[this,J(e)];return t!==void 0&&n.push(J(t)),new F("array_slice",n,"arraySlice")}arrayFirst(){return new F("array_first",[this],"arrayFirst")}arrayFirstN(e){return new F("array_first_n",[this,J(e)],"arrayFirstN")}arrayLast(){return new F("array_last",[this],"arrayLast")}arrayLastN(e){return new F("array_last_n",[this,J(e)],"arrayLastN")}arrayMaximum(){return new F("maximum",[this],"arrayMaximum")}arrayMaximumN(e){return new F("maximum_n",[this,J(e)],"arrayMaximumN")}arrayMinimum(){return new F("minimum",[this],"arrayMinimum")}arrayMinimumN(e){return new F("minimum_n",[this,J(e)],"arrayMinimumN")}arrayIndexOf(e){return new F("array_index_of",[this,J(e),J("first")],"arrayIndexOf")}arrayLastIndexOf(e){return new F("array_index_of",[this,J(e),J("last")],"arrayLastIndexOf")}arrayIndexOfAll(e){return new F("array_index_of_all",[this,J(e)],"arrayIndexOfAll")}byteLength(){return new F("byte_length",[this],"byteLength")}ceil(){return new F("ceil",[this])}floor(){return new F("floor",[this])}abs(){return new F("abs",[this])}exp(){return new F("exp",[this])}mapGet(e){return new F("map_get",[this,$s(e)],"mapGet")}mapSet(e,t,...n){const s=[this,J(e),J(t),...n.map(J)];return new F("map_set",s,"mapSet")}mapKeys(){return new F("map_keys",[this],"mapKeys")}mapValues(){return new F("map_values",[this],"mapValues")}mapEntries(){return new F("map_entries",[this],"mapEntries")}getField(e){return new F("get_field",[this,J(e)],"get_field")}count(){return gt._create("count",[this],"count")}sum(){return gt._create("sum",[this],"sum")}average(){return gt._create("average",[this],"average")}minimum(){return gt._create("minimum",[this],"minimum")}maximum(){return gt._create("maximum",[this],"maximum")}first(){return gt._create("first",[this],"first")}last(){return gt._create("last",[this],"last")}arrayAgg(){return gt._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return gt._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return gt._create("count_distinct",[this],"countDistinct")}logicalMaximum(e,...t){const n=[e,...t];return new F("maximum",[this,...n.map(J)],"logicalMaximum")}logicalMinimum(e,...t){const n=[e,...t];return new F("minimum",[this,...n.map(J)],"minimum")}vectorLength(){return new F("vector_length",[this],"vectorLength")}cosineDistance(e){return new F("cosine_distance",[this,ja(e)],"cosineDistance")}dotProduct(e){return new F("dot_product",[this,ja(e)],"dotProduct")}euclideanDistance(e){return new F("euclidean_distance",[this,ja(e)],"euclideanDistance")}unixMicrosToTimestamp(){return new F("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new F("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new F("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new F("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new F("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new F("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(e,t){return new F("timestamp_add",[this,J(e),J(t)],"timestampAdd")}timestampSubtract(e,t){return new F("timestamp_subtract",[this,J(e),J(t)],"timestampSubtract")}timestampDiff(e,t){return new F("timestamp_diff",[this,ZB(e),J(t)],"timestampDiff")}timestampExtract(e,t){const n=[this,J(e)];return t&&n.push(J(t)),new F("timestamp_extract",n,"timestampExtract")}documentId(){return new F("document_id",[this],"documentId")}parent(){return new F("parent",[this],"parent")}substring(e,t){const n=J(e);return new F("substring",t===void 0?[this,n]:[this,n,J(t)],"substring")}arrayGet(e){return new F("array_get",[this,J(e)],"arrayGet")}isError(){return new F("is_error",[this],"isError").asBoolean()}ifError(e){const t=new F("if_error",[this,J(e)],"ifError");return e instanceof Mn?t.asBoolean():t}isAbsent(){return new F("is_absent",[this],"isAbsent").asBoolean()}mapRemove(e){return new F("map_remove",[this,J(e)],"mapRemove")}mapMerge(e,...t){const n=J(e),s=t.map(J);return new F("map_merge",[this,n,...s],"mapMerge")}pow(e){return new F("pow",[this,J(e)])}trunc(e){return e===void 0?new F("trunc",[this]):new F("trunc",[this,J(e)],"trunc")}round(e){return e===void 0?new F("round",[this]):new F("round",[this,J(e)],"round")}collectionId(){return new F("collection_id",[this])}length(){return new F("length",[this])}ln(){return new F("ln",[this])}sqrt(){return new F("sqrt",[this])}stringReverse(){return new F("string_reverse",[this])}ifAbsent(e){return new F("if_absent",[this,J(e)],"ifAbsent")}ifNull(e){return new F("if_null",[this,J(e)],"ifNull")}coalesce(e,...t){return new F("coalesce",[this,J(e),...t.map(J)],"coalesce")}join(e){return new F("join",[this,J(e)],"join")}log10(){return new F("log10",[this])}arraySum(){return new F("sum",[this])}split(e){return new F("split",[this,J(e)])}timestampTruncate(e,t){const n=[this,J(e)];return t&&n.push(J(t)),new F("timestamp_trunc",n)}ascending(){return Mw(this)}descending(){return Gw(this)}as(e){return new Fw(this,e,"as")}}class gt{constructor(e,t){this.name=e,this.params=t,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(e,t,n){const s=new gt(e,t);return s._methodName=n,s}as(e){return new Nw(this,e,"as")}_toProto(e){return{functionValue:{name:this.name,args:this.params.map(t=>t._toProto(e))}}}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach(t=>t._readUserData(e))}}class Nw{constructor(e,t,n){this.aggregate=e,this.alias=t,this._methodName=n}_readUserData(e){this.aggregate._readUserData(e)}}class Fw{constructor(e,t,n){this.expr=e,this.alias=t,this._methodName=n,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(e){this.expr._readUserData(e)}}class Ds extends Dr{constructor(e,t){super(),this.cr=e,this._methodName=t,this.expressionType="ListOfExpressions"}_toProto(e){return{arrayValue:{values:this.cr.map(t=>t._toProto(e))}}}_readUserData(e){this.cr.forEach(t=>t._readUserData(e))}}class Wr extends Dr{constructor(e,t){super(),this.fieldPath=e,this._methodName=t,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(e){return new F("geo_distance",[this,J(e)],"geoDistance")}_toProto(e){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(e){}}function oo(r){return Lw(r,"field")}function Lw(r,e){return new Wr(typeof r=="string"?Ft===r?XD()._internalPath:xn("field",r):r._internalPath,e)}class $r extends Dr{constructor(e,t){super(),this.value=e,this._methodName=t,this.expressionType="Constant"}static _fromProto(e){const t=new $r(e,void 0);return t._protoValue=e,t}_toProto(e){return Q(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,Sw(this._protoValue)||(this._protoValue=Vn(this.value,e))}}function $s(r,e){return Wf(r,"constant")}function Wf(r,e){const t=new $r(r,e);return typeof r=="boolean"?new Yf(t):t}class F extends Dr{constructor(e,t,n,s){super(),this.name=e,this.params=t,this.expressionType="Function",this._optionsProto=void 0,n!==void 0&&(this._methodName=n),s!==void 0&&(this._options=s)}get _optionsUtil(){return new Ye({})}_toProto(e){const t={functionValue:{name:this.name,args:this.params.map(n=>n._toProto(e))}};return this._optionsProto&&(t.functionValue.options=this._optionsProto),t}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach(t=>t._readUserData(e)),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(e,this._options))}}class Mn extends Dr{get _methodName(){return this._expr._methodName}countIf(){return gt._create("count_if",[this],"countIf")}not(){return new F("not",[this],"not").asBoolean()}conditional(e,t){return new F("conditional",[this,e,t],"conditional")}ifError(e){const t=J(e),n=new F("if_error",[this,t],"ifError");return t instanceof Mn?n.asBoolean():n}_toProto(e){return this._expr._toProto(e)}_readUserData(e){this._expr._readUserData(e)}}class $f extends Mn{constructor(e){super(),this._expr=e,this.expressionType="Function"}}class Yf extends Mn{constructor(e){super(),this._expr=e,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}}class kw extends Mn{constructor(e){super(),this._expr=e,this.expressionType="Field"}}function Vw(r,e){const t=[];for(const n in r)if(Object.prototype.hasOwnProperty.call(r,n)){const s=r[n];t.push($s(n)),t.push(J(s))}return new F("map",t,"map")}function xw(r){return function(t,n){return new F("array",t.map(s=>J(s)),n)}(r,"array")}function Mw(r){return new Xf(ZB(r),"ascending","ascending")}function Gw(r){return new Xf(ZB(r),"descending","descending")}class Xf{constructor(e,t,n){this.expr=e,this.direction=t,this._methodName=n,this._protoValueType="ProtoValue"}_toProto(e){return{mapValue:{fields:{direction:Sf(this.direction),expression:this.expr._toProto(e)}}}}_readUserData(e){this.expr._readUserData(e)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wt{constructor(e){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=e}_readUserData(e){this.optionsProto=this._optionsUtil.getOptionsProto(e,this.knownOptions,this.rawOptions)}_toProto(e){return{name:this._name,options:this.optionsProto}}}class Zf extends wt{get _name(){return"add_fields"}get _optionsUtil(){return new Ye({})}constructor(e,t){super(t),this.fields=e}_toProto(e){return{...super._toProto(e),args:[Ws(e,this.fields)]}}_readUserData(e){super._readUserData(e),Gn(this.fields,e)}}class ed extends wt{get _name(){return"aggregate"}get _optionsUtil(){return new Ye({})}constructor(e,t,n){super(n),this.groups=e,this.accumulators=t}_toProto(e){return{...super._toProto(e),args:[Ws(e,this.accumulators),Ws(e,this.groups)]}}_readUserData(e){super._readUserData(e),Gn(this.groups,e),Gn(this.accumulators,e)}}class td extends wt{get _name(){return"distinct"}get _optionsUtil(){return new Ye({})}constructor(e,t){super(t),this.groups=e}_toProto(e){return{...super._toProto(e),args:[Ws(e,this.groups)]}}_readUserData(e){super._readUserData(e),Gn(this.groups,e)}}class Yo extends wt{get _name(){return"collection"}get _optionsUtil(){return new Ye({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.hr=e.startsWith("/")?e:"/"+e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:this.hr}]}}_readUserData(e){super._readUserData(e)}}class Xo extends wt{get _name(){return"collection_group"}get _optionsUtil(){return new Ye({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.collectionId=e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(e){super._readUserData(e)}}class eu extends wt{get _name(){return"database"}get _optionsUtil(){return new Ye({})}_toProto(e){return{...super._toProto(e)}}_readUserData(e){super._readUserData(e)}}class tu extends wt{get _name(){return"documents"}get _optionsUtil(){return new Ye({})}constructor(e,t){if(super(t),!e||e.length===0)throw new H(L.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");const n=e.map(i=>i.startsWith("/")?i:"/"+i),s=new Set(n);if(s.size!==n.length)throw new H(L.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.Tr=n,this.Pr=s}_toProto(e){return{...super._toProto(e),args:this.Tr.map(t=>({referenceValue:t}))}}_readUserData(e){super._readUserData(e)}}class Zo extends wt{get _name(){return"where"}get _optionsUtil(){return new Ye({})}constructor(e,t){super(t),this.condition=e}_toProto(e){return{...super._toProto(e),args:[this.condition._toProto(e)]}}_readUserData(e){super._readUserData(e),Gn(this.condition,e)}}class gr extends wt{get _name(){return"limit"}get _optionsUtil(){return new Ye({})}constructor(e,t){Q(!isNaN(e)&&e!==1/0&&e!==-1/0,34860),super(t),this.limit=e}_toProto(e){return{...super._toProto(e),args:[JB(e,this.limit)]}}}class mh extends wt{get _name(){return"offset"}get _optionsUtil(){return new Ye({})}constructor(e,t){super(t),this.offset=e}_toProto(e){return{...super._toProto(e),args:[JB(e,this.offset)]}}}class Uw extends wt{get _name(){return"select"}get _optionsUtil(){return new Ye({})}constructor(e,t){super(t),this.selections=e}_toProto(e){return{...super._toProto(e),args:[Ws(e,this.selections)]}}_readUserData(e){super._readUserData(e),Gn(this.selections,e)}}class Zt extends wt{get _name(){return"sort"}get _optionsUtil(){return new Ye({})}constructor(e,t){super(t),this.orderings=e}_toProto(e){return{...super._toProto(e),args:this.orderings.map(t=>t._toProto(e))}}_readUserData(e){super._readUserData(e),Gn(this.orderings,e)}}class nu extends wt{get _name(){return"replace_with"}get _optionsUtil(){return new Ye({})}constructor(e,t){super(t),this.map=e}_toProto(e){return{...super._toProto(e),args:[this.map._toProto(e),Sf(nu.Ir)]}}_readUserData(e){super._readUserData(e),Gn(this.map,e)}}nu.Ir="full_replace";function Gn(r,e){return Qf(r)?r._readUserData(e):Array.isArray(r)?r.forEach(t=>t._readUserData(e)):r instanceof Map?r.forEach(t=>t._readUserData(e)):Object.values(r).forEach(t=>t._readUserData(e)),r}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ss{constructor(e,t,n,s){this._db=e,this.userDataReader=t,this._userDataWriter=n,this.stages=s}Vr(e,t){const n=this.userDataReader.createContext(3,e);return Qf(t)?t._readUserData(n):Array.isArray(t)?t.forEach(s=>s._readUserData(n)):t.forEach(s=>s._readUserData(n)),t}where(e){const t=this.stages.map(n=>n);return this.Vr("where",e),t.push(new Zo(e,{})),new Ss(this._db,this.userDataReader,this._userDataWriter,t)}limit(e){const t=this.stages.map(n=>n);return t.push(new gr(e,{})),new Ss(this._db,this.userDataReader,this._userDataWriter,t)}sort(e,...t){const n=this.stages.map(s=>s);return"orderings"in e?n.push(new Zt(this.Vr("sort",e.orderings),{})):n.push(new Zt(this.Vr("sort",[e,...t]),{})),new Ss(this._db,this.userDataReader,this._userDataWriter,n)}dr(e){return{pipeline:{stages:this.stages.map(t=>t._toProto(e))}}}}// Copyright 2024 Google LLC* @license
class tt{constructor(e,t,n){this.serializer=e,this.stages=t,this.listenOptions=n,this.isCorePipeline=!0}getPipelineCollection(){return ea(this)}getPipelineCollectionGroup(){return ru(this)}getPipelineCollectionId(){return Hw(this)}getPipelineDocuments(){return mB(this)}getPipelineFlavor(){return function(t){let n="exact";return t.stages.forEach((s,i)=>{s._name!==td.name&&s._name!==ed.name||(n="keyless"),s._name===Uw.name&&n==="exact"&&(n="augmented"),s._name===Zf.name&&i<t.stages.length-1&&n==="exact"&&(n="augmented")}),n}(this)}getPipelineSourceType(){return Pn(this)}}function Pn(r){const e=r.stages[0];return e instanceof Yo||e instanceof Xo||e instanceof eu||e instanceof tu?e._name:"unknown"}function ea(r){if(Pn(r)==="collection")return r.stages[0].hr}function ru(r){if(Pn(r)==="collection_group")return r.stages[0].collectionId}function Hw(r){switch(Pn(r)){case"collection":return fe.fromString(ea(r)).lastSegment();case"collection_group":return ru(r);default:return}}function mB(r){if(Pn(r)==="documents")return r.stages[0].Tr}class I{constructor(e,t){this.type=e,this.value=t}static mr(){return new I("ERROR",void 0)}static pr(){return new I("UNSET",void 0)}static gr(){return new I("NULL",Gr)}static newValue(e){return Et(e)?new I("NULL",Gr):function(n){return!!n&&"booleanValue"in n}(e)?new I("BOOLEAN",e):Lt(e)?new I("INT",e):sr(e)?new I("DOUBLE",e):function(n){return!!n&&"timestampValue"in n&&!!n.timestampValue}(e)?new I("TIMESTAMP",e):function(n){return!!n&&"stringValue"in n}(e)?new I("STRING",e):function(n){return!!n&&"bytesValue"in n}(e)?new I("BYTES",e):e.referenceValue?new I("REFERENCE",e):e.geoPointValue?new I("GEO_POINT",e):Hr(e)?new I("ARRAY",e):go(e)?new I("VECTOR",e):Br(e)?new I("MAP",e):new I("ERROR",void 0)}yr(){return this.type==="ERROR"||this.type==="UNSET"}wr(){return this.type==="NULL"}}function Os(r){if(!r.yr())return r.value}function nd(r){return r instanceof Mn?r._expr:r}function Z(r){if((r=nd(r))instanceof Wr)return new Jw(r);if(r instanceof $r)return new jw(r);if(r instanceof Ds)return new qw(r);if(r instanceof F){if(r.name==="add")return new Qw(r);if(r.name==="subtract")return new Ww(r);if(r.name==="multiply")return new $w(r);if(r.name==="divide")return new Yw(r);if(r.name==="mod")return new Xw(r);if(r.name==="and")return new Zw(r);if(r.name==="equal")return new lI(r);if(r.name==="not_equal")return new hI(r);if(r.name==="less_than")return new CI(r);if(r.name==="less_than_or_equal")return new fI(r);if(r.name==="greater_than")return new dI(r);if(r.name==="greater_than_or_equal")return new pI(r);if(r.name==="array_concat")return new gI(r);if(r.name==="array_reverse")return new mI(r);if(r.name==="array_contains")return new EI(r);if(r.name==="array_contains_all")return new _I(r);if(r.name==="array_contains_any")return new DI(r);if(r.name==="array_length")return new wI(r);if(r.name==="array_element")return new II(r);if(r.name==="equal_any")return new rd(r);if(r.name==="not_equal_any")return new tI(r);if(r.name==="is_nan")return new nI(r);if(r.name==="is_not_nan")return new rI(r);if(r.name==="is_null")return new sI(r);if(r.name==="is_not_null")return new iI(r);if(r.name==="is_error")return new oI(r);if(r.name==="exists")return new aI(r);if(r.name==="not")return new ta(r);if(r.name==="or")return new eI(r);if(r.name==="xor")return new su(r);if(r.name==="conditional")return new BI(r);if(r.name==="maximum")return new uI(r);if(r.name==="minimum")return new cI(r);if(r.name==="reverse")return new yI(r);if(r.name==="replace_first")return new TI(r);if(r.name==="replace_all")return new AI(r);if(r.name==="char_length")return new RI(r);if(r.name==="byte_length")return new vI(r);if(r.name==="like")return new PI(r);if(r.name==="regex_contains")return new bI(r);if(r.name==="regex_match")return new SI(r);if(r.name==="string_contains")return new OI(r);if(r.name==="starts_with")return new NI(r);if(r.name==="ends_with")return new FI(r);if(r.name==="to_lower")return new LI(r);if(r.name==="to_upper")return new kI(r);if(r.name==="trim")return new VI(r);if(r.name==="string_concat")return new xI(r);if(r.name==="map_get")return new MI(r);if(r.name==="cosine_distance")return new GI(r);if(r.name==="dot_product")return new UI(r);if(r.name==="euclidean_distance")return new HI(r);if(r.name==="vector_length")return new JI(r);if(r.name==="unix_micros_to_timestamp")return new QI(r);if(r.name==="timestamp_to_unix_micros")return new YI(r);if(r.name==="unix_millis_to_timestamp")return new WI(r);if(r.name==="timestamp_to_unix_millis")return new XI(r);if(r.name==="unix_seconds_to_timestamp")return new $I(r);if(r.name==="timestamp_to_unix_seconds")return new ZI(r);if(r.name==="timestamp_add")return new ey(r);if(r.name==="timestamp_subtract")return new ty(r)}throw new Error(`Unknown Expr : ${r}`)}class Jw{constructor(e){this.expr=e}evaluate(e,t){if(this.expr.fieldName===Ft)return I.newValue({referenceValue:Io(e.serializer,t.key)});if(this.expr.fieldName==="__update_time__")return I.newValue({timestampValue:io(e.serializer,t.version)});if(this.expr.fieldName==="__create_time__")return I.newValue({timestampValue:io(e.serializer,t.createTime)});const n=t.data.field(this.expr._fieldPath);return n?xo(n)?I.newValue(function(i,o){if(i.serverTimestampBehavior==="estimate")return{timestampValue:io(i.serializer,ne.fromTimestamp(Mr(o)))};if(i.serverTimestampBehavior==="previous"){const B=ci(o);if(B)return B}return{nullValue:"NULL_VALUE"}}(e,n)):I.newValue(n):I.pr()}}class jw{constructor(e){this.expr=e}evaluate(e,t){return I.newValue(this.expr._getValue())}}class qw{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.cr.map(s=>Z(s).evaluate(e,t));return n.some(s=>s.yr())?I.mr():I.newValue({arrayValue:{values:n.map(s=>s.value)}})}}function qe(r){return sr(r)?Number(r.doubleValue):Number(r.integerValue)}function jt(r){return BigInt(r.integerValue)}const Kw=BigInt("0x7fffffffffffffff"),zw=-BigInt("0x8000000000000000");class pi{constructor(e){this.expr=e}evaluate(e,t){Q(this.expr.params.length>=2,24778);const n=Z(this.expr.params[0]).evaluate(e,t),s=Z(this.expr.params[1]).evaluate(e,t);let i=this.br(n,s);for(const o of this.expr.params.slice(2)){const B=Z(o).evaluate(e,t);i=this.br(i,B)}return i}br(e,t){if(e.yr()||t.yr())return I.mr();if(e.wr()||t.wr())return I.gr();const n=e.value,s=t.value;if(!sr(n)&&!Lt(n)||!sr(s)&&!Lt(s))return I.mr();if(sr(n)||sr(s)){const i=this.Sr(n,s);return i?I.newValue(i):I.mr()}if(Lt(n)&&Lt(s)){const i=this.vr(n,s);return i===void 0?I.mr():typeof i=="number"?I.newValue({doubleValue:i}):i<zw||i>Kw?I.mr():I.newValue({integerValue:`${i}`})}return I.mr()}}function an(r,e){return xe(r)!==xe(e)?"TYPE_MISMATCH":ft(r)||ft(e)?"NOT_EQ":Et(r)&&Et(e)?"EQ":Et(r)||Et(e)?"NULL":Hr(r)&&Hr(e)?function(n,s){var o,B,u;if(((o=n.values)==null?void 0:o.length)!==((B=s.values)==null?void 0:B.length))return"NOT_EQ";let i=!1;for(let c=0;c<(((u=n.values)==null?void 0:u.length)??0);c++){const h=n.values[c],f=s.values[c];switch(an(h,f)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":i=!0;break;default:X(44609,{Dr:h,Cr:f})}}return i?"NULL":"EQ"}(r.arrayValue,e.arrayValue):go(r)&&go(e)||Br(r)&&Br(e)?function(n,s){const i=n.fields||{},o=s.fields||{};if(po(i)!==po(o))return"NOT_EQ";let B=!1;for(const u in i)if(i.hasOwnProperty(u)){if(o[u]===void 0)return"NOT_EQ";switch(an(i[u],o[u])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":B=!0}}return B?"NULL":"EQ"}(r.mapValue,e.mapValue):function(n,s){return At(n,s,{u:!1,i:!0,o:!0})}(r,e)?"EQ":"NOT_EQ"}class Qw extends pi{vr(e,t){return jt(e)+jt(t)}Sr(e,t){return{doubleValue:qe(e)+qe(t)}}}class Ww extends pi{constructor(e){super(e),this.expr=e}vr(e,t){return jt(e)-jt(t)}Sr(e,t){return{doubleValue:qe(e)-qe(t)}}}class $w extends pi{constructor(e){super(e),this.expr=e}vr(e,t){return jt(e)*jt(t)}Sr(e,t){return{doubleValue:qe(e)*qe(t)}}}class Yw extends pi{constructor(e){super(e),this.expr=e}vr(e,t){const n=jt(t);if(n!==BigInt(0))return jt(e)/n}Sr(e,t){const n=qe(t);return n===0?{doubleValue:Gs(n)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:qe(e)/n}}}class Xw extends pi{constructor(e){super(e),this.expr=e}vr(e,t){const n=jt(t);if(n!==BigInt(0))return jt(e)%n}Sr(e,t){const n=qe(t);if(n!==0)return{doubleValue:qe(e)%n}}}class Zw{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const B=Z(o).evaluate(e,t);switch(B.type){case"BOOLEAN":if(!((i=B.value)!=null&&i.booleanValue))return I.newValue(Je);break;case"NULL":s=!0;break;default:n=!0}}return n?I.mr():s?I.gr():I.newValue(ht)}}class ta{constructor(e){this.expr=e}evaluate(e,t){var s;Q(this.expr.params.length===1,9634);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return I.newValue({booleanValue:!((s=n.value)!=null&&s.booleanValue)});case"NULL":return I.gr();default:return I.mr()}}}class eI{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const B=Z(o).evaluate(e,t);switch(B.type){case"BOOLEAN":if((i=B.value)!=null&&i.booleanValue)return I.newValue(ht);break;case"NULL":s=!0;break;default:n=!0}}return n?I.mr():s?I.gr():I.newValue(Je)}}class su{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const o of this.expr.params){const B=Z(o).evaluate(e,t);switch(B.type){case"BOOLEAN":n=su.xor(n,!!((i=B.value)!=null&&i.booleanValue));break;case"NULL":s=!0;break;default:return I.mr()}}return s?I.gr():I.newValue({booleanValue:n})}static xor(e,t){return(e||t)&&!(e&&t)}}class rd{constructor(e){this.expr=e}evaluate(e,t){var o,B;Q(this.expr.params.length===2,55094);let n=!1;const s=Z(this.expr.params[0]).evaluate(e,t);switch(s.type){case"NULL":n=!0;break;case"ERROR":case"UNSET":return I.mr()}const i=Z(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return I.mr()}if(n)return I.gr();for(const u of((B=(o=i.value)==null?void 0:o.arrayValue)==null?void 0:B.values)??[])switch(Et(s.value)&&Et(u)?"EQ":an(s.value,u)){case"EQ":return I.newValue(ht);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:X(44608,{value:s.value,candidate:u})}return n?I.gr():I.newValue(Je)}}class tI{constructor(e){this.expr=e}evaluate(e,t){return new ta(new F("not",[new F("equal_any",this.expr.params)])).evaluate(e,t)}}class nI{constructor(e){this.expr=e}evaluate(e,t){Q(this.expr.params.length===1,23322);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return I.newValue(Je);case"DOUBLE":return I.newValue({booleanValue:isNaN(qe(n.value))});case"NULL":return I.gr();default:return I.mr()}}}class rI{constructor(e){this.expr=e}evaluate(e,t){return Q(this.expr.params.length===1,50406),new ta(new F("not",[new F("is_nan",this.expr.params)])).evaluate(e,t)}}class sI{constructor(e){this.expr=e}evaluate(e,t){switch(Q(this.expr.params.length===1,23123),Z(this.expr.params[0]).evaluate(e,t).type){case"NULL":return I.newValue(ht);case"UNSET":case"ERROR":return I.mr();default:return I.newValue(Je)}}}class iI{constructor(e){this.expr=e}evaluate(e,t){return Q(this.expr.params.length===1,23167),new ta(new F("not",[new F("is_null",this.expr.params)])).evaluate(e,t)}}class oI{constructor(e){this.expr=e}evaluate(e,t){return Q(this.expr.params.length===1,5228),Z(this.expr.params[0]).evaluate(e,t).type==="ERROR"?I.newValue(ht):I.newValue(Je)}}class aI{constructor(e){this.expr=e}evaluate(e,t){switch(Q(this.expr.params.length===1,6877),Z(this.expr.params[0]).evaluate(e,t).type){case"ERROR":return I.mr();case"UNSET":return I.newValue(Je);default:return I.newValue(ht)}}}class BI{constructor(e){this.expr=e}evaluate(e,t){var s;Q(this.expr.params.length===3,11706);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return(s=n.value)!=null&&s.booleanValue?Z(this.expr.params[1]).evaluate(e,t):Z(this.expr.params[2]).evaluate(e,t);case"NULL":return Z(this.expr.params[2]).evaluate(e,t);default:return I.mr()}}}class uI{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(i=>Z(i).evaluate(e,t));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Ct(i.value,s.value)>0?i:s}return s===void 0?I.gr():s}}class cI{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(i=>Z(i).evaluate(e,t));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||Ct(i.value,s.value)<0?i:s}return s===void 0?I.gr():s}}class Yr{constructor(e){this.expr=e}evaluate(e,t){Q(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"ERROR":case"UNSET":return I.mr()}const s=Z(this.expr.params[1]).evaluate(e,t);switch(s.type){case"ERROR":case"UNSET":return I.mr()}return this.Fr(n,s)}}class lI extends Yr{constructor(e){super(e),this.expr=e}Fr(e,t){if(e.wr()&&t.wr())return I.newValue(ht);if(e.wr()||t.wr()||ft(e.value)||ft(t.value)||xe(e.value)!==xe(t.value))return I.newValue(Je);switch(an(e.value,t.value)){case"EQ":return I.newValue(ht);case"NOT_EQ":return I.newValue(Je);case"NULL":return I.gr();default:X(44615,{left:e,right:t})}}}class hI extends Yr{constructor(e){super(e),this.expr=e}Fr(e,t){switch(an(e.value,t.value)){case"EQ":return I.newValue(Je);case"NOT_EQ":case"TYPE_MISMATCH":return I.newValue(ht);case"NULL":return I.gr();default:X(44614,{left:e,right:t})}}}class CI extends Yr{constructor(e){super(e),this.expr=e}Fr(e,t){return xe(e.value)!==xe(t.value)||ft(e.value)||ft(t.value)?I.newValue(Je):I.newValue({booleanValue:Ct(e.value,t.value)<0})}}class fI extends Yr{constructor(e){super(e),this.expr=e}Fr(e,t){return xe(e.value)!==xe(t.value)||ft(e.value)||ft(t.value)?I.newValue(Je):an(e.value,t.value)==="EQ"?I.newValue(ht):I.newValue({booleanValue:Ct(e.value,t.value)<0})}}class dI extends Yr{constructor(e){super(e),this.expr=e}Fr(e,t){return xe(e.value)!==xe(t.value)||ft(e.value)||ft(t.value)?I.newValue(Je):I.newValue({booleanValue:Ct(e.value,t.value)>0})}}class pI extends Yr{constructor(e){super(e),this.expr=e}Fr(e,t){return xe(e.value)!==xe(t.value)||ft(e.value)||ft(t.value)?I.newValue(Je):an(e.value,t.value)==="EQ"?I.newValue(ht):I.newValue({booleanValue:Ct(e.value,t.value)>0})}}class gI{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class mI{constructor(e){this.expr=e}evaluate(e,t){var s;Q(this.expr.params.length===1,216);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return I.gr();case"ARRAY":{const i=((s=n.value.arrayValue)==null?void 0:s.values)??[];return I.newValue({arrayValue:{values:[...i].reverse()}})}default:return I.mr()}}}class EI{constructor(e){this.expr=e}evaluate(e,t){return Q(this.expr.params.length===2,52884),new rd(new F("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(e,t)}}class _I{constructor(e){this.expr=e}evaluate(e,t){var u,c,h,f;Q(this.expr.params.length===2,1392);let n=!1;const s=Z(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return I.mr()}const i=Z(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return I.mr()}if(n)return I.gr();const o=((c=(u=i.value)==null?void 0:u.arrayValue)==null?void 0:c.values)??[],B=((f=(h=s.value)==null?void 0:h.arrayValue)==null?void 0:f.values)??[];for(const p of o){let w=!1;n=!1;for(const R of B){switch(Et(p)&&Et(R)?"EQ":an(p,R)){case"EQ":w=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:X(44613,{value:R,search:p})}if(w)break}if(!w)return I.newValue(Je)}return I.newValue(ht)}}class DI{constructor(e){this.expr=e}evaluate(e,t){var u,c,h,f;Q(this.expr.params.length===2,2680);let n=!1;const s=Z(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return I.mr()}const i=Z(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return I.mr()}if(n)return I.gr();const o=((c=(u=i.value)==null?void 0:u.arrayValue)==null?void 0:c.values)??[],B=((f=(h=s.value)==null?void 0:h.arrayValue)==null?void 0:f.values)??[];for(const p of B)for(const w of o)switch(Et(p)&&Et(w)?"EQ":an(p,w)){case"EQ":return I.newValue(ht);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:X(60403,{value:p,search:w})}return n?I.gr():I.newValue(Je)}}class wI{constructor(e){this.expr=e}evaluate(e,t){var s,i,o;Q(this.expr.params.length===1,38605);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return I.gr();case"ARRAY":return I.newValue({integerValue:`${((o=(i=(s=n.value)==null?void 0:s.arrayValue)==null?void 0:i.values)==null?void 0:o.length)??0}`});default:return I.mr()}}}class II{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class yI{constructor(e){this.expr=e}evaluate(e,t){var s,i;Q(this.expr.params.length===1,1508);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return I.gr();case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;if(typeof o=="string"){const B=Ve.fromBase64String(o).toUint8Array();return B.reverse(),I.newValue({bytesValue:Ve.fromUint8Array(B).toBase64()})}return I.newValue({bytesValue:new Uint8Array(o).reverse()})}case"STRING":{const o=(i=n.value)==null?void 0:i.stringValue,B=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(o),u=Array.from(B,c=>c.segment).reverse();return I.newValue({stringValue:u.join("")})}default:return I.mr()}}}class TI{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class AI{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class RI{constructor(e){this.expr=e}evaluate(e,t){Q(this.expr.params.length===1,19400);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return I.gr();case"STRING":{const s=function(o){let B=0;for(let u=0;u<o.length;u++){const c=o.codePointAt(u);if(c===void 0)return;if(c<=65535)if(c>=55296&&c<=57343)if(c<=56319){const h=o.codePointAt(u+1);h!==void 0&&h>=56320&&h<=57343?(B+=1,u++):B+=1}else B+=1;else B+=1;else{if(!(c<=1114111))return;B+=1,u++}}return B}(n.value.stringValue);return s===void 0?I.mr():I.newValue({integerValue:s})}default:return I.mr()}}}class vI{constructor(e){this.expr=e}evaluate(e,t){var s,i;Q(this.expr.params.length===1,8486);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BYTES":{const o=(s=n.value)==null?void 0:s.bytesValue;return typeof o=="string"?I.newValue({integerValue:Ve.fromBase64String(o).toUint8Array().length}):I.newValue({integerValue:new Uint8Array(o).length})}case"STRING":{const o=function(u){let c=0;for(let h=0;h<u.length;h++){const f=u.codePointAt(h);if(f===void 0)return;if(f>=55296&&f<=57343){if(!(f<=56319))return;{const p=u.codePointAt(h+1);if(p===void 0||!(p>=56320&&p<=57343))return;c+=4,h++}}else if(f<=127)c+=1;else if(f<=2047)c+=2;else if(f<=65535)c+=3;else{if(!(f<=1114111))return;c+=4,h++}}return c}((i=n.value)==null?void 0:i.stringValue);return o===void 0?I.mr():I.newValue({integerValue:o})}case"NULL":return I.gr();default:return I.mr()}}}class Xr{constructor(e){this.expr=e}evaluate(e,t){var o,B;Q(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let n=!1;const s=Z(this.expr.params[0]).evaluate(e,t);switch(s.type){case"STRING":break;case"NULL":n=!0;break;default:return I.mr()}const i=Z(this.expr.params[1]).evaluate(e,t);switch(i.type){case"STRING":break;case"NULL":n=!0;break;default:return I.mr()}return n?I.gr():this.Or((o=s.value)==null?void 0:o.stringValue,(B=i.value)==null?void 0:B.stringValue)}}class PI extends Xr{Or(e,t){try{const n=function(o){let B="";for(let u=0;u<o.length;u++){const c=o.charAt(u);switch(c){case"_":B+=".";break;case"%":B+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":B+="\\"+c;break;default:B+=c}}return"^"+B+"$"}(t),s=xB.compile(n);return I.newValue({booleanValue:s.matches(e)})}catch(n){return Pt(`Invalid LIKE pattern converted to regex: ${t}, returning error. Error: ${n}`),I.mr()}}}class bI extends Xr{Or(e,t){try{const n=xB.compile(t);return I.newValue({booleanValue:n.test(e)})}catch{return Pt(`Invalid regex pattern found in regex_contains: ${t}, returning error`),I.mr()}}}class SI extends Xr{Or(e,t){try{return I.newValue({booleanValue:xB.compile(t).matches(e)})}catch{return Pt(`Invalid regex pattern found in regex_match: ${t}, returning error`),I.mr()}}}class OI extends Xr{Or(e,t){return I.newValue({booleanValue:e.includes(t)})}}class NI extends Xr{Or(e,t){return I.newValue({booleanValue:e.startsWith(t)})}}class FI extends Xr{Or(e,t){return I.newValue({booleanValue:e.endsWith(t)})}}class LI{constructor(e){this.expr=e}evaluate(e,t){var s,i;Q(this.expr.params.length===1,29079);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return I.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toLowerCase()});case"NULL":return I.gr();default:return I.mr()}}}class kI{constructor(e){this.expr=e}evaluate(e,t){var s,i;Q(this.expr.params.length===1,60487);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return I.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toUpperCase()});case"NULL":return I.gr();default:return I.mr()}}}class VI{constructor(e){this.expr=e}evaluate(e,t){var s,i;Q(this.expr.params.length===1,28544);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return I.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.trim()});case"NULL":return I.gr();default:return I.mr()}}}class xI{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map(o=>Z(o).evaluate(e,t));let s="",i=!1;for(const o of n)switch(o.type){case"STRING":s+=o.value.stringValue;break;case"NULL":i=!0;break;default:return I.mr()}return i?I.gr():I.newValue({stringValue:s})}}class MI{constructor(e){this.expr=e}evaluate(e,t){var o,B,u,c;Q(this.expr.params.length===2,4483);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"UNSET":return I.pr();case"MAP":break;default:return I.mr()}const s=Z(this.expr.params[1]).evaluate(e,t);if(s.type!=="STRING")return I.mr();const i=(c=(B=(o=n.value)==null?void 0:o.mapValue)==null?void 0:B.fields)==null?void 0:c[(u=s.value)==null?void 0:u.stringValue];return i===void 0?I.pr():I.newValue(i)}}class iu{constructor(e){this.expr=e}evaluate(e,t){var c,h;Q(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let n=!1;const s=Z(this.expr.params[0]).evaluate(e,t);switch(s.type){case"VECTOR":break;case"NULL":n=!0;break;default:return I.mr()}const i=Z(this.expr.params[1]).evaluate(e,t);switch(i.type){case"VECTOR":break;case"NULL":n=!0;break;default:return I.mr()}if(n)return I.gr();const o=lB(s.value),B=lB(i.value);if(o===void 0||B===void 0||((c=o.values)==null?void 0:c.length)!==((h=B.values)==null?void 0:h.length))return I.mr();const u=this.Mr(o,B);return u===void 0||isNaN(u)?I.mr():I.newValue({doubleValue:u})}}class GI extends iu{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return;let i=0,o=0,B=0;for(let c=0;c<n.length;c++){if(!Ln(n[c])||!Ln(s[c]))return;const h=qe(n[c]),f=qe(s[c]);i+=h*f,o+=h*h,B+=f*f}const u=Math.sqrt(o)*Math.sqrt(B);if(u!==0)return 1-Math.max(-1,Math.min(1,i/u))}}class UI extends iu{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!Ln(n[o])||!Ln(s[o]))return;i+=qe(n[o])*qe(s[o])}return i}}class HI extends iu{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let o=0;o<n.length;o++){if(!Ln(n[o])||!Ln(s[o]))return;const B=qe(n[o]),u=qe(s[o]);i+=Math.pow(B-u,2)}return Math.sqrt(i)}}class JI{constructor(e){this.expr=e}evaluate(e,t){var s;Q(this.expr.params.length===1,39044);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"VECTOR":{const i=lB(n.value);return I.newValue({integerValue:((s=i==null?void 0:i.values)==null?void 0:s.length)??0})}case"NULL":return I.gr();default:return I.mr()}}}const Ys=BigInt(-62135596800),Xs=BigInt(253402300799),To=BigInt(1e3),bn=BigInt(1e6),jI=Ys*To,qI=Xs*To+BigInt(999),KI=Ys*bn,zI=Xs*bn+BigInt(999999);function ou(r){return r>=KI&&r<=zI}function sd(r){return r>=Ys&&r<=Xs}function Zs(r,e){const t=BigInt(r);return!(t<Ys||t>Xs)&&!(e<0||e>=1e9)&&(t!==Ys||e===0)&&!(t===Xs&&e>999999999)}function id(r,e){return e<0?{seconds:r-1,nanos:e+1e9}:{seconds:r,nanos:e}}function au(r){return BigInt(r.seconds)*bn+BigInt(Math.trunc(r.nanoseconds/1e3))}class Bu{constructor(e){this.expr=e}evaluate(e,t){Q(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return this.toTimestamp(BigInt(n.value.integerValue));case"NULL":return I.gr();default:return I.mr()}}}class QI extends Bu{toTimestamp(e){if(!ou(e))return I.mr();let t=Number(e/bn),n=Number(e%bn*BigInt(1e3));const s=id(t,n);return t=s.seconds,n=s.nanos,Zs(t,n)?I.newValue({timestampValue:{seconds:t,nanos:n}}):I.mr()}}class WI extends Bu{toTimestamp(e){if(!function(o){return o>=jI&&o<=qI}(e))return I.mr();let t=Number(e/To),n=Number(e%To*BigInt(1e6));const s=id(t,n);return t=s.seconds,n=s.nanos,Zs(t,n)?I.newValue({timestampValue:{seconds:t,nanos:n}}):I.mr()}}class $I extends Bu{toTimestamp(e){if(!sd(e))return I.mr();const t=Number(e);return I.newValue({timestampValue:{seconds:t,nanos:0}})}}class uu{constructor(e){this.expr=e}evaluate(e,t){Q(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);const n=Z(this.expr.params[0]).evaluate(e,t);switch(n.type){case"TIMESTAMP":break;case"NULL":return I.gr();default:return I.mr()}const s=zB(n.value.timestampValue);return Zs(s.seconds,s.nanoseconds)?this.Nr(s):I.mr()}}class YI extends uu{Nr(e){const t=au(e);return ou(t)?I.newValue({integerValue:`${t.toString()}`}):I.mr()}}class XI extends uu{Nr(e){const t=au(e),n=t/BigInt(1e3),s=t%BigInt(1e3);return n>BigInt(0)||s===BigInt(0)?I.newValue({integerValue:n.toString()}):I.newValue({integerValue:(n-BigInt(1)).toString()})}}class ZI extends uu{Nr(e){const t=BigInt(e.seconds);return sd(t)?I.newValue({integerValue:t.toString()}):I.mr()}}class od{constructor(e){this.expr=e}evaluate(e,t){Q(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let n=!1;const s=Z(this.expr.params[0]).evaluate(e,t);switch(s.type){case"TIMESTAMP":break;case"NULL":n=!0;break;default:return I.mr()}const i=Z(this.expr.params[1]).evaluate(e,t);let o;switch(i.type){case"STRING":if(o=function(ee){switch(ee){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}}(i.value.stringValue),o===void 0)return I.mr();break;case"NULL":n=!0;break;default:return I.mr()}const B=Z(this.expr.params[2]).evaluate(e,t);switch(B.type){case"INT":break;case"NULL":n=!0;break;default:return I.mr()}if(n)return I.gr();const u=BigInt(B.value.integerValue);let c;try{switch(o){case"microsecond":c=u;break;case"millisecond":c=u*BigInt(1e3);break;case"second":c=u*BigInt(1e6);break;case"minute":c=u*BigInt(6e7);break;case"hour":c=u*BigInt(36e8);break;case"day":c=u*BigInt(864e8);break;default:return I.mr()}if(o!=="microsecond"&&u!==BigInt(0)&&c/u!==BigInt(this.Lr(o)))return I.mr()}catch(K){return Pt(`Error during timestamp arithmetic: ${K}`),I.mr()}const h=zB(s.value.timestampValue);if(!Zs(h.seconds,h.nanoseconds))return I.mr();const f=au(h),p=this.Br(f,c);if(!ou(p))return I.mr();const w=Number(p/bn),R=p%bn,k=Number((R<0?R+bn:R)*BigInt(1e3)),M=R<0?w-1:w;return Zs(M,k)?I.newValue({timestampValue:{seconds:M,nanos:k}}):I.mr()}Lr(e){switch(e){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}}class ey extends od{Br(e,t){return e+t}}class ty extends od{Br(e,t){return e-t}}function ei(r){if((r=nd(r))instanceof Wr)return`fld(${r.fieldName})`;if(r instanceof $r)return`cst(${function(t){return t===null?"null":typeof t=="number"?t.toString():typeof t=="string"?`"${t}"`:t instanceof ve?`ref(${t.path})`:t instanceof lt?`vec(${JSON.stringify(t)})`:JSON.stringify(t)}(r.value)})`;if(r instanceof F)return`fn(${r.name},[${r.params.map(ei).join(",")}])`;if(r.expressionType==="ListOfExpressions")return`list([${r.cr.map(ei).join(",")}])`;throw new Error(`Unrecognized expr ${JSON.stringify(r,null,2)}`)}function ny(r){if(r instanceof Zf)return`${r._name}(${zi(r.fields)})`;if(r instanceof ed){let e=`${r._name}(${zi(r.accumulators)})`;return r.groups.size>0&&(e+=`grouping(${zi(r.groups)})`),e}if(r instanceof td)return`${r._name}(${zi(r.groups)})`;if(r instanceof Yo)return`${r._name}(${r.hr})`;if(r instanceof Xo)return`${r._name}(${r.collectionId})`;if(r instanceof eu)return`${r._name}()`;if(r instanceof tu)return`${r._name}(${r.Tr.sort()})`;if(r instanceof Zo)return`${r._name}(${ei(r.condition)})`;if(r instanceof gr)return`${r._name}(${r.limit})`;if(r instanceof Zt)return`${r._name}(${function(t){return t.map(n=>`${ei(n.expr)}${n.direction}`).join(",")}(r.orderings)})`;throw new Error(`Unrecognized stage ${r._name}`)}function zi(r){return`${Array.from(r.entries()).sort().map(([e,t])=>`${e}=${ei(t)}`).join(",")}`}function nn(r){return r.stages.map(e=>ny(e)).join("|")}function ad(r,e){return nn(r)===nn(e)}function Ge(r){return r instanceof tt}function Eh(r){return Ge(r)?nn(r):vs(r)}function Bd(r){return Ge(r)?nn(r):function(t){return`${Cf(Gt(t))}|lt:${t.limitType}`}(r)}function na(r,e){return r instanceof tt&&e instanceof tt?ad(r,e):!(r instanceof tt&&!(e instanceof tt)||!(r instanceof tt)&&e instanceof tt)&&ID(r,e)}function ud(r){return tr(r)?nn(r):Cf(r)}function cd(r,e){return r instanceof tt&&e instanceof tt?ad(r,e):!(r instanceof tt&&!(e instanceof tt)||!(r instanceof tt)&&e instanceof tt)&&ff(r,e)}function ry(r,e){const t=function(s){let i=!1;const o=[];for(const B of s)if(B instanceof Zt)if(i=!0,B.orderings.some(u=>u.expr instanceof Wr&&u.expr.fieldName===Ft))o.push(B);else{const u=B.orderings.map(c=>c);u.push(oo(Ft).ascending()),o.push(new Zt(u,{}))}else B instanceof gr&&(i||(o.push(new Zt([oo(Ft).ascending()],{})),i=!0)),o.push(B);return i||o.push(new Zt([oo(Ft).ascending()],{})),o}(r.stages);if(r.userDataReader){const n=r.userDataReader.createContext(3,"toCorePipeline");t.forEach(s=>s._readUserData(n))}return new tt(r.userDataReader.serializer,t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sy{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&rD(i,e,n[s])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=As(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=As(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=_f();return this.mutations.forEach(s=>{const i=e.get(s.key),o=i.overlayedDocument;let B=this.applyToLocalView(o,i.mutatedFields);B=t.has(s.key)?null:B;const u=sf(o,B);u!==null&&n.set(s.key,u),o.isValidDocument()||o.convertToNoDocument(ne.min())}),n}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),ie())}isEqual(e){return this.batchId===e.batchId&&xr(this.mutations,e.mutations,(t,n)=>$l(t,n))&&xr(this.baseMutations,e.baseMutations,(t,n)=>$l(t,n))}}class cu{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){Q(e.mutations.length===n.length,58842,{Ur:e.mutations.length,kr:n.length});let s=function(){return vD}();const i=e.mutations;for(let o=0;o<i.length;o++)s=s.insert(i[o].key,n[o].version);return new cu(e,t,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ld="";function iy(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=_h(e)),e=oy(r.get(t),e);return _h(e)}function oy(r,e){let t=e;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":t+="";break;case ld:t+="";break;default:t+=i}}return t}function _h(r){return r+ld+""}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ay{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en{constructor(e,t,n,s,i=ne.min(),o=ne.min(),B=Ve.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=B,this.expectedCount=u}withSequenceNumber(e){return new en(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new en(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new en(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new en(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class By{constructor(e){this.$r=e}}function uy(r){const e=qD({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?wo(e,e.limit,"L"):e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cy{constructor(){this.Zi=new ly}addToCollectionParentIndex(e,t){return this.Zi.add(t),V.resolve()}getCollectionParents(e,t){return V.resolve(this.Zi.getEntries(t))}addFieldIndex(e,t){return V.resolve()}deleteFieldIndex(e,t){return V.resolve()}deleteAllFieldIndexes(e){return V.resolve()}createTargetIndexes(e,t){return V.resolve()}getDocumentsMatchingTarget(e,t){return V.resolve(null)}getIndexType(e,t){return V.resolve(0)}getFieldIndexes(e,t){return V.resolve([])}getNextCollectionGroupToUpdate(e){return V.resolve(null)}getMinOffset(e,t){return V.resolve(kn.min())}getMinOffsetFromCollectionGroup(e,t){return V.resolve(kn.min())}updateCollectionGroup(e,t,n){return V.resolve()}updateIndexEntries(e,t){return V.resolve()}}class ly{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new ke(fe.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new ke(fe.comparator)).toArray()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Un{constructor(e){this.ys=e}next(){return this.ys+=2,this.ys}static ws(){return new Un(0)}static bs(){return new Un(-1)}}// Copyright 2024 Google LLC* @license
function hd(r,e){var n;let t=e;for(const s of r.stages)t=Cy({serializer:r.serializer,serverTimestampBehavior:(n=r.listenOptions)==null?void 0:n.serverTimestampBehavior},s,t);return t}function ra(r,e){return hd(r,[e]).length>0}function hy(r,e){return Ge(r)?ra(r,e):qo(r,e)}function Cy(r,e,t){if(e instanceof Yo)return function(s,i,o){return o.filter(B=>B.isFoundDocument()&&`/${B.key.getCollectionPath().canonicalString()}`===i.hr)}(0,e,t);if(e instanceof Zo)return function(s,i,o){return o.filter(B=>{const u=Os(Z(i.condition).evaluate(s,B));return u!==void 0&&At(u,ht)})}(r,e,t);if(e instanceof Xo)return function(s,i,o){return o.filter(B=>B.isFoundDocument()&&B.key.getCollectionPath().lastSegment()===i.collectionId)}(0,e,t);if(e instanceof eu)return function(s,i,o){return o.filter(B=>B.isFoundDocument())}(0,0,t);if(e instanceof tu)return function(s,i,o){return o.filter(B=>B.isFoundDocument()&&i.Pr.has(B.key.path.toStringWithLeadingSlash()))}(0,e,t);if(e instanceof gr)return function(s,i,o){return o.slice(0,i.limit)}(0,e,t);if(e instanceof Zt)return function(s,i,o){const B=i.orderings.map(u=>({Ms:Z(u.expr),direction:u.direction}));return[...o].sort((u,c)=>{for(const{Ms:h,direction:f}of B){const p=Os(h.evaluate(s,u)),w=Os(h.evaluate(s,c)),R=Ct(p??Gr,w??Gr);if(R!==0)return f==="ascending"?R:-R}return 0})}(r,e,t);throw new Error(`Unknown stage: ${e._name}`)}function EB(r){const e=function(n){for(let s=n.stages.length-1;s>=0;s--){const i=n.stages[s];if(i instanceof Zt)return i.orderings}throw new Error("Pipeline must contain at least one Sort stage")}(r);return(t,n)=>{for(const s of e){const i=Os(Z(s.expr).evaluate({serializer:r.serializer},t)),o=Os(Z(s.expr).evaluate({serializer:r.serializer},n)),B=Ct(i||Gr,o||Gr);if(B!==0)return s.direction==="ascending"?B:-B}return 0}}function qa(r){for(let e=r.stages.length-1;e>=0;e--){const t=r.stages[e];if(t instanceof gr)return{limit:t.limit}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fy{constructor(){this.changes=new _r(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,We.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?V.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dy{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class py{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next(s=>(n=s,this.remoteDocumentCache.getEntry(e,t))).next(s=>(n!==null&&As(n.mutation,s,mt.empty(),de.now()),s))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.getLocalViewOfDocuments(e,n,ie()).next(()=>n))}getLocalViewOfDocuments(e,t,n=ie()){const s=In();return this.populateOverlays(e,s,t).next(()=>this.computeViews(e,t,s,n).next(i=>{let o=Sr();return i.forEach((B,u)=>{o=o.insert(B,u.overlayedDocument)}),o}))}getOverlayedDocuments(e,t){const n=In();return this.populateOverlays(e,n,t).next(()=>this.computeViews(e,t,n,ie()))}populateOverlays(e,t,n){const s=[];return n.forEach(i=>{t.has(i)||s.push(i)}),this.documentOverlayCache.getOverlays(e,s).next(i=>{i.forEach((o,B)=>{t.set(o,B)})})}computeViews(e,t,n,s){let i=ct();const o=Ps(),B=function(){return Ps()}();return t.forEach((u,c)=>{const h=n.get(c.key);s.has(c.key)&&(h===void 0||h.mutation instanceof Kn)?i=i.insert(c.key,c):h!==void 0?(o.set(c.key,h.mutation.getFieldMask()),As(h.mutation,c,h.mutation.getFieldMask(),de.now())):o.set(c.key,mt.empty())}),this.recalculateAndSaveOverlays(e,i).next(u=>(u.forEach((c,h)=>o.set(c,h)),t.forEach((c,h)=>B.set(c,new dy(h,o.get(c)??null))),B))}recalculateAndSaveOverlays(e,t){const n=Ps();let s=new Te((o,B)=>o-B),i=ie();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(o=>{for(const B of o)B.keys().forEach(u=>{const c=t.get(u);if(c===null)return;let h=n.get(u)||mt.empty();h=B.applyToLocalView(c,h),n.set(u,h);const f=(s.get(B.batchId)||ie()).add(u);s=s.insert(B.batchId,f)})}).next(()=>{const o=[],B=s.getReverseIterator();for(;B.hasNext();){const u=B.getNext(),c=u.key,h=u.value,f=_f();h.forEach(p=>{if(!i.has(p)){const w=sf(t.get(p),n.get(p));w!==null&&f.set(p,w),i=i.add(p)}}),o.push(this.documentOverlayCache.saveOverlays(e,c,f))}return V.waitFor(o)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.recalculateAndSaveOverlays(e,n))}getDocumentsMatchingQuery(e,t,n,s){return Ge(t)?this.getDocumentsMatchingPipeline(e,t,n,s):_D(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):pf(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next(i=>{const o=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):V.resolve(In());let B=Qs,u=i;return o.next(c=>V.forEach(c,(h,f)=>(B<f.largestBatchId&&(B=f.largestBatchId),i.get(h)?V.resolve():this.remoteDocumentCache.getEntry(e,h).next(p=>{u=u.insert(h,p)}))).next(()=>this.populateOverlays(e,c,i)).next(()=>this.computeViews(e,u,c,ie())).next(h=>({batchId:B,changes:Ef(h)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new $(t)).next(n=>{let s=Sr();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s})}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){const i=t.collectionGroup;let o=Sr();return this.indexManager.getCollectionParents(e,i).next(B=>V.forEach(B,u=>{const c=function(f,p){return new Kr(p,null,f.explicitOrderBy.slice(),f.filters.slice(),f.limit,f.limitType,f.startAt,f.endAt)}(t,u.child(i));return this.getDocumentsMatchingCollectionQuery(e,c,n,s).next(h=>{h.forEach((f,p)=>{o=o.insert(f,p)})})}).next(()=>o))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next(o=>(i=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s))).next(o=>this.retrieveMatchingLocalDocuments(i,o,B=>qo(t,B)))}getDocumentsMatchingPipeline(e,t,n,s){if(Pn(t)==="collection_group"){const i=ru(t);let o=Sr();return this.indexManager.getCollectionParents(e,i).next(B=>V.forEach(B,u=>{const c=function(f,p){const w=f.stages.map(R=>R instanceof Xo?new Yo(p.canonicalString(),{}):R);return new tt(f.serializer,w)}(t,u.child(i));return this.getDocumentsMatchingPipeline(e,c,n,s).next(h=>{h.forEach((f,p)=>{o=o.insert(f,p)})})}).next(()=>o))}{let i;return this.getOverlaysForPipeline(e,t,n.largestBatchId).next(o=>{switch(i=o,Pn(t)){case"collection":return this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s);case"documents":let B=ie();for(const u of mB(t))B=B.add($.fromPath(u));return this.remoteDocumentCache.getEntries(e,B);case"database":return this.remoteDocumentCache.getAllEntries(e);default:throw new H("invalid-argument",`Invalid pipeline source to execute offline: ${nn(t)}`)}}).next(o=>this.retrieveMatchingLocalDocuments(i,o,B=>ra(t,B)))}}retrieveMatchingLocalDocuments(e,t,n){e.forEach((i,o)=>{const B=o.getKey();t.get(B)===null&&(t=t.insert(B,We.newInvalidDocument(B)))});let s=Sr();return t.forEach((i,o)=>{const B=e.get(i);B!==void 0&&As(B.mutation,o,mt.empty(),de.now()),n(o)&&(s=s.insert(i,o))}),s}getOverlaysForPipeline(e,t,n){switch(Pn(t)){case"collection":return this.documentOverlayCache.getOverlaysForCollection(e,fe.fromString(ea(t)),n);case"collection_group":throw new H("invalid-argument",`Unexpected collection group pipeline: ${nn(t)}`);case"documents":return this.documentOverlayCache.getOverlays(e,mB(t).map(s=>$.fromPath(s)));case"database":return this.documentOverlayCache.getAllOverlays(e,n);default:throw new H("invalid-argument",`Failed to get overlays for pipeline: ${nn(t)}`)}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gy{constructor(e){this.serializer=e,this.Qs=new Map,this.Ws=new Map}getBundleMetadata(e,t){return V.resolve(this.Qs.get(t))}saveBundleMetadata(e,t){return this.Qs.set(t.id,function(s){return{id:s.id,version:s.version,createTime:Ut(s.createTime)}}(t)),V.resolve()}getNamedQuery(e,t){return V.resolve(this.Ws.get(t))}saveNamedQuery(e,t){return this.Ws.set(t.name,function(s){return{name:s.name,query:uy(s.bundledQuery),readTime:Ut(s.readTime)}}(t)),V.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class my{constructor(){this.overlays=new Te($.comparator),this.Gs=new Map}getOverlay(e,t){return V.resolve(this.overlays.get(t))}getOverlays(e,t){const n=In();return V.forEach(t,s=>this.getOverlay(e,s).next(i=>{i!==null&&n.set(s,i)})).next(()=>n)}getAllOverlays(e,t){const n=In();return this.overlays.forEach((s,i)=>{i.largestBatchId>t&&n.set(s,i)}),V.resolve(n)}saveOverlays(e,t,n){return n.forEach((s,i)=>{this.Zr(e,t,i)}),V.resolve()}removeOverlaysForBatchId(e,t,n){const s=this.Gs.get(n);return s!==void 0&&(s.forEach(i=>this.overlays=this.overlays.remove(i)),this.Gs.delete(n)),V.resolve()}getOverlaysForCollection(e,t,n){const s=In(),i=t.length+1,o=new $(t.child("")),B=this.overlays.getIteratorFrom(o);for(;B.hasNext();){const u=B.getNext().value,c=u.getKey();if(!t.isPrefixOf(c.path))break;c.path.length===i&&u.largestBatchId>n&&s.set(u.getKey(),u)}return V.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new Te((c,h)=>c-h);const o=this.overlays.getIterator();for(;o.hasNext();){const c=o.getNext().value;if(c.getKey().getCollectionGroup()===t&&c.largestBatchId>n){let h=i.get(c.largestBatchId);h===null&&(h=In(),i=i.insert(c.largestBatchId,h)),h.set(c.getKey(),c)}}const B=In(),u=i.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach((c,h)=>B.set(c,h)),!(B.size()>=s)););return V.resolve(B)}Zr(e,t,n){const s=this.overlays.get(n.key);if(s!==null){const o=this.Gs.get(s.largestBatchId).delete(n.key);this.Gs.set(s.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new ay(t,n));let i=this.Gs.get(t);i===void 0&&(i=ie(),this.Gs.set(t,i)),this.Gs.set(t,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ey{constructor(){this.sessionToken=Ve.EMPTY_BYTE_STRING}getSessionToken(e){return V.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,V.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lu{constructor(){this.zs=new ke(He.js),this.Hs=new ke(He.Js)}isEmpty(){return this.zs.isEmpty()}addReference(e,t){const n=new He(e,t);this.zs=this.zs.add(n),this.Hs=this.Hs.add(n)}Ys(e,t){e.forEach(n=>this.addReference(n,t))}removeReference(e,t){this.Zs(new He(e,t))}Xs(e,t){e.forEach(n=>this.removeReference(n,t))}e_(e){const t=new $(new fe([])),n=new He(t,e),s=new He(t,e+1),i=[];return this.Hs.forEachInRange([n,s],o=>{this.Zs(o),i.push(o.key)}),i}t_(){this.zs.forEach(e=>this.Zs(e))}Zs(e){this.zs=this.zs.delete(e),this.Hs=this.Hs.delete(e)}n_(e){const t=new $(new fe([])),n=new He(t,e),s=new He(t,e+1);let i=ie();return this.Hs.forEachInRange([n,s],o=>{i=i.add(o.key)}),i}containsKey(e){const t=new He(e,0),n=this.zs.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class He{constructor(e,t){this.key=e,this.r_=t}static js(e,t){return $.comparator(e.key,t.key)||oe(e.r_,t.r_)}static Js(e,t){return oe(e.r_,t.r_)||$.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _y{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.Gr=1,this.i_=new ke(He.js)}checkEmpty(e){return V.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){const i=this.Gr;this.Gr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new sy(i,t,n,s);this.mutationQueue.push(o);for(const B of s)this.i_=this.i_.add(new He(B.key,i)),this.indexManager.addToCollectionParentIndex(e,B.key.path.popLast());return V.resolve(o)}lookupMutationBatch(e,t){return V.resolve(this.s_(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=this.__(n),i=s<0?0:s;return V.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return V.resolve(this.mutationQueue.length===0?UB:this.Gr-1)}getAllMutationBatches(e){return V.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new He(t,0),s=new He(t,Number.POSITIVE_INFINITY),i=[];return this.i_.forEachInRange([n,s],o=>{const B=this.s_(o.r_);i.push(B)}),V.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new ke(oe);return t.forEach(s=>{const i=new He(s,0),o=new He(s,Number.POSITIVE_INFINITY);this.i_.forEachInRange([i,o],B=>{n=n.add(B.r_)})}),V.resolve(this.o_(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1;let i=n;$.isDocumentKey(i)||(i=i.child(""));const o=new He(new $(i),0);let B=new ke(oe);return this.i_.forEachWhile(u=>{const c=u.key.path;return!!n.isPrefixOf(c)&&(c.length===s&&(B=B.add(u.r_)),!0)},o),V.resolve(this.o_(B))}o_(e){const t=[];return e.forEach(n=>{const s=this.s_(n);s!==null&&t.push(s)}),t}removeMutationBatch(e,t){Q(this.a_(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.i_;return V.forEach(t.mutations,s=>{const i=new He(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)}).next(()=>{this.i_=n})}Hr(e){}containsKey(e,t){const n=new He(t,0),s=this.i_.firstAfterOrEqual(n);return V.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,V.resolve()}a_(e,t){return this.__(e)}__(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}s_(e){const t=this.__(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dy{constructor(e){this.u_=e,this.docs=function(){return new Te($.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,s=this.docs.get(n),i=s?s.size:0,o=this.u_(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:o}),this.size+=o-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return V.resolve(n?n.document.mutableCopy():We.newInvalidDocument(t))}getEntries(e,t){let n=ct();return t.forEach(s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():We.newInvalidDocument(s))}),V.resolve(n)}getAllEntries(e){let t=ct();return this.docs.forEach((n,s)=>{t=t.insert(n,s.document)}),V.resolve(t)}getDocumentsMatchingQuery(e,t,n,s){let i,o;Ge(t)?(i=fe.fromString(ea(t)),o=h=>ra(t,h)):(i=t.path,o=h=>qo(t,h));let B=ct();const u=new $(i.child("__id-9223372036854775808__")),c=this.docs.getIteratorFrom(u);for(;c.hasNext();){const{key:h,value:{document:f}}=c.getNext();if(!i.isPrefixOf(h.path))break;h.path.length>i.length+1||gD(pD(f),n)<=0||(s.has(f.key)||o(f))&&(B=B.insert(f.key,f.mutableCopy()))}return V.resolve(B)}getAllFromCollectionGroup(e,t,n,s){X(9500)}c_(e,t){return V.forEach(this.docs,n=>t(n))}newChangeBuffer(e){return new wy(this)}getSize(e){return V.resolve(this.size)}}class wy extends fy{constructor(e){super(),this.$s=e}applyChanges(e){const t=[];return this.changes.forEach((n,s)=>{s.isValidDocument()?t.push(this.$s.addEntry(e,s)):this.$s.removeEntry(n)}),V.waitFor(t)}getFromCache(e,t){return this.$s.getEntry(e,t)}getAllFromCache(e,t){return this.$s.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Iy{constructor(e){this.persistence=e,this.l_=new _r(t=>ud(t),cd),this.lastRemoteSnapshotVersion=ne.min(),this.highestTargetId=0,this.E_=0,this.h_=new lu,this.targetCount=0,this.T_=Un.ws()}forEachTarget(e,t){return this.l_.forEach((n,s)=>t(s)),V.resolve()}getLastRemoteSnapshotVersion(e){return V.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return V.resolve(this.E_)}allocateTargetId(e){return this.highestTargetId=this.T_.next(),V.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.E_&&(this.E_=t),V.resolve()}Ds(e){this.l_.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.T_=new Un(t),this.highestTargetId=t),e.sequenceNumber>this.E_&&(this.E_=e.sequenceNumber)}addTargetData(e,t){return this.Ds(t),this.targetCount+=1,V.resolve()}updateTargetData(e,t){return this.Ds(t),V.resolve()}removeTargetData(e,t){return this.l_.delete(t.target),this.h_.e_(t.targetId),this.targetCount-=1,V.resolve()}removeTargets(e,t,n){let s=0;const i=[];return this.l_.forEach((o,B)=>{B.sequenceNumber<=t&&n.get(B.targetId)===null&&(this.l_.delete(o),i.push(this.removeMatchingKeysForTargetId(e,B.targetId)),s++)}),V.waitFor(i).next(()=>s)}getTargetCount(e){return V.resolve(this.targetCount)}getTargetData(e,t){const n=this.l_.get(t)||null;return V.resolve(n)}addMatchingKeys(e,t,n){return this.h_.Ys(t,n),V.resolve()}removeMatchingKeys(e,t,n){this.h_.Xs(t,n);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach(o=>{i.push(s.markPotentiallyOrphaned(e,o))}),V.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this.h_.e_(t),V.resolve()}getMatchingKeysForTargetId(e,t){const n=this.h_.n_(t);return V.resolve(n)}containsKey(e,t){return V.resolve(this.h_.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cd{constructor(e,t){this.P_={},this.overlays={},this.I_=new Qo(0),this.R_=!1,this.R_=!0,this.A_=new Ey,this.referenceDelegate=e(this),this.V_=new Iy(this),this.indexManager=new cy,this.remoteDocumentCache=function(s){return new Dy(s)}(n=>this.referenceDelegate.d_(n)),this.serializer=new By(t),this.f_=new gy(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.R_=!1,Promise.resolve()}get started(){return this.R_}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new my,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.P_[e.toKey()];return n||(n=new _y(t,this.referenceDelegate),this.P_[e.toKey()]=n),n}getGlobalsCache(){return this.A_}getTargetCache(){return this.V_}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.f_}runTransaction(e,t,n){q("MemoryPersistence","Starting transaction:",e);const s=new yy(this.I_.next());return this.referenceDelegate.m_(),n(s).next(i=>this.referenceDelegate.p_(s).next(()=>i)).toPromise().then(i=>(s.raiseOnCommittedEvent(),i))}g_(e,t){return V.or(Object.values(this.P_).map(n=>()=>n.containsKey(e,t)))}}class yy extends mw{constructor(e){super(),this.currentSequenceNumber=e}}class hu{constructor(e){this.persistence=e,this.y_=new lu,this.w_=null}static b_(e){return new hu(e)}get S_(){if(this.w_)return this.w_;throw X(60996)}addReference(e,t,n){return this.y_.addReference(n,t),this.S_.delete(n.toString()),V.resolve()}removeReference(e,t,n){return this.y_.removeReference(n,t),this.S_.add(n.toString()),V.resolve()}markPotentiallyOrphaned(e,t){return this.S_.add(t.toString()),V.resolve()}removeTarget(e,t){this.y_.e_(t.targetId).forEach(s=>this.S_.add(s.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next(s=>{s.forEach(i=>this.S_.add(i.toString()))}).next(()=>n.removeTargetData(e,t))}m_(){this.w_=new Set}p_(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return V.forEach(this.S_,n=>{const s=$.fromPath(n);return this.v_(e,s).next(i=>{i||t.removeEntry(s,ne.min())})}).next(()=>(this.w_=null,t.apply(e)))}updateLimboDocument(e,t){return this.v_(e,t).next(n=>{n?this.S_.delete(t.toString()):this.S_.add(t.toString())})}d_(e){return 0}v_(e,t){return V.or([()=>V.resolve(this.y_.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.g_(e,t)])}}class Ao{constructor(e,t){this.persistence=e,this.D_=new _r(n=>iy(n.path),(n,s)=>n.isEqual(s)),this.garbageCollector=Iw(this,t)}static b_(e,t){return new Ao(e,t)}m_(){}p_(e){return V.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}ir(e){const t=this.Cs(e);return this.persistence.getTargetCache().getTargetCount(e).next(n=>t.next(s=>n+s))}Cs(e){let t=0;return this.sr(e,n=>{t++}).next(()=>t)}sr(e,t){return V.forEach(this.D_,(n,s)=>this.Os(e,n,s).next(i=>i?V.resolve():t(s)))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.c_(e,o=>this.Os(e,o,t).next(B=>{B||(n++,i.removeEntry(o,ne.min()))})).next(()=>i.apply(e)).next(()=>n)}markPotentiallyOrphaned(e,t){return this.D_.set(t,e.currentSequenceNumber),V.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.D_.set(n,e.currentSequenceNumber),V.resolve()}removeReference(e,t,n){return this.D_.set(n,e.currentSequenceNumber),V.resolve()}updateLimboDocument(e,t){return this.D_.set(t,e.currentSequenceNumber),V.resolve()}d_(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=no(e.data.value)),t}Os(e,t,n){return V.or([()=>this.persistence.g_(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.D_.get(t);return V.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cu{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.Vo=n,this.fo=s}static mo(e,t){let n=ie(),s=ie();for(const i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new Cu(e,t.fromCache,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ty(r,e){return $.comparator(r.key,e.key)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ay{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ry{constructor(){this.po=!1,this.yo=!1,this.wo=100,this.bo=function(){return Qp()?8:Ew($e())>0?6:4}()}initialize(e,t){this.So=e,this.indexManager=t,this.po=!0}getDocumentsMatchingQuery(e,t,n,s){const i={result:null};return this.vo(e,t).next(o=>{i.result=o}).next(()=>{if(!i.result)return this.Do(e,t,s,n).next(o=>{i.result=o})}).next(()=>{if(i.result)return;const o=new Ay;return this.xo(e,t,o).next(B=>{if(i.result=B,this.yo)return this.Co(e,t,o,B.size)})}).next(()=>i.result)}Co(e,t,n,s){return Ge(t)?V.resolve():n.documentReadCount<this.wo?(Pr()<=ae.DEBUG&&q("QueryEngine","SDK will not create cache indexes for query:",vs(t),"since it only creates cache indexes for collection contains","more than or equal to",this.wo,"documents"),V.resolve()):(Pr()<=ae.DEBUG&&q("QueryEngine","Query:",vs(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.bo*s?(Pr()<=ae.DEBUG&&q("QueryEngine","The SDK decides to create cache indexes for query:",vs(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Gt(t))):V.resolve())}vo(e,t){if(Ge(t))return V.resolve(null);let n=t;if(nh(n))return V.resolve(null);let s=Gt(n);return this.indexManager.getIndexType(e,s).next(i=>i===0?null:(n.limit!==null&&i===1&&(n=wo(n,null,"F"),s=Gt(n)),this.indexManager.getDocumentsMatchingTarget(e,s).next(o=>{const B=ie(...o);return this.So.getDocuments(e,B).next(u=>this.indexManager.getMinOffset(e,s).next(c=>{const h=this.Fo(n,u);return this.Oo(n,h,B,c.readTime)?this.vo(e,wo(n,null,"F")):this.Mo(e,h,n,c)}))})))}Do(e,t,n,s){return(Ge(t)?function(o){for(const B of o.stages){if(B instanceof gr||B instanceof mh)return!1;if(B instanceof Zo){if(B.condition instanceof $f&&B.condition._expr.name==="exists"&&B.condition._expr.params[0]instanceof Wr&&B.condition._expr.params[0].fieldName===Ft)continue;return!1}}return!0}(t):nh(t))||s.isEqual(ne.min())?V.resolve(null):this.So.getDocuments(e,n).next(i=>{const o=this.Fo(t,i);return this.Oo(t,o,n,s)?V.resolve(null):(Pr()<=ae.DEBUG&&q("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Eh(t)),this.Mo(e,o,t,dD(s,Qs)).next(B=>B))})}Fo(e,t){let n,s;return Ge(e)?(n=new ke(Ty),s=i=>ra(e,i)):(n=new ke(qB(e)),s=i=>qo(e,i)),t.forEach((i,o)=>{s(o)&&(n=n.add(o))}),n}Oo(e,t,n,s){if(Ge(e))return function(B){return B.stages.some(u=>u instanceof gr||u instanceof mh)}(e);if(e.limit===null)return!1;if(n.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}xo(e,t,n){return Pr()<=ae.DEBUG&&q("QueryEngine","Using full collection scan to execute query:",Eh(t)),this.So.getDocumentsMatchingQuery(e,t,kn.min(),n)}Mo(e,t,n,s){return this.So.getDocumentsMatchingQuery(e,n,s).next(i=>(t.forEach(o=>{i=i.insert(o.key,o)}),i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fu="LocalStore",vy=3e8;class Py{constructor(e,t,n,s){this.persistence=e,this.No=t,this.serializer=s,this.Lo=new Te(oe),this.Bo=new _r(i=>ud(i),cd),this.Uo=new Map,this.ko=e.getRemoteDocumentCache(),this.V_=e.getTargetCache(),this.f_=e.getBundleCache(),this.qo(n)}qo(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new py(this.ko,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.ko.setIndexManager(this.indexManager),this.No.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Lo))}}function by(r,e,t,n){return new Py(r,e,t,n)}async function fd(r,e){const t=re(r);return await t.persistence.runTransaction("Handle user change","readonly",n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next(i=>(s=i,t.qo(e),t.mutationQueue.getAllMutationBatches(n))).next(i=>{const o=[],B=[];let u=ie();for(const c of s){o.push(c.batchId);for(const h of c.mutations)u=u.add(h.key)}for(const c of i){B.push(c.batchId);for(const h of c.mutations)u=u.add(h.key)}return t.localDocuments.getDocuments(n,u).next(c=>({$o:c,removedBatchIds:o,addedBatchIds:B}))})})}function Sy(r,e){const t=re(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",n=>{const s=e.batch.keys(),i=t.ko.newChangeBuffer({trackRemovals:!0});return function(B,u,c,h){const f=c.batch,p=f.keys();let w=V.resolve();return p.forEach(R=>{w=w.next(()=>h.getEntry(u,R)).next(k=>{const M=c.docVersions.get(R);Q(M!==null,48541),k.version.compareTo(M)<0&&(f.applyToRemoteDocument(k,c),k.isValidDocument()&&(k.setReadTime(c.commitVersion),h.addEntry(k)))})}),w.next(()=>B.mutationQueue.removeMutationBatch(u,f))}(t,n,e,i).next(()=>i.apply(n)).next(()=>t.mutationQueue.performConsistencyCheck(n)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,function(B){let u=ie();for(let c=0;c<B.mutationResults.length;++c)B.mutationResults[c].transformResults.length>0&&(u=u.add(B.batch.mutations[c].key));return u}(e))).next(()=>t.localDocuments.getDocuments(n,s))})}function dd(r){const e=re(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.V_.getLastRemoteSnapshotVersion(t))}function Oy(r,e){const t=re(r),n=e.snapshotVersion;let s=t.Lo;return t.persistence.runTransaction("Apply remote event","readwrite-primary",i=>{const o=t.ko.newChangeBuffer({trackRemovals:!0});s=t.Lo;const B=[];e.targetChanges.forEach((h,f)=>{const p=s.get(f);if(!p)return;B.push(t.V_.removeMatchingKeys(i,h.removedDocuments,f).next(()=>t.V_.addMatchingKeys(i,h.addedDocuments,f)));let w=p.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(f)!==null?w=w.withResumeToken(Ve.EMPTY_BYTE_STRING,ne.min()).withLastLimboFreeSnapshotVersion(ne.min()):h.resumeToken.approximateByteSize()>0&&(w=w.withResumeToken(h.resumeToken,n)),s=s.insert(f,w),function(k,M,K){return k.resumeToken.approximateByteSize()===0||M.snapshotVersion.toMicroseconds()-k.snapshotVersion.toMicroseconds()>=vy?!0:K.addedDocuments.size+K.modifiedDocuments.size+K.removedDocuments.size>0}(p,w,h)&&B.push(t.V_.updateTargetData(i,w))});let u=ct(),c=ie();if(e.documentUpdates.forEach(h=>{e.resolvedLimboDocuments.has(h)&&B.push(t.persistence.referenceDelegate.updateLimboDocument(i,h))}),B.push(Ny(i,o,e.documentUpdates).next(h=>{u=h.Ko,c=h.Qo})),!n.isEqual(ne.min())){const h=t.V_.getLastRemoteSnapshotVersion(i).next(f=>t.V_.setTargetsMetadata(i,i.currentSequenceNumber,n));B.push(h)}return V.waitFor(B).next(()=>o.apply(i)).next(()=>t.localDocuments.getLocalViewOfDocuments(i,u,c)).next(()=>u)}).then(i=>(t.Lo=s,i))}function Ny(r,e,t){let n=ie(),s=ie();return t.forEach(i=>n=n.add(i)),e.getEntries(r,n).next(i=>{let o=ct();return t.forEach((B,u)=>{const c=i.get(B);u.isFoundDocument()!==c.isFoundDocument()&&(s=s.add(B)),u.isNoDocument()&&u.version.isEqual(ne.min())?(e.removeEntry(B,u.readTime),o=o.insert(B,u)):!c.isValidDocument()||u.version.compareTo(c.version)>0||u.version.compareTo(c.version)===0&&c.hasPendingWrites?(e.addEntry(u),o=o.insert(B,u)):q(fu,"Ignoring outdated watch update for ",B,". Current version:",c.version," Watch version:",u.version)}),{Ko:o,Qo:s}})}function Fy(r,e){const t=re(r);return t.persistence.runTransaction("Get next mutation batch","readonly",n=>(e===void 0&&(e=UB),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e)))}function Ly(r,e){const t=re(r);return t.persistence.runTransaction("Allocate target","readwrite",n=>{let s;return t.V_.getTargetData(n,e).next(i=>i?(s=i,V.resolve(s)):t.V_.allocateTargetId(n).next(o=>(s=new en(e,o,"TargetPurposeListen",n.currentSequenceNumber),t.V_.addTargetData(n,s).next(()=>s))))}).then(n=>{const s=t.Lo.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.Lo=t.Lo.insert(n.targetId,n),t.Bo.set(e,n.targetId)),n})}async function _B(r,e,t){const n=re(r),s=n.Lo.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,o=>n.persistence.referenceDelegate.removeTarget(o,s))}catch(o){if(!Qr(o))throw o;q(fu,`Failed to update sequence numbers for target ${e}: ${o}`)}n.Lo=n.Lo.remove(e),n.Bo.delete(s.target)}function Dh(r,e,t){const n=re(r);let s=ne.min(),i=ie();return n.persistence.runTransaction("Execute query","readwrite",o=>function(u,c,h){const f=re(u),p=f.Bo.get(h);return p!==void 0?V.resolve(f.Lo.get(p)):f.V_.getTargetData(c,h)}(n,o,Ge(e)?e:Gt(e)).next(B=>{if(B)return s=B.lastLimboFreeSnapshotVersion,n.V_.getMatchingKeysForTargetId(o,B.targetId).next(u=>{i=u})}).next(()=>n.No.getDocumentsMatchingQuery(o,e,t?s:ne.min(),t?i:ie())).next(B=>(ky(n,B),{documents:B,Wo:i})))}function ky(r,e){e.forEach((t,n)=>{const s=n.key.getCollectionGroup(),i=r.Uo.get(s)||ne.min();n.readTime.compareTo(i)>0&&r.Uo.set(s,n.readTime)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vy{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.Yo=0,this.Zo=null,this.Xo=!0}ea(){this.Yo===0&&(this.ta("Unknown"),this.Zo=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this.Zo=null,this.na("Backend didn't respond within 10 seconds."),this.ta("Offline"),Promise.resolve())))}ra(e){this.state==="Online"?this.ta("Unknown"):(this.Yo++,this.Yo>=1&&(this.ia(),this.na(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ta("Offline")))}set(e){this.ia(),this.Yo=0,e==="Online"&&(this.Xo=!1),this.ta(e)}ta(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}na(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.Xo?(on(t),this.Xo=!1):q("OnlineStateTracker",t)}ia(){this.Zo!==null&&(this.Zo.cancel(),this.Zo=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qt="RemoteStore";class xy{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.sa=[],this._a=new Map,this.oa=new Map,this.aa=new Map,this.ua=new Un(1e3),this.ca=new Un(1001),this.la=new Set,this.Ea=[],this.ha=i,this.ha.Qe(o=>{n.enqueueAndForget(async()=>{wr(this)&&(q(qt,"Restarting streams for network reachability change."),await async function(u){const c=re(u);c.la.add(4),await gi(c),c.Ta.set("Unknown"),c.la.delete(4),await sa(c)}(this))})}),this.Ta=new Vy(n,s)}}async function sa(r){if(wr(r))for(const e of r.Ea)await e(!0)}async function gi(r){for(const e of r.Ea)await e(!1)}function DB(r,e){return r.oa.get(e)||void 0}function pd(r,e){const t=re(r),n=DB(t,e.targetId);if(n!==void 0&&t._a.has(n))return;const s=function(B,u){const c=DB(B,u);c!==void 0&&B.aa.delete(c);const h=function(p,w){return w%2!=0?p.ca.next():p.ua.next()}(B,u);return B.oa.set(u,h),B.aa.set(h,u),h}(t,e.targetId);q(qt,"remoteStoreListen mapping SDK target ID to remote",e.targetId,s);const i=new en(e.target,s,e.purpose,e.sequenceNumber,e.snapshotVersion,e.lastLimboFreeSnapshotVersion,e.resumeToken);t._a.set(s,i),mu(t)?gu(t):Zr(t).Yt()&&pu(t,i)}function du(r,e){const t=re(r),n=Zr(t),s=DB(t,e);q(qt,"remoteStoreUnlisten removing mapping of SDK target ID to remote",e,s),t._a.delete(s),t.oa.delete(e),t.aa.delete(s),n.Yt()&&gd(t,s),t._a.size===0&&(n.Yt()?n.en():wr(t)&&t.Ta.set("Unknown"))}function pu(r,e){if(r.Pa.J(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(ne.min())>0){const t=r.aa.get(e.targetId);if(t===void 0)return void q(qt,"SDK target ID not found for remote ID: "+e.targetId);const n=r.remoteSyncer.getRemoteKeysForTarget(t).size;e=e.withExpectedCount(n)}Zr(r).Pn(e)}function gd(r,e){r.Pa.J(e),Zr(r).In(e)}function gu(r){r.Pa=new FD({getRemoteKeysForTarget:e=>{const t=r.aa.get(e);return t!==void 0?r.remoteSyncer.getRemoteKeysForTarget(t):ie()},ye:e=>r._a.get(e)||null,Ve:()=>r.datastore.serializer.databaseId}),Zr(r).start(),r.Ta.ea()}function mu(r){return wr(r)&&!Zr(r).Jt()&&r._a.size>0}function wr(r){return re(r).la.size===0}function md(r){r.Pa=void 0}async function My(r){r.Ta.set("Online")}async function Gy(r){r._a.forEach((e,t)=>{pu(r,e)})}async function Uy(r,e){md(r),mu(r)?(r.Ta.ra(e),gu(r)):r.Ta.set("Unknown")}async function Hy(r,e,t){if(r.Ta.set("Online"),e instanceof wf&&e.state===2&&e.cause)try{await async function(s,i){const o=i.cause;for(const B of i.targetIds){if(s._a.has(B)){const u=s.aa.get(B);u!==void 0&&(await s.remoteSyncer.rejectListen(u,o),s.oa.delete(u),s.aa.delete(B)),s._a.delete(B)}s.Pa.removeTarget(B)}}(r,e)}catch(n){q(qt,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Ro(r,n)}else if(e instanceof so?r.Pa._e(e):e instanceof Df?r.Pa.he(e):r.Pa.ue(e),!t.isEqual(ne.min()))try{const n=await dd(r.localStore);t.compareTo(n)>=0&&await function(i,o){const B=i.Pa.fe(o);B.targetChanges.forEach((c,h)=>{if(c.resumeToken.approximateByteSize()>0){const f=i._a.get(h);f&&i._a.set(h,f.withResumeToken(c.resumeToken,o))}}),B.targetMismatches.forEach((c,h)=>{const f=i._a.get(c);if(!f)return;i._a.set(c,f.withResumeToken(Ve.EMPTY_BYTE_STRING,f.snapshotVersion)),gd(i,c);const p=new en(f.target,c,h,f.sequenceNumber);pu(i,p)});const u=function(h,f){const p=new Map;f.targetChanges.forEach((R,k)=>{const M=h.aa.get(k);M!==void 0&&p.set(M,R)});let w=new Te(oe);return f.targetMismatches.forEach((R,k)=>{const M=h.aa.get(R);M!==void 0&&(w=w.insert(M,k))}),new hi(f.snapshotVersion,p,w,f.documentUpdates,f.augmentedDocumentUpdates,f.resolvedLimboDocuments)}(i,B);return i.remoteSyncer.applyRemoteEvent(u)}(r,t)}catch(n){q(qt,"Failed to raise snapshot:",n),await Ro(r,n)}}async function Ro(r,e,t){if(!Qr(e))throw e;r.la.add(1),await gi(r),r.Ta.set("Offline"),t||(t=()=>dd(r.localStore)),r.asyncQueue.enqueueRetryable(async()=>{q(qt,"Retrying IndexedDB access"),await t(),r.la.delete(1),await sa(r)})}function Ed(r,e){return e().catch(t=>Ro(r,t,e))}async function ia(r){const e=re(r),t=Hn(e);let n=e.sa.length>0?e.sa[e.sa.length-1].batchId:UB;for(;Jy(e);)try{const s=await Fy(e.localStore,n);if(s===null){e.sa.length===0&&t.en();break}n=s.batchId,jy(e,s)}catch(s){await Ro(e,s)}_d(e)&&Dd(e)}function Jy(r){return wr(r)&&r.sa.length<10}function jy(r,e){r.sa.push(e);const t=Hn(r);t.Yt()&&t.Rn&&t.An(e.mutations)}function _d(r){return wr(r)&&!Hn(r).Jt()&&r.sa.length>0}function Dd(r){Hn(r).start()}async function qy(r){Hn(r).fn()}async function Ky(r){const e=Hn(r);for(const t of r.sa)e.An(t.mutations)}async function zy(r,e,t){const n=r.sa.shift(),s=cu.from(n,e,t);await Ed(r,()=>r.remoteSyncer.applySuccessfulWrite(s)),await ia(r)}async function Qy(r,e){e&&Hn(r).Rn&&await async function(n,s){if(function(o){return AD(o)&&o!==L.ABORTED}(s.code)){const i=n.sa.shift();Hn(n).Xt(),await Ed(n,()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s)),await ia(n)}}(r,e),_d(r)&&Dd(r)}async function wh(r,e){const t=re(r);t.asyncQueue.verifyOperationInProgress(),q(qt,"RemoteStore received new credentials");const n=wr(t);t.la.add(3),await gi(t),n&&t.Ta.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.la.delete(3),await sa(t)}async function Wy(r,e){const t=re(r);e?(t.la.delete(2),await sa(t)):e||(t.la.add(2),await gi(t),t.Ta.set("Unknown"))}function Zr(r){return r.Ia||(r.Ia=function(t,n,s){const i=re(t);return i.pn(),new cw(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(r.datastore,r.asyncQueue,{ct:My.bind(null,r),Et:Gy.bind(null,r),Tt:Uy.bind(null,r),Tn:Hy.bind(null,r)}),r.Ea.push(async e=>{e?(r.Ia.Xt(),mu(r)?gu(r):r.Ta.set("Unknown")):(await r.Ia.stop(),md(r))})),r.Ia}function Hn(r){return r.Ra||(r.Ra=function(t,n,s){const i=re(t);return i.pn(),new lw(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)}(r.datastore,r.asyncQueue,{ct:()=>Promise.resolve(),Et:qy.bind(null,r),Tt:Qy.bind(null,r),Vn:Ky.bind(null,r),dn:zy.bind(null,r)}),r.Ea.push(async e=>{e?(r.Ra.Xt(),await ia(r)):(await r.Ra.stop(),r.sa.length>0&&(q(qt,`Stopping write stream with ${r.sa.length} pending writes`),r.sa=[]))})),r.Ra}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eu{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Aa(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Aa(this.observer.error,e):on("Uncaught Error in snapshot listener:",e.toString()))}Va(){this.muted=!0}Aa(e,t){setTimeout(()=>{this.muted||e(t)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _u{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new tn,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(o=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){const o=Date.now()+n,B=new _u(e,t,o,s,i);return B.start(n),B}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new H(L.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function Du(r,e){if(on("AsyncQueue",`${e}: ${r}`),Qr(r))return new H(L.UNAVAILABLE,`${e}: ${r}`);throw r}class Ih{constructor(){this.activeTargetIds=SD()}Ba(e){this.activeTargetIds=this.activeTargetIds.add(e)}Ua(e){this.activeTargetIds=this.activeTargetIds.delete(e)}La(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class $y{constructor(){this.fu=new Ih,this.mu={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.fu.Ba(e),this.mu[e]||"not-current"}updateQueryState(e,t,n){this.mu[e]=t}removeLocalQueryTarget(e){this.fu.Ua(e)}isLocalQueryTarget(e){return this.fu.activeTargetIds.has(e)}clearQueryState(e){delete this.mu[e]}getAllActiveQueryTargets(){return this.fu.activeTargetIds}isActiveQueryTarget(e){return this.fu.activeTargetIds.has(e)}start(){return this.fu=new Ih,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}function Ka(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ur{static emptySet(e){return new ur(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||$.comparator(t.key,n.key):(t,n)=>$.comparator(t.key,n.key),this.keyedMap=Sr(),this.sortedSet=new Te(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,n)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof ur)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new ur;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yh{constructor(){this.pu=new Te($.comparator)}track(e){const t=e.doc.key,n=this.pu.get(t);n?e.type!==0&&n.type===3?this.pu=this.pu.insert(t,e):e.type===3&&n.type!==1?this.pu=this.pu.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.pu=this.pu.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.pu=this.pu.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.pu=this.pu.remove(t):e.type===1&&n.type===2?this.pu=this.pu.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.pu=this.pu.insert(t,{type:2,doc:e.doc}):X(63341,{we:e,gu:n}):this.pu=this.pu.insert(t,e)}yu(){const e=[];return this.pu.inorderTraversal((t,n)=>{e.push(n)}),e}}class Jr{constructor(e,t,n,s,i,o,B,u,c){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=o,this.syncStateChanged=B,this.excludesMetadataChanges=u,this.hasCachedResults=c}static fromInitialDocuments(e,t,n,s,i){const o=[];return t.forEach(B=>{o.push({type:0,doc:B})}),new Jr(e,t,ur.emptySet(t),o,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&na(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yy{constructor(){this.wu=void 0,this.bu=[]}Su(){return this.bu.some(e=>e.vu())}}class Xy{constructor(){this.queries=Th(),this.onlineState="Unknown",this.Du=new Set}terminate(){(function(t,n){const s=re(t),i=s.queries;s.queries=Th(),i.forEach((o,B)=>{for(const u of B.bu)u.onError(n)})})(this,new H(L.ABORTED,"Firestore shutting down"))}}function Th(){return new _r(r=>Bd(r),na)}async function wu(r,e){const t=re(r);let n=3;const s=e.query;let i=t.queries.get(s);i?!i.Su()&&e.vu()&&(n=2):(i=new Yy,n=e.vu()?0:1);try{switch(n){case 0:i.wu=await t.onListen(s,!0);break;case 1:i.wu=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(o){const B=Du(o,`Initialization of query '${Ge(e.query)?nn(e.query):vs(e.query)}' failed`);return void e.onError(B)}t.queries.set(s,i),i.bu.push(e),e.xu(t.onlineState),i.wu&&e.Cu(i.wu)&&yu(t)}async function Iu(r,e){const t=re(r),n=e.query;let s=3;const i=t.queries.get(n);if(i){const o=i.bu.indexOf(e);o>=0&&(i.bu.splice(o,1),i.bu.length===0?s=e.vu()?0:1:!i.Su()&&e.vu()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function Zy(r,e){const t=re(r);let n=!1;for(const s of e){const i=s.query,o=t.queries.get(i);if(o){for(const B of o.bu)B.Cu(s)&&(n=!0);o.wu=s}}n&&yu(t)}function eT(r,e,t){const n=re(r),s=n.queries.get(e);if(s)for(const i of s.bu)i.onError(t);n.queries.delete(e)}function yu(r){r.Du.forEach(e=>{e.next()})}var wB;(function(r){r.Default="default",r.Cache="cache"})(wB||(wB={}));class Tu{constructor(e,t,n){this.query=e,this.Fu=t,this.Ou=!1,this.Mu=null,this.onlineState="Unknown",this.options=n||{}}Cu(e){if(!this.options.includeMetadataChanges){const n=[];for(const s of e.docChanges)s.type!==3&&n.push(s);e=new Jr(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Ou?this.Nu(e)&&(this.Fu.next(e),t=!0):this.Lu(e,this.onlineState)&&(this.Bu(e),t=!0),this.Mu=e,t}onError(e){this.Fu.error(e)}xu(e){this.onlineState=e;let t=!1;return this.Mu&&!this.Ou&&this.Lu(this.Mu,e)&&(this.Bu(this.Mu),t=!0),t}Lu(e,t){if(!e.fromCache||!this.vu())return!0;const n=t!=="Offline";return(!this.options.waitForSyncWhenOnline||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Nu(e){if(e.docChanges.length>0)return!0;const t=this.Mu&&this.Mu.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}Bu(e){e=Jr.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Ou=!0,this.Fu.next(e)}vu(){return this.options.source!==wB.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wd{constructor(e){this.key=e}}class Id{constructor(e){this.key=e}}class tT{constructor(e,t){this.query=e,this.zu=t,this.ju=null,this.hasCachedResults=!1,this.current=!1,this.Hu=ie(),this.mutatedKeys=ie(),this.Ju=Ge(e)?EB(e):qB(e),this.Yu=new ur(this.Ju)}get Zu(){return this.zu}Xu(e,t){const n=t?t.ec:new yh,s=t?t.Yu:this.Yu;let i=t?t.mutatedKeys:this.mutatedKeys,o=s,B=!1;const[u,c]=this.tc(this.query,s);e.inorderTraversal((f,p)=>{const w=s.get(f),R=hy(this.query,p)?p:null,k=!!w&&this.mutatedKeys.has(w.key),M=!!R&&(R.hasLocalMutations||this.mutatedKeys.has(R.key)&&R.hasCommittedMutations);let K=!1;w&&R?w.data.isEqual(R.data)?k!==M&&(n.track({type:3,doc:R}),K=!0):this.nc(w,R)||(n.track({type:2,doc:R}),K=!0,(u&&this.Ju(R,u)>0||c&&this.Ju(R,c)<0)&&(B=!0)):!w&&R?(n.track({type:0,doc:R}),K=!0):w&&!R&&(n.track({type:1,doc:w}),K=!0,(u||c)&&(B=!0)),K&&(R?(o=o.add(R),i=M?i.add(f):i.delete(f)):(o=o.delete(f),i=i.delete(f)))});const h=this.rc(this.query);if(h)if(Ge(this.query)){const f=[];o.forEach(R=>f.push(R));const p=hd(this.query,f);let w=new ur(EB(this.query));for(const R of p)w=w.add(R);o.forEach(R=>{w.has(R.key)||(i=i.delete(R.key),n.track({type:1,doc:R}))}),o=w}else{const f=this.sc(this.query);for(;o.size>h;){const p=f==="F"?o.last():o.first();o=o.delete(p.key),i=i.delete(p.key),n.track({type:1,doc:p})}}return{Yu:o,ec:n,Oo:B,mutatedKeys:i}}rc(e){var t;return Ge(e)?(t=qa(e))==null?void 0:t.limit:e.limit||void 0}sc(e){if(Ge(e)){const t=qa(e);return t&&t.limit<0?"L":"F"}return e.limitType}tc(e,t){var n;if(Ge(e)){const s=(n=qa(e))==null?void 0:n.limit;return[t.size===s?t.last():null,null]}return[e.limitType==="F"&&t.size===this.rc(this.query)?t.last():null,e.limitType==="L"&&t.size===this.rc(this.query)?t.first():null]}nc(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){const i=this.Yu;this.Yu=e.Yu,this.mutatedKeys=e.mutatedKeys;const o=e.ec.yu();o.sort((h,f)=>function(w,R){const k=M=>{switch(M){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return X(20277,{we:M})}};return k(w)-k(R)}(h.type,f.type)||this.Ju(h.doc,f.doc)),this._c(n),s=s??!1;const B=t&&!s?this.oc():[],u=this.Hu.size===0&&this.current&&!s?1:0,c=u!==this.ju;return this.ju=u,o.length!==0||c?{snapshot:new Jr(this.query,e.Yu,i,o,e.mutatedKeys,u===0,c,!1,!!n&&n.resumeToken.approximateByteSize()>0),ac:B}:{ac:B}}xu(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({Yu:this.Yu,ec:new yh,mutatedKeys:this.mutatedKeys,Oo:!1},!1)):{ac:[]}}uc(e){return!this.zu.has(e)&&!!this.Yu.has(e)&&!this.Yu.get(e).hasLocalMutations}_c(e){e&&(e.addedDocuments.forEach(t=>this.zu=this.zu.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.zu=this.zu.delete(t)),this.current=e.current)}oc(){if(!this.current)return[];const e=this.Hu;this.Hu=ie(),this.Yu.forEach(n=>{this.uc(n.key)&&(this.Hu=this.Hu.add(n.key))});const t=[];return e.forEach(n=>{this.Hu.has(n)||t.push(new Id(n))}),this.Hu.forEach(n=>{e.has(n)||t.push(new wd(n))}),t}cc(e){this.zu=e.Wo,this.Hu=ie();const t=this.Xu(e.documents);return this.applyChanges(t,!0)}lc(){return Jr.fromInitialDocuments(this.query,this.Yu,this.mutatedKeys,this.ju===0,this.hasCachedResults)}}const Au="SyncEngine";class nT{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class rT{constructor(e){this.key=e,this.Ec=!1}}class sT{constructor(e,t,n,s,i,o){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=o,this.hc={},this.Tc=new _r(B=>Bd(B),na),this.Pc=new Map,this.Ic=new Set,this.Rc=new Te($.comparator),this.Ac=new Map,this.Vc=new lu,this.dc={},this.fc=new Map,this.mc=Un.bs(),this.onlineState="Unknown",this.gc=void 0}get isPrimaryClient(){return this.gc===!0}}async function iT(r,e,t=!0){const n=Pd(r);let s;const i=n.Tc.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lc()):s=await yd(n,e,t,!0),s}async function oT(r,e){const t=Pd(r);await yd(t,e,!0,!1)}async function yd(r,e,t,n){const s=await Ly(r.localStore,Ge(e)?e:Gt(e)),i=s.targetId,o=r.sharedClientState.addLocalQueryTarget(i,t);let B;return n&&(B=await aT(r,e,i,o==="current",s.resumeToken)),r.isPrimaryClient&&t&&pd(r.remoteStore,s),B}async function aT(r,e,t,n,s){r.yc=(f,p,w)=>async function(k,M,K,ee){let Be=M.view.Xu(K);Be.Oo&&(Be=await Dh(k.localStore,M.query,!1).then(({documents:A})=>M.view.Xu(A,Be)));const he=ee&&ee.targetChanges.get(M.targetId),Ae=ee&&ee.targetMismatches.get(M.targetId)!=null,Ee=M.view.applyChanges(Be,k.isPrimaryClient,he,Ae);return Rh(k,M.targetId,Ee.ac),Ee.snapshot}(r,f,p,w);const i=await Dh(r.localStore,e,!0),o=new tT(e,i.Wo),B=o.Xu(i.documents),u=Ci.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),c=o.applyChanges(B,r.isPrimaryClient,u);Rh(r,t,c.ac);const h=new nT(e,t,o);return r.Tc.set(e,h),r.Pc.has(t)?r.Pc.get(t).push(e):r.Pc.set(t,[e]),c.snapshot}async function BT(r,e,t){const n=re(r),s=n.Tc.get(e),i=n.Pc.get(s.targetId);if(i.length>1)return n.Pc.set(s.targetId,i.filter(o=>!na(o,e))),void n.Tc.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await _B(n.localStore,s.targetId,!1).then(()=>{n.sharedClientState.clearQueryState(s.targetId),t&&du(n.remoteStore,s.targetId),IB(n,s.targetId)}).catch(zr)):(IB(n,s.targetId),await _B(n.localStore,s.targetId,!0))}async function uT(r,e){const t=re(r),n=t.Tc.get(e),s=t.Pc.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),du(t.remoteStore,n.targetId))}async function cT(r,e,t){const n=gT(r);try{const s=await function(o,B){const u=re(o),c=de.now(),h=B.reduce((w,R)=>w.add(R.key),ie());let f,p;return u.persistence.runTransaction("Locally write mutations","readwrite",w=>{let R=ct(),k=ie();return u.ko.getEntries(w,h).next(M=>{R=M,R.forEach((K,ee)=>{ee.isValidDocument()||(k=k.add(K))})}).next(()=>u.localDocuments.getOverlayedDocuments(w,R)).next(M=>{f=M;const K=[];for(const ee of B){const Be=sD(ee,f.get(ee.key).overlayedDocument);Be!=null&&K.push(new Kn(ee.key,Be,ZC(Be.value.mapValue),it.exists(!0)))}return u.mutationQueue.addMutationBatch(w,c,K,B)}).next(M=>{p=M;const K=M.applyToLocalDocumentSet(f,k);return u.documentOverlayCache.saveOverlays(w,M.batchId,K)})}).then(()=>({batchId:p.batchId,changes:Ef(f)}))}(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),function(o,B,u){let c=o.dc[o.currentUser.toKey()];c||(c=new Te(oe)),c=c.insert(B,u),o.dc[o.currentUser.toKey()]=c}(n,s.batchId,t),await mi(n,s.changes),await ia(n.remoteStore)}catch(s){const i=Du(s,"Failed to persist write");t.reject(i)}}async function Td(r,e){const t=re(r);try{const n=await Oy(t.localStore,e);e.targetChanges.forEach((s,i)=>{const o=t.Ac.get(i);o&&(Q(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?o.Ec=!0:s.modifiedDocuments.size>0?Q(o.Ec,14607):s.removedDocuments.size>0&&(Q(o.Ec,42227),o.Ec=!1))}),await mi(t,n,e)}catch(n){await zr(n)}}function Ah(r,e,t){const n=re(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const s=[];n.Tc.forEach((i,o)=>{const B=o.view.xu(e);B.snapshot&&s.push(B.snapshot)}),function(o,B){const u=re(o);u.onlineState=B;let c=!1;u.queries.forEach((h,f)=>{for(const p of f.bu)p.xu(B)&&(c=!0)}),c&&yu(u)}(n.eventManager,e),s.length&&n.hc.Tn(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function lT(r,e,t){const n=re(r);n.sharedClientState.updateQueryState(e,"rejected",t);const s=n.Ac.get(e),i=s&&s.key;if(i){let o=new Te($.comparator);o=o.insert(i,We.newNoDocument(i,ne.min()));const B=ie().add(i),u=new hi(ne.min(),new Map,new Te(oe),o,ct(),B);await Td(n,u),n.Rc=n.Rc.remove(i),n.Ac.delete(e),Ru(n)}else await _B(n.localStore,e,!1).then(()=>IB(n,e,t)).catch(zr)}async function hT(r,e){const t=re(r),n=e.batch.batchId;try{const s=await Sy(t.localStore,e);Rd(t,n,null),Ad(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await mi(t,s)}catch(s){await zr(s)}}async function CT(r,e,t){const n=re(r);try{const s=await function(o,B){const u=re(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",c=>{let h;return u.mutationQueue.lookupMutationBatch(c,B).next(f=>(Q(f!==null,37113),h=f.keys(),u.mutationQueue.removeMutationBatch(c,f))).next(()=>u.mutationQueue.performConsistencyCheck(c)).next(()=>u.documentOverlayCache.removeOverlaysForBatchId(c,h,B)).next(()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(c,h)).next(()=>u.localDocuments.getDocuments(c,h))})}(n.localStore,e);Rd(n,e,t),Ad(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await mi(n,s)}catch(s){await zr(s)}}function Ad(r,e){(r.fc.get(e)||[]).forEach(t=>{t.resolve()}),r.fc.delete(e)}function Rd(r,e,t){const n=re(r);let s=n.dc[n.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.dc[n.currentUser.toKey()]=s}}function IB(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Pc.get(e))r.Tc.delete(n),t&&r.hc.wc(n,t);r.Pc.delete(e),r.isPrimaryClient&&r.Vc.e_(e).forEach(n=>{r.Vc.containsKey(n)||vd(r,n)})}function vd(r,e){r.Ic.delete(e.path.canonicalString());const t=r.Rc.get(e);t!==null&&(du(r.remoteStore,t),r.Rc=r.Rc.remove(e),r.Ac.delete(t),Ru(r))}function Rh(r,e,t){for(const n of t)n instanceof wd?(r.Vc.addReference(n.key,e),fT(r,n)):n instanceof Id?(q(Au,"Document no longer in limbo: "+n.key),r.Vc.removeReference(n.key,e),r.Vc.containsKey(n.key)||vd(r,n.key)):X(19791,{bc:n})}function fT(r,e){const t=e.key,n=t.path.canonicalString();r.Rc.get(t)||r.Ic.has(n)||(q(Au,"New document in limbo: "+t),r.Ic.add(n),Ru(r))}function Ru(r){for(;r.Ic.size>0&&r.Rc.size<r.maxConcurrentLimboResolutions;){const e=r.Ic.values().next().value;r.Ic.delete(e);const t=new $(fe.fromString(e)),n=r.mc.next();r.Ac.set(n,new rT(t)),r.Rc=r.Rc.insert(t,n),pd(r.remoteStore,new en(Gt(jo(t.path)),n,"TargetPurposeLimboResolution",Qo.wn))}}async function mi(r,e,t){const n=re(r),s=[],i=[],o=[];n.Tc.isEmpty()||(n.Tc.forEach((B,u)=>{o.push(n.yc(u,e,t).then(c=>{var h;if((c||t)&&n.isPrimaryClient){const f=c?!c.fromCache:(h=t==null?void 0:t.targetChanges.get(u.targetId))==null?void 0:h.current;n.sharedClientState.updateQueryState(u.targetId,f?"current":"not-current")}if(c){s.push(c);const f=Cu.mo(u.targetId,c);i.push(f)}}))}),await Promise.all(o),n.hc.Tn(s),await async function(u,c){const h=re(u);try{await h.persistence.runTransaction("notifyLocalViewChanges","readwrite",f=>V.forEach(c,p=>V.forEach(p.Vo,w=>h.persistence.referenceDelegate.addReference(f,p.targetId,w)).next(()=>V.forEach(p.fo,w=>h.persistence.referenceDelegate.removeReference(f,p.targetId,w)))))}catch(f){if(!Qr(f))throw f;q(fu,"Failed to update sequence numbers: "+f)}for(const f of c){const p=f.targetId;if(!f.fromCache){const w=h.Lo.get(p),R=w.snapshotVersion,k=w.withLastLimboFreeSnapshotVersion(R);h.Lo=h.Lo.insert(p,k)}}}(n.localStore,i))}async function dT(r,e){const t=re(r);if(!t.currentUser.isEqual(e)){q(Au,"User change. New user:",e.toKey());const n=await fd(t.localStore,e);t.currentUser=e,function(i,o){i.fc.forEach(B=>{B.forEach(u=>{u.reject(new H(L.CANCELLED,o))})}),i.fc.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await mi(t,n.$o)}}function pT(r,e){const t=re(r),n=t.Ac.get(e);if(n&&n.Ec)return ie().add(n.key);{let s=ie();const i=t.Pc.get(e);if(!i)return s;for(const o of i??[]){const B=t.Tc.get(o);s=s.unionWith(B.view.Zu)}return s}}function Pd(r){const e=re(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=Td.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=pT.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=lT.bind(null,e),e.hc.Tn=Zy.bind(null,e.eventManager),e.hc.wc=eT.bind(null,e.eventManager),e}function gT(r){const e=re(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=hT.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=CT.bind(null,e),e}class vo{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Ko(e.databaseInfo.databaseId),this.sharedClientState=this.vc(e),this.persistence=this.Dc(e),await this.persistence.start(),this.localStore=this.xc(e),this.gcScheduler=this.Cc(e,this.localStore),this.indexBackfillerScheduler=this.Fc(e,this.localStore)}Cc(e,t){return null}Fc(e,t){return null}xc(e){return by(this.persistence,new Ry,e.initialUser,this.serializer)}Dc(e){return new Cd(hu.b_,this.serializer)}vc(e){return new $y}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}vo.provider={build:()=>new vo};class bd extends vo{constructor(e){super(),this.cacheSizeBytes=e}Cc(e,t){Q(this.persistence.referenceDelegate instanceof Ao,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new Dw(n,e.asyncQueue,t)}Dc(e){const t=this.cacheSizeBytes!==void 0?ut.withCacheSize(this.cacheSizeBytes):ut.DEFAULT;return new Cd(n=>Ao.b_(n,t),this.serializer)}}class Po{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>Ah(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=dT.bind(null,this.syncEngine),await Wy(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new Xy}()}createDatastore(e){const t=Ko(e.databaseInfo.databaseId),n=uw(e.databaseInfo);return fw(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return function(n,s,i,o,B){return new xy(n,s,i,o,B)}(this.localStore,this.datastore,e.asyncQueue,t=>Ah(this.syncEngine,t,0),function(){return ch.Ye()?new ch:new iw}())}createSyncEngine(e,t){return function(s,i,o,B,u,c,h){const f=new sT(s,i,o,B,u,c);return h&&(f.gc=!0),f}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(s){const i=re(s);q(qt,"RemoteStore shutting down."),i.la.add(5),await gi(i),i.ha.shutdown(),i.Ta.set("Unknown")}(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}Po.provider={build:()=>new Po};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jn="FirestoreClient";class mT{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this._databaseInfo=s,this.user=Qe.UNAUTHENTICATED,this.clientId=GB.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,async o=>{q(Jn,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o}),this.appCheckCredentials.start(n,o=>(q(Jn,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new tn;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=Du(t,"Failed to shutdown persistence");e.reject(n)}}),e.promise}}async function za(r,e){r.asyncQueue.verifyOperationInProgress(),q(Jn,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener(async s=>{n.isEqual(s)||(await fd(e.localStore,s),n=s)}),e.persistence.setDatabaseDeletedListener(()=>r.terminate()),r._offlineComponents=e}async function vh(r,e){r.asyncQueue.verifyOperationInProgress();const t=await ET(r);q(Jn,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener(n=>wh(e.remoteStore,n)),r.setAppCheckTokenChangeListener((n,s)=>wh(e.remoteStore,s)),r._onlineComponents=e}async function ET(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){q(Jn,"Using user provided OfflineComponentProvider");try{await za(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!function(s){return s.name==="FirebaseError"?s.code===L.FAILED_PRECONDITION||s.code===L.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11}(t))throw t;Pt("Error using user provided cache. Falling back to memory cache: "+t),await za(r,new vo)}}else q(Jn,"Using default OfflineComponentProvider"),await za(r,new bd(void 0));return r._offlineComponents}async function Sd(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(q(Jn,"Using user provided OnlineComponentProvider"),await vh(r,r._uninitializedComponentsProvider._online)):(q(Jn,"Using default OnlineComponentProvider"),await vh(r,new Po))),r._onlineComponents}function _T(r){return Sd(r).then(e=>e.syncEngine)}async function bo(r){const e=await Sd(r),t=e.eventManager;return t.onListen=iT.bind(null,e.syncEngine),t.onUnlisten=BT.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=oT.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=uT.bind(null,e.syncEngine),t}function DT(r,e,t,n){const s=new Eu(n),i=new Tu(e,s,t);return r.asyncQueue.enqueueAndForget(async()=>wu(await bo(r),i)),()=>{s.Va(),r.asyncQueue.enqueueAndForget(async()=>Iu(await bo(r),i))}}function wT(r,e,t={}){const n=new tn;return r.asyncQueue.enqueueAndForget(async()=>function(i,o,B,u,c){const h=new Eu({next:p=>{h.Va(),o.enqueueAndForget(()=>Iu(i,f));const w=p.docs.has(B);!w&&p.fromCache?c.reject(new H(L.UNAVAILABLE,"Failed to get document because the client is offline.")):w&&p.fromCache&&u&&u.source==="server"?c.reject(new H(L.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):c.resolve(p)},error:p=>c.reject(p)}),f=new Tu(jo(B.path),h,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return wu(i,f)}(await bo(r),r.asyncQueue,e,t,n)),n.promise}function IT(r,e,t={}){const n=new tn;return r.asyncQueue.enqueueAndForget(async()=>function(i,o,B,u,c){const h=new Eu({next:p=>{h.Va(),o.enqueueAndForget(()=>Iu(i,f)),p.fromCache&&u.source==="server"?c.reject(new H(L.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):c.resolve(p)},error:p=>c.reject(p)}),f=new Tu(B instanceof Ss?ry(B):B,h,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return wu(i,f)}(await bo(r),r.asyncQueue,e,t,n)),n.promise}function yT(r,e){const t=new tn;return r.asyncQueue.enqueueAndForget(async()=>cT(await _T(r),e,t)),t.promise}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Od=class{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new ve(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new TT(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const t=this._document.data.field(xn("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}},TT=class extends Od{data(){return super.data()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class AT{convertValue(e,t="none"){switch(xe(e)){case 0:return null;case 1:return e.booleanValue;case 2:return Re(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Fn(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw X(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return qn(e,(s,i)=>{n[s]=this.convertValue(i,t)}),n}convertVectorValue(e){var n,s,i;const t=(i=(s=(n=e.fields)==null?void 0:n[Us].arrayValue)==null?void 0:s.values)==null?void 0:i.map(o=>Re(o.doubleValue));return new lt(t)}convertGeoPoint(e){return new Ht(Re(e.latitude),Re(e.longitude))}convertArray(e,t){return(e.values||[]).map(n=>this.convertValue(n,t))}convertServerTimestamp(e,t){switch(t){case"previous":const n=ci(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(Mr(e));default:return null}}convertTimestamp(e){const t=Nn(e);return new de(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=fe.fromString(e);Q(Pf(n),9688,{name:e});const s=new Ms(n.get(1),n.get(3)),i=new $(n.popFirst(5));return s.isEqual(t)||on(`A document reference to ${i} refers to a different database (${s.projectId}/${s.database}), which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vu(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ph="AsyncQueue";class bh{constructor(e=Promise.resolve()){this.$c=[],this.Kc=!1,this.Qc=[],this.Wc=null,this.Gc=!1,this.zc=!1,this.jc=[],this.Ht=new Ff(this,"async_queue_retry"),this.Hc=()=>{const n=Ka();n&&q(Ph,"Visibility state changed to "+n.visibilityState),this.Ht.$t()},this.Jc=e;const t=Ka();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.Hc)}get isShuttingDown(){return this.Kc}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.Yc(),this.Zc(e)}enterRestrictedMode(e){if(!this.Kc){this.Kc=!0,this.zc=e||!1;const t=Ka();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.Hc)}}enqueue(e){if(this.Yc(),this.Kc)return new Promise(()=>{});const t=new tn;return this.Zc(()=>this.Kc&&this.zc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.$c.push(e),this.Xc()))}async Xc(){if(this.$c.length!==0){try{await this.$c[0](),this.$c.shift(),this.Ht.reset()}catch(e){if(!Qr(e))throw e;q(Ph,"Operation failed with retryable error: "+e)}this.$c.length>0&&this.Ht.kt(()=>this.Xc())}}Zc(e){const t=this.Jc.then(()=>(this.Gc=!0,e().catch(n=>{throw this.Wc=n,this.Gc=!1,on("INTERNAL UNHANDLED ERROR: ",Sh(n)),n}).then(n=>(this.Gc=!1,n))));return this.Jc=t,t}enqueueAfterDelay(e,t,n){this.Yc(),this.jc.indexOf(e)>-1&&(t=0);const s=_u.createAndSchedule(this,e,t,n,i=>this.el(i));return this.Qc.push(s),s}Yc(){this.Wc&&X(47125,{tl:Sh(this.Wc)})}verifyOperationInProgress(){}async nl(){let e;do e=this.Jc,await e;while(e!==this.Jc)}rl(e){for(const t of this.Qc)if(t.timerId===e)return!0;return!1}il(e){return this.nl().then(()=>{this.Qc.sort((t,n)=>t.targetTimeMs-n.targetTimeMs);for(const t of this.Qc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.nl()})}sl(e){this.jc.push(e)}el(e){const t=this.Qc.indexOf(e);this.Qc.splice(t,1)}}function Sh(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}class Kt extends Wo{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new bh,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new bh(e),this._firestoreClient=void 0,await e}}}function ZA(r,e,t){t||(t=xs);const n=ri(r,"firestore");if(n.isInitialized(t)){const s=n.getImmediate({identifier:t}),i=n.getOptions(t);if(Sn(i,e))return s;throw new H(L.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new H(L.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Vf)throw new H(L.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&jn(e.host)&&Oo(e.host),n.initialize({options:e,instanceIdentifier:t})}function eR(r,e){const t=typeof r=="object"?r:RB(),n=typeof r=="string"?r:e||xs,s=ri(t,"firestore").getImmediate({identifier:n});if(!s._initialized){const i=Kh("firestore");i&&yw(s,...i)}return s}function Ei(r){if(r._terminated)throw new H(L.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||RT(r),r._firestoreClient}function RT(r){var n,s,i,o;const e=r._freezeSettings(),t=pw(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,e);r._componentsProvider||(i=e.localCache)!=null&&i._offlineComponentProvider&&((o=e.localCache)!=null&&o._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new mT(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&function(u){const c=u==null?void 0:u._online.build();return{_offline:u==null?void 0:u._offline.build(c),_online:c}}(r._componentsProvider))}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pu extends AT{constructor(e){super(),this.firestore=e}convertBytes(e){return new Tt(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ve(this.firestore,null,t)}}class ws{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class cr extends Od{constructor(e,t,n,s,i,o){super(e,t,n,s,o),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new ao(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(xn("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new H(L.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=cr._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}cr._jsonSchemaVersion="firestore/documentSnapshot/1.0",cr._jsonSchema={type:Le("string",cr._jsonSchemaVersion),bundleSource:Le("string","DocumentSnapshot"),bundleName:Le("string"),bundle:Le("string")};class ao extends cr{data(e={}){return super.data(e)}}class lr{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new ws(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(n=>{e.call(t,new ao(this._firestore,this._userDataWriter,n.key,n,new ws(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new H(L.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(s,i){if(s._snapshot.oldDocs.isEmpty()){let o=0;return s._snapshot.docChanges.map(B=>{Ge(s._snapshot.query)?EB(s._snapshot.query):qB(s.query._query);const u=new ao(s._firestore,s._userDataWriter,B.doc.key,B.doc,new ws(s._snapshot.mutatedKeys.has(B.doc.key),s._snapshot.fromCache),s.query.converter);return B.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}})}{let o=s._snapshot.oldDocs;return s._snapshot.docChanges.filter(B=>i||B.type!==3).map(B=>{const u=new ao(s._firestore,s._userDataWriter,B.doc.key,B.doc,new ws(s._snapshot.mutatedKeys.has(B.doc.key),s._snapshot.fromCache),s.query.converter);let c=-1,h=-1;return B.type!==0&&(c=o.indexOf(B.doc.key),o=o.delete(B.doc.key)),B.type!==1&&(o=o.add(B.doc),h=o.indexOf(B.doc.key)),{type:vT(B.type),doc:u,oldIndex:c,newIndex:h}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new H(L.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=lr._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=GB.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],s=[];return this.docs.forEach(i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function vT(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return X(61501,{type:r})}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */lr._jsonSchemaVersion="firestore/querySnapshot/1.0",lr._jsonSchema={type:Le("string",lr._jsonSchemaVersion),bundleSource:Le("string","QuerySnapshot"),bundleName:Le("string"),bundle:Le("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nd(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new H(L.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class bu{}class Su extends bu{}function tR(r,e,...t){let n=[];e instanceof bu&&n.push(e),n=n.concat(t),function(i){const o=i.filter(u=>u instanceof Ou).length,B=i.filter(u=>u instanceof oa).length;if(o>1||o>0&&B>0)throw new H(L.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(n);for(const s of n)r=s._apply(r);return r}class oa extends Su{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new oa(e,t,n)}_apply(e){const t=this._parse(e);return Fd(e._query,t),new Bn(e.firestore,e.converter,CB(e._query,t))}_parse(e){const t=di(e.firestore);return function(i,o,B,u,c,h,f){let p;if(c.isKeyField()){if(h==="array-contains"||h==="array-contains-any")throw new H(L.INVALID_ARGUMENT,`Invalid Query. You can't perform '${h}' queries on documentId().`);if(h==="in"||h==="not-in"){Nh(f,h);const R=[];for(const k of f)R.push(Oh(u,i,k));p={arrayValue:{values:R}}}else p=Oh(u,i,f)}else h!=="in"&&h!=="not-in"&&h!=="array-contains-any"||Nh(f,h),p=Pw(B,o,f,h==="in"||h==="not-in");return Fe.create(c,h,p)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function nR(r,e,t){const n=e,s=xn("where",r);return oa._create(s,n,t)}class Ou extends bu{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new Ou(e,t)}_parse(e){const t=this._queryConstraints.map(n=>n._parse(e)).filter(n=>n.getFilters().length>0);return t.length===1?t[0]:bt.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:(function(s,i){let o=s;const B=i.getFlattenedFilters();for(const u of B)Fd(o,u),o=CB(o,u)}(e._query,t),new Bn(e.firestore,e.converter,CB(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Nu extends Su{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new Nu(e,t)}_apply(e){const t=function(s,i,o){if(s.startAt!==null)throw new H(L.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new H(L.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new zs(i,o)}(e._query,this._field,this._direction);return new Bn(e.firestore,e.converter,wD(e._query,t))}}function rR(r,e="asc"){const t=e,n=xn("orderBy",r);return Nu._create(n,t)}class Fu extends Su{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new Fu(e,t,n)}_apply(e){return new Bn(e.firestore,e.converter,wo(e._query,this._limit,this._limitType))}}function sR(r){return j_("limit",r),Fu._create("limit",r,"F")}function Oh(r,e,t){if(typeof(t=ye(t))=="string"){if(t==="")throw new H(L.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!pf(e)&&t.indexOf("/")!==-1)throw new H(L.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const n=e.path.child(fe.fromString(t));if(!$.isDocumentKey(n))throw new H(L.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return Ql(r,new $(n))}if(t instanceof ve)return Ql(r,t._key);throw new H(L.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Vo(t)}.`)}function Nh(r,e){if(!Array.isArray(r)||r.length===0)throw new H(L.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function Fd(r,e){const t=function(s,i){for(const o of s)for(const B of o.getFlattenedFilters())if(i.indexOf(B.op)>=0)return B.op;return null}(r.filters,function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new H(L.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new H(L.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fh(r){return function(t,n){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1}(r,["next","error","complete"])}class PT{constructor(e){this.kind="memory",this._onlineComponentProvider=Po.provider,this._offlineComponentProvider=e!=null&&e.garbageCollector?e.garbageCollector._offlineComponentProvider:{build:()=>new bd(void 0)}}toJSON(){return{kind:this.kind}}}function iR(r){return new PT(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bT{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=di(e)}set(e,t,n){this._verifyNotCommitted();const s=Qa(e,this._firestore),i=vu(s.converter,t,n),o=$B(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(o.toMutation(s._key,it.none())),this}update(e,t,n,...s){this._verifyNotCommitted();const i=Qa(e,this._firestore);let o;return o=typeof(t=ye(t))=="string"||t instanceof fi?Hf(this._dataReader,"WriteBatch.update",i._key,t,n,s):Uf(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(o.toMutation(i._key,it.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=Qa(e,this._firestore);return this._mutations=this._mutations.concat(new Jo(t._key,it.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new H(L.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function Qa(r,e){if((r=ye(r)).firestore!==e)throw new H(L.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oR(r){r=st(r,ve);const e=st(r.firestore,Kt),t=Ei(e);return wT(t,r._key).then(n=>Ld(e,r,n))}function aR(r){r=st(r,Bn);const e=st(r.firestore,Kt),t=Ei(e),n=new Pu(e);return Nd(r._query),IT(t,r._query).then(s=>new lr(e,n,r,s))}function BR(r,e,t){r=st(r,ve);const n=st(r.firestore,Kt),s=vu(r.converter,e,t),i=di(n);return _i(n,[$B(i,"setDoc",r._key,s,r.converter!==null,t).toMutation(r._key,it.none())])}function uR(r,e,t,...n){r=st(r,ve);const s=st(r.firestore,Kt),i=di(s);let o;return o=typeof(e=ye(e))=="string"||e instanceof fi?Hf(i,"updateDoc",r._key,e,t,n):Uf(i,"updateDoc",r._key,e),_i(s,[o.toMutation(r._key,it.exists(!0))])}function cR(r){return _i(st(r.firestore,Kt),[new Jo(r._key,it.none())])}function lR(r,e){const t=st(r.firestore,Kt),n=Tw(r),s=vu(r.converter,e),i=di(r.firestore);return _i(t,[$B(i,"addDoc",n._key,s,r.converter!==null,{}).toMutation(n._key,it.exists(!1))]).then(()=>n)}function hR(r,...e){var c,h,f;r=ye(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||Fh(e[n])||(t=e[n++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(Fh(e[n])){const p=e[n];e[n]=(c=p.next)==null?void 0:c.bind(p),e[n+1]=(h=p.error)==null?void 0:h.bind(p),e[n+2]=(f=p.complete)==null?void 0:f.bind(p)}let i,o,B;if(r instanceof ve)o=st(r.firestore,Kt),B=jo(r._key.path),i={next:p=>{e[n]&&e[n](Ld(o,r,p))},error:e[n+1],complete:e[n+2]};else{const p=st(r,Bn);o=st(p.firestore,Kt),B=p._query;const w=new Pu(o);i={next:R=>{e[n]&&e[n](new lr(o,w,p,R))},error:e[n+1],complete:e[n+2]},Nd(r._query)}const u=Ei(o);return DT(u,B,s,i)}function _i(r,e){const t=Ei(r);return yT(t,e)}function Ld(r,e,t){const n=t.docs.get(e._key),s=new Pu(r);return new cr(r,s,e._key,n,new ws(t.hasPendingWrites,t.fromCache),e.converter)}function CR(r){return r=st(r,Kt),Ei(r),new bT(r,e=>_i(r,e))}const Lh="@firebase/firestore",kh="4.17.2";(function(e,t=!0){V_(Er),Cr(new On("firestore",(n,{instanceIdentifier:s,options:i})=>{const o=n.getProvider("app").getImmediate(),B=new Kt(new tw(n.getProvider("auth-internal")),new sw(o,n.getProvider("app-check-internal")),z_(o,s),o);return i={useFetchStreams:t,...i},B._setSettings(i),B},"PUBLIC").setMultipleInstances(!0)),xt(Lh,kh,e),xt(Lh,kh,"esm2020")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kd="firebasestorage.googleapis.com",Vd="storageBucket",ST=2*60*1e3,OT=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Se extends zt{constructor(e,t,n=0){super(Wa(e),`Firebase Storage: ${t} (${Wa(e)})`),this.status_=n,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,Se.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return Wa(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var be;(function(r){r.UNKNOWN="unknown",r.OBJECT_NOT_FOUND="object-not-found",r.BUCKET_NOT_FOUND="bucket-not-found",r.PROJECT_NOT_FOUND="project-not-found",r.QUOTA_EXCEEDED="quota-exceeded",r.UNAUTHENTICATED="unauthenticated",r.UNAUTHORIZED="unauthorized",r.UNAUTHORIZED_APP="unauthorized-app",r.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",r.INVALID_CHECKSUM="invalid-checksum",r.CANCELED="canceled",r.INVALID_EVENT_NAME="invalid-event-name",r.INVALID_URL="invalid-url",r.INVALID_DEFAULT_BUCKET="invalid-default-bucket",r.NO_DEFAULT_BUCKET="no-default-bucket",r.CANNOT_SLICE_BLOB="cannot-slice-blob",r.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",r.NO_DOWNLOAD_URL="no-download-url",r.INVALID_ARGUMENT="invalid-argument",r.INVALID_ARGUMENT_COUNT="invalid-argument-count",r.APP_DELETED="app-deleted",r.INVALID_ROOT_OPERATION="invalid-root-operation",r.INVALID_FORMAT="invalid-format",r.INTERNAL_ERROR="internal-error",r.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(be||(be={}));function Wa(r){return"storage/"+r}function Lu(){const r="An unknown error occurred, please check the error payload for server response.";return new Se(be.UNKNOWN,r)}function NT(r){return new Se(be.OBJECT_NOT_FOUND,"Object '"+r+"' does not exist.")}function FT(r){return new Se(be.QUOTA_EXCEEDED,"Quota for bucket '"+r+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function LT(){const r="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new Se(be.UNAUTHENTICATED,r)}function kT(){return new Se(be.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function VT(r){return new Se(be.UNAUTHORIZED,"User does not have permission to access '"+r+"'.")}function xT(){return new Se(be.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function MT(){return new Se(be.CANCELED,"User canceled the upload/download.")}function GT(r){return new Se(be.INVALID_URL,"Invalid URL '"+r+"'.")}function UT(r){return new Se(be.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+r+"'.")}function HT(){return new Se(be.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+Vd+"' property when initializing the app?")}function JT(){return new Se(be.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function jT(){return new Se(be.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function qT(r){return new Se(be.UNSUPPORTED_ENVIRONMENT,`${r} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function yB(r){return new Se(be.INVALID_ARGUMENT,r)}function xd(){return new Se(be.APP_DELETED,"The Firebase app was deleted.")}function KT(r){return new Se(be.INVALID_ROOT_OPERATION,"The operation '"+r+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function Ns(r,e){return new Se(be.INVALID_FORMAT,"String does not match format '"+r+"': "+e)}function ms(r){throw new Se(be.INTERNAL_ERROR,"Internal error: "+r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _t{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let n;try{n=_t.makeFromUrl(e,t)}catch{return new _t(e,"")}if(n.path==="")return n;throw UT(e)}static makeFromUrl(e,t){let n=null;const s="([A-Za-z0-9.\\-_]+)";function i(he){he.path.charAt(he.path.length-1)==="/"&&(he.path_=he.path_.slice(0,-1))}const o="(/(.*))?$",B=new RegExp("^gs://"+s+o,"i"),u={bucket:1,path:3};function c(he){he.path_=decodeURIComponent(he.path)}const h="v[A-Za-z0-9_]+",f=t.replace(/[.]/g,"\\."),p="(/([^?#]*).*)?$",w=new RegExp(`^https?://${f}/${h}/b/${s}/o${p}`,"i"),R={bucket:1,path:3},k=t===kd?"(?:storage.googleapis.com|storage.cloud.google.com)":t,M="([^?#]*)",K=new RegExp(`^https?://${k}/${s}/${M}`,"i"),Be=[{regex:B,indices:u,postModify:i},{regex:w,indices:R,postModify:c},{regex:K,indices:{bucket:1,path:2},postModify:c}];for(let he=0;he<Be.length;he++){const Ae=Be[he],Ee=Ae.regex.exec(e);if(Ee){const A=Ee[Ae.indices.bucket];let E=Ee[Ae.indices.path];E||(E=""),n=new _t(A,E),Ae.postModify(n);break}}if(n==null)throw GT(e);return n}}class zT{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function QT(r,e,t){let n=1,s=null,i=null,o=!1,B=0;function u(){return B===2}let c=!1;function h(...M){c||(c=!0,e.apply(null,M))}function f(M){s=setTimeout(()=>{s=null,r(w,u())},M)}function p(){i&&clearTimeout(i)}function w(M,...K){if(c){p();return}if(M){p(),h.call(null,M,...K);return}if(u()||o){p(),h.call(null,M,...K);return}n<64&&(n*=2);let Be;B===1?(B=2,Be=0):Be=(n+Math.random())*1e3,f(Be)}let R=!1;function k(M){R||(R=!0,p(),!c&&(s!==null?(M||(B=2),clearTimeout(s),f(0)):M||(B=1)))}return f(0),i=setTimeout(()=>{o=!0,k(!0)},t),k}function WT(r){r(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $T(r){return r!==void 0}function YT(r){return typeof r=="object"&&!Array.isArray(r)}function ku(r){return typeof r=="string"||r instanceof String}function Vh(r){return Vu()&&r instanceof Blob}function Vu(){return typeof Blob<"u"}function xh(r,e,t,n){if(n<e)throw yB(`Invalid value for '${r}'. Expected ${e} or greater.`);if(n>t)throw yB(`Invalid value for '${r}'. Expected ${t} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xu(r,e,t){let n=e;return t==null&&(n=`https://${e}`),`${t}://${n}/v0${r}`}function Md(r){const e=encodeURIComponent;let t="?";for(const n in r)if(r.hasOwnProperty(n)){const s=e(n)+"="+e(r[n]);t=t+s+"&"}return t=t.slice(0,-1),t}var hr;(function(r){r[r.NO_ERROR=0]="NO_ERROR",r[r.NETWORK_ERROR=1]="NETWORK_ERROR",r[r.ABORT=2]="ABORT"})(hr||(hr={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function XT(r,e){const t=r>=500&&r<600,s=[408,429].indexOf(r)!==-1,i=e.indexOf(r)!==-1;return t||s||i}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ZT{constructor(e,t,n,s,i,o,B,u,c,h,f,p=!0,w=!1){this.url_=e,this.method_=t,this.headers_=n,this.body_=s,this.successCodes_=i,this.additionalRetryCodes_=o,this.callback_=B,this.errorCallback_=u,this.timeout_=c,this.progressCallback_=h,this.connectionFactory_=f,this.retry=p,this.isUsingEmulator=w,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((R,k)=>{this.resolve_=R,this.reject_=k,this.start_()})}start_(){const e=(n,s)=>{if(s){n(!1,new Qi(!1,null,!0));return}const i=this.connectionFactory_();this.pendingConnection_=i;const o=B=>{const u=B.loaded,c=B.lengthComputable?B.total:-1;this.progressCallback_!==null&&this.progressCallback_(u,c)};this.progressCallback_!==null&&i.addUploadProgressListener(o),i.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&i.removeUploadProgressListener(o),this.pendingConnection_=null;const B=i.getErrorCode()===hr.NO_ERROR,u=i.getStatus();if(!B||XT(u,this.additionalRetryCodes_)&&this.retry){const h=i.getErrorCode()===hr.ABORT;n(!1,new Qi(!1,null,h));return}const c=this.successCodes_.indexOf(u)!==-1;n(!0,new Qi(c,i))})},t=(n,s)=>{const i=this.resolve_,o=this.reject_,B=s.connection;if(s.wasSuccessCode)try{const u=this.callback_(B,B.getResponse());$T(u)?i(u):i()}catch(u){o(u)}else if(B!==null){const u=Lu();u.serverResponse=B.getErrorText(),this.errorCallback_?o(this.errorCallback_(B,u)):o(u)}else if(s.canceled){const u=this.appDelete_?xd():MT();o(u)}else{const u=xT();o(u)}};this.canceled_?t(!1,new Qi(!1,null,!0)):this.backoffId_=QT(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&WT(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class Qi{constructor(e,t,n){this.wasSuccessCode=e,this.connection=t,this.canceled=!!n}}function eA(r,e){e!==null&&e.length>0&&(r.Authorization="Firebase "+e)}function tA(r,e){r["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function nA(r,e){e&&(r["X-Firebase-GMPID"]=e)}function rA(r,e){e!==null&&(r["X-Firebase-AppCheck"]=e)}function sA(r,e,t,n,s,i,o=!0,B=!1){const u=Md(r.urlParams),c=r.url+u,h=Object.assign({},r.headers);return nA(h,e),eA(h,t),tA(h,i),rA(h,n),new ZT(c,r.method,h,r.body,r.successCodes,r.additionalRetryCodes,r.handler,r.errorHandler,r.timeout,r.progressCallback,s,o,B)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function iA(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function oA(...r){const e=iA();if(e!==void 0){const t=new e;for(let n=0;n<r.length;n++)t.append(r[n]);return t.getBlob()}else{if(Vu())return new Blob(r);throw new Se(be.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function aA(r,e,t){return r.webkitSlice?r.webkitSlice(e,t):r.mozSlice?r.mozSlice(e,t):r.slice?r.slice(e,t):null}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function BA(r){if(typeof atob>"u")throw qT("base-64");return atob(r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kt={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class $a{constructor(e,t){this.data=e,this.contentType=t||null}}function uA(r,e){switch(r){case kt.RAW:return new $a(Gd(e));case kt.BASE64:case kt.BASE64URL:return new $a(Ud(r,e));case kt.DATA_URL:return new $a(lA(e),hA(e))}throw Lu()}function Gd(r){const e=[];for(let t=0;t<r.length;t++){let n=r.charCodeAt(t);if(n<=127)e.push(n);else if(n<=2047)e.push(192|n>>6,128|n&63);else if((n&64512)===55296)if(!(t<r.length-1&&(r.charCodeAt(t+1)&64512)===56320))e.push(239,191,189);else{const i=n,o=r.charCodeAt(++t);n=65536|(i&1023)<<10|o&1023,e.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|n&63)}else(n&64512)===56320?e.push(239,191,189):e.push(224|n>>12,128|n>>6&63,128|n&63)}return new Uint8Array(e)}function cA(r){let e;try{e=decodeURIComponent(r)}catch{throw Ns(kt.DATA_URL,"Malformed data URL.")}return Gd(e)}function Ud(r,e){switch(r){case kt.BASE64:{const s=e.indexOf("-")!==-1,i=e.indexOf("_")!==-1;if(s||i)throw Ns(r,"Invalid character '"+(s?"-":"_")+"' found: is it base64url encoded?");break}case kt.BASE64URL:{const s=e.indexOf("+")!==-1,i=e.indexOf("/")!==-1;if(s||i)throw Ns(r,"Invalid character '"+(s?"+":"/")+"' found: is it base64 encoded?");e=e.replace(/-/g,"+").replace(/_/g,"/");break}}let t;try{t=BA(e)}catch(s){throw s.message.includes("polyfill")?s:Ns(r,"Invalid character found")}const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n}class Hd{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(t===null)throw Ns(kt.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const n=t[1]||null;n!=null&&(this.base64=CA(n,";base64"),this.contentType=this.base64?n.substring(0,n.length-7):n),this.rest=e.substring(e.indexOf(",")+1)}}function lA(r){const e=new Hd(r);return e.base64?Ud(kt.BASE64,e.rest):cA(e.rest)}function hA(r){return new Hd(r).contentType}function CA(r,e){return r.length>=e.length?r.substring(r.length-e.length)===e:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yn{constructor(e,t){let n=0,s="";Vh(e)?(this.data_=e,n=e.size,s=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),n=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),n=e.length),this.size_=n,this.type_=s}size(){return this.size_}type(){return this.type_}slice(e,t){if(Vh(this.data_)){const n=this.data_,s=aA(n,e,t);return s===null?null:new yn(s)}else{const n=new Uint8Array(this.data_.buffer,e,t-e);return new yn(n,!0)}}static getBlob(...e){if(Vu()){const t=e.map(n=>n instanceof yn?n.data_:n);return new yn(oA.apply(null,t))}else{const t=e.map(o=>ku(o)?uA(kt.RAW,o).data:o.data_);let n=0;t.forEach(o=>{n+=o.byteLength});const s=new Uint8Array(n);let i=0;return t.forEach(o=>{for(let B=0;B<o.length;B++)s[i++]=o[B]}),new yn(s,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jd(r){let e;try{e=JSON.parse(r)}catch{return null}return YT(e)?e:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fA(r){if(r.length===0)return null;const e=r.lastIndexOf("/");return e===-1?"":r.slice(0,e)}function dA(r,e){const t=e.split("/").filter(n=>n.length>0).join("/");return r.length===0?t:r+"/"+t}function jd(r){const e=r.lastIndexOf("/",r.length-2);return e===-1?r:r.slice(e+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pA(r,e){return e}class et{constructor(e,t,n,s){this.server=e,this.local=t||e,this.writable=!!n,this.xform=s||pA}}let Wi=null;function gA(r){return!ku(r)||r.length<2?r:jd(r)}function qd(){if(Wi)return Wi;const r=[];r.push(new et("bucket")),r.push(new et("generation")),r.push(new et("metageneration")),r.push(new et("name","fullPath",!0));function e(i,o){return gA(o)}const t=new et("name");t.xform=e,r.push(t);function n(i,o){return o!==void 0?Number(o):o}const s=new et("size");return s.xform=n,r.push(s),r.push(new et("timeCreated")),r.push(new et("updated")),r.push(new et("md5Hash",null,!0)),r.push(new et("cacheControl",null,!0)),r.push(new et("contentDisposition",null,!0)),r.push(new et("contentEncoding",null,!0)),r.push(new et("contentLanguage",null,!0)),r.push(new et("contentType",null,!0)),r.push(new et("metadata","customMetadata",!0)),Wi=r,Wi}function mA(r,e){function t(){const n=r.bucket,s=r.fullPath,i=new _t(n,s);return e._makeStorageReference(i)}Object.defineProperty(r,"ref",{get:t})}function EA(r,e,t){const n={};n.type="file";const s=t.length;for(let i=0;i<s;i++){const o=t[i];n[o.local]=o.xform(n,e[o.server])}return mA(n,r),n}function Kd(r,e,t){const n=Jd(e);return n===null?null:EA(r,n,t)}function _A(r,e,t,n){const s=Jd(e);if(s===null||!ku(s.downloadTokens))return null;const i=s.downloadTokens;if(i.length===0)return null;const o=encodeURIComponent;return i.split(",").map(c=>{const h=r.bucket,f=r.fullPath,p="/b/"+o(h)+"/o/"+o(f),w=xu(p,t,n),R=Md({alt:"media",token:c});return w+R})[0]}function DA(r,e){const t={},n=e.length;for(let s=0;s<n;s++){const i=e[s];i.writable&&(t[i.server]=r[i.local])}return JSON.stringify(t)}class zd{constructor(e,t,n,s){this.url=e,this.method=t,this.handler=n,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qd(r){if(!r)throw Lu()}function wA(r,e){function t(n,s){const i=Kd(r,s,e);return Qd(i!==null),i}return t}function IA(r,e){function t(n,s){const i=Kd(r,s,e);return Qd(i!==null),_A(i,s,r.host,r._protocol)}return t}function Wd(r){function e(t,n){let s;return t.getStatus()===401?t.getErrorText().includes("Firebase App Check token is invalid")?s=kT():s=LT():t.getStatus()===402?s=FT(r.bucket):t.getStatus()===403?s=VT(r.path):s=n,s.status=t.getStatus(),s.serverResponse=n.serverResponse,s}return e}function yA(r){const e=Wd(r);function t(n,s){let i=e(n,s);return n.getStatus()===404&&(i=NT(r.path)),i.serverResponse=s.serverResponse,i}return t}function TA(r,e,t){const n=e.fullServerUrl(),s=xu(n,r.host,r._protocol),i="GET",o=r.maxOperationRetryTime,B=new zd(s,i,IA(r,t),o);return B.errorHandler=yA(e),B}function AA(r,e){return r&&r.contentType||e&&e.type()||"application/octet-stream"}function RA(r,e,t){const n=Object.assign({},t);return n.fullPath=r.path,n.size=e.size(),n.contentType||(n.contentType=AA(null,e)),n}function vA(r,e,t,n,s){const i=e.bucketOnlyServerUrl(),o={"X-Goog-Upload-Protocol":"multipart"};function B(){let Be="";for(let he=0;he<2;he++)Be=Be+Math.random().toString().slice(2);return Be}const u=B();o["Content-Type"]="multipart/related; boundary="+u;const c=RA(e,n,s),h=DA(c,t),f="--"+u+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+h+`\r
--`+u+`\r
Content-Type: `+c.contentType+`\r
\r
`,p=`\r
--`+u+"--",w=yn.getBlob(f,n,p);if(w===null)throw JT();const R={name:c.fullPath},k=xu(i,r.host,r._protocol),M="POST",K=r.maxUploadRetryTime,ee=new zd(k,M,wA(r,t),K);return ee.urlParams=R,ee.headers=o,ee.body=w.uploadData(),ee.errorHandler=Wd(e),ee}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class PA{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=hr.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=hr.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=hr.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,n,s,i){if(this.sent_)throw ms("cannot .send() more than once");if(jn(e)&&n&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),i!==void 0)for(const o in i)i.hasOwnProperty(o)&&this.xhr_.setRequestHeader(o,i[o].toString());return s!==void 0?this.xhr_.send(s):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw ms("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw ms("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw ms("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw ms("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",e)}}class bA extends PA{initXhr(){this.xhr_.responseType="text"}}function $d(){return new bA}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mr{constructor(e,t){this._service=e,t instanceof _t?this._location=t:this._location=_t.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new mr(e,t)}get root(){const e=new _t(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return jd(this._location.path)}get storage(){return this._service}get parent(){const e=fA(this._location.path);if(e===null)return null;const t=new _t(this._location.bucket,e);return new mr(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw KT(e)}}function SA(r,e,t){r._throwIfRoot("uploadBytes");const n=vA(r.storage,r._location,qd(),new yn(e,!0),t);return r.storage.makeRequestWithTokens(n,$d).then(s=>({metadata:s,ref:r}))}function OA(r){r._throwIfRoot("getDownloadURL");const e=TA(r.storage,r._location,qd());return r.storage.makeRequestWithTokens(e,$d).then(t=>{if(t===null)throw jT();return t})}function NA(r,e){const t=dA(r._location.path,e),n=new _t(r._location.bucket,t);return new mr(r.storage,n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function FA(r){return/^[A-Za-z]+:\/\//.test(r)}function LA(r,e){return new mr(r,e)}function Yd(r,e){if(r instanceof Mu){const t=r;if(t._bucket==null)throw HT();const n=new mr(t,t._bucket);return e!=null?Yd(n,e):n}else return e!==void 0?NA(r,e):r}function kA(r,e){if(e&&FA(e)){if(r instanceof Mu)return LA(r,e);throw yB("To use ref(service, url), the first argument must be a Storage instance.")}else return Yd(r,e)}function Mh(r,e){const t=e==null?void 0:e[Vd];return t==null?null:_t.makeFromBucketSpec(t,r)}function VA(r,e,t,n={}){r.host=`${e}:${t}`;const s=jn(e);s&&Oo(`https://${r.host}/b`),r._isUsingEmulator=!0,r._protocol=s?"https":"http";const{mockUserToken:i}=n;i&&(r._overrideAuthToken=typeof i=="string"?i:Wh(i,r.app.options.projectId))}class Mu{constructor(e,t,n,s,i,o=!1){this.app=e,this._authProvider=t,this._appCheckProvider=n,this._url=s,this._firebaseVersion=i,this._isUsingEmulator=o,this._bucket=null,this._host=kd,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=ST,this._maxUploadRetryTime=OT,this._requests=new Set,s!=null?this._bucket=_t.makeFromBucketSpec(s,this._host):this._bucket=Mh(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=_t.makeFromBucketSpec(this._url,e):this._bucket=Mh(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){xh("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){xh("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(yt(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new mr(this,e)}_makeRequest(e,t,n,s,i=!0){if(this._deleted)return new zT(xd());{const o=sA(e,this._appId,n,s,t,this._firebaseVersion,i,this._isUsingEmulator);return this._requests.add(o),o.getPromise().then(()=>this._requests.delete(o),()=>this._requests.delete(o)),o}}async makeRequestWithTokens(e,t){const[n,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,n,s).getPromise()}}const Gh="@firebase/storage",Uh="0.14.5";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xd="storage";function fR(r,e,t){return r=ye(r),SA(r,e,t)}function dR(r){return r=ye(r),OA(r)}function pR(r,e){return r=ye(r),kA(r,e)}function gR(r=RB(),e){r=ye(r);const n=ri(r,Xd).getImmediate({identifier:e}),s=Kh("storage");return s&&xA(n,...s),n}function xA(r,e,t,n={}){VA(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function MA(r,{instanceIdentifier:e}){const t=r.getProvider("app").getImmediate(),n=r.getProvider("auth-internal"),s=r.getProvider("app-check-internal");return new Mu(t,n,s,e,Er)}function GA(){Cr(new On(Xd,MA,"PUBLIC").setMultipleInstances(!0)),xt(Gh,Uh,""),xt(Gh,Uh,"esm2020")}GA();export{JA as A,jA as B,qA as C,_n as G,de as T,RB as a,ZA as b,eR as c,KA as d,gR as e,WA as f,HA as g,hR as h,tm as i,lR as j,Tw as k,BR as l,iR as m,aR as n,rR as o,dR as p,tR as q,pR as r,$A as s,uR as t,fR as u,sR as v,nR as w,cR as x,CR as y,oR as z};
