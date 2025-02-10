// Utility Functions
const fixedEncodeURI = (str) => {
    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
};

function loadDefaultConfig(callback) {
    fetch(chrome.runtime.getURL('config/toolConfig.json'))
        .then((response) => response.json())
        .then((defaultConfig) => {
            chrome.storage.local.set({ toolConfig: defaultConfig }, () => {
                console.log("Default config loaded.");
                if (callback) callback(defaultConfig);
            });
        })
        .catch((error) => console.error("Failed to load default config:", error));
}

function clearContextMenus(callback) {
    chrome.contextMenus.removeAll(() => {
        console.log("All context menus removed.");
        setTimeout(callback, 100); // Delay to ensure all menus are truly removed
    });
}

// Context Menu Initialization
let isInitializing = false;

function initializeContextMenu() {
    if (isInitializing) {
        console.log("Context menu initialization already in progress.");
        return;
    }
    isInitializing = true;

    clearContextMenus(() => {
        chrome.storage.local.get('toolConfig', (data) => {
            let config = data.toolConfig;

            if (!config) {
                console.warn("toolConfig not found. Loading default config...");
                loadDefaultConfig(() => {
                    isInitializing = false;
                    initializeContextMenu();
                });
                return;
            }

            if (typeof config.tools === 'object') {
                let uniqueIdCounter = 0;

                Object.entries(config.tools).forEach(([toolKey, tool]) => {
                    const toolId = `${toolKey}`;
                    chrome.contextMenus.create({
                        id: toolId,
                        title: tool.name || toolKey,
                        contexts: ['selection']
                    });

                    if (tool.mode === "single" && Array.isArray(tool.urls)) {
                        tool.urls.forEach((urlObj, index) => {
                            if (urlObj && urlObj.link) {
                                const urlId = `${toolId}_url_${index}`;
                                chrome.contextMenus.create({
                                    parentId: toolId,
                                    id: urlId,
                                    title: urlObj.name || `Link ${index + 1}`,
                                    contexts: ['selection']
                                });
                            }
                        });
                    }
                });

                console.log("Context menus initialized.");
            } else {
                console.error("Invalid config format:", config);
            }

            isInitializing = false;
        });
    });
}

// Event Listeners
chrome.runtime.onInstalled.addListener(initializeContextMenu);
chrome.runtime.onStartup.addListener(initializeContextMenu);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.toolConfig) {
        console.log(`[${new Date().toLocaleString()}] toolConfig changed, updating context menu...`);
        initializeContextMenu();
    }
});

chrome.contextMenus.onClicked.addListener((info) => {
    chrome.storage.local.get('toolConfig', (data) => {
        console.log("Tool item clicked");
        const config = data.toolConfig;

        let toolKey = info.menuItemId.split('_url_')[0];
        console.log("Tool key: " + toolKey);

        const tool = config.tools[toolKey];
        console.log("Tool: " + JSON.stringify(tool));

        if (config && typeof config.tools === 'object' && tool) {
            const encodedText = encodeURIComponent(info.selectionText);
            console.log("Tool mode: " + tool.mode);

            if (tool.mode === "multi") {
                tool.urls.forEach((urlObj) => {
                    if (urlObj && urlObj.link) {
                        let fullUrl = urlObj.link;
                        if (tool.name === "Cyber Chef") {
                            fullUrl += btoa(fixedEncodeURI(info.selectionText)).replace(/=/g, '');
                        } else {
                            fullUrl += encodedText;
                        }
                        chrome.tabs.create({ url: fullUrl });
                    }
                });
            } else if (tool.mode === "single" && info.menuItemId.includes('_url_')) {
                const urlIndex = parseInt(info.menuItemId.split('_url_')[1], 10);
                console.log("URL Index: " + urlIndex);

                const urlObj = tool.urls[urlIndex];
                console.log("URL Object: " + urlObj);

                if (urlObj && urlObj.link) {
                    let fullUrl = urlObj.link;
                    if (tool.name === "Cyber Chef") {
                        fullUrl += btoa(fixedEncodeURI(info.selectionText)).replace(/=/g, '');
                    } else {
                        fullUrl += encodedText;
                    }
                    chrome.tabs.create({ url: fullUrl });
                }
            }
        }
    });
});
