// Import Plugin
window.stfplugins.imported.push({
    repo: 'QuixThe2nd/starfiles-plugin-demo',
    version: '0.0.1',
    plugin_name: 'myplugin',
});
// Save plugins
localStorage.setItem("plugins", JSON.stringify(window.stfplugins.imported));
