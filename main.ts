
import { mount } from 'svelte';
import App from './App.svelte';

const rootElement = document.getElementById('root');

if (rootElement) {
    // Khởi tạo Svelte App
    mount(App, {
        target: rootElement
    });
} else {
    console.error("Could not find root element to mount Svelte app");
}
