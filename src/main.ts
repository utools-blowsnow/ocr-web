import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import './assets/main.css'
import { createPinia, PiniaVuePlugin } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VTooltip from '@/libs/vtooltip'

Vue.use(PiniaVuePlugin)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate);

Vue.use(ElementUI);
Vue.directive('tooltip', VTooltip)

console.log(window.mutils);


new Vue({
    render: (h) => h(App),
    pinia,
}).$mount('#app')
