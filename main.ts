import { mount } from 'svelte';
import App from './App.svelte';

const rootElement = document.getElementById('root');

if (rootElement) {
    // Mount the Svelte application to the root element
    mount(App, {
        target: rootElement
    });
} else {
    console.error("Could not find root element to mount Svelte app");
}