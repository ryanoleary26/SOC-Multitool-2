document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#toolTable tbody');
  let editingKey = null;

  // Initialization
  const loadTools = () => {
    chrome.storage.local.get('toolConfig', (data) => {
      const config = data.toolConfig || { tools: {} };
      tableBody.innerHTML = '';

      if (Object.keys(config.tools).length > 0) {
        Object.entries(config.tools).forEach(([key, tool]) => createTableRow(key, tool));
        addEventListeners();
      } else {
        tableBody.innerHTML = '<tr><td colspan="4">No tools found.</td></tr>';
      }
    });
  };

  const createTableRow = (key, tool) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${tool.name}</td>
      <td>${tool.mode}</td>
      <td>
        <div class="pill-container">
          ${tool.urls.map(url => `<a href="${url.link}" target="_blank" class="pill-link">${url.name}</a>`).join('<br>')}</td>
        </div>
      <td>
        <button class="edit-btn" data-key="${key}"><i class="fas fa-edit"></i>Edit</button>
        <button class="delete-btn" data-key="${key}"><i class="fas fa-trash-alt"></i>Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  };

  const addEventListeners = () => {
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
  };

  // Event Handlers
  const handleEdit = (e) => {
    editingKey = e.currentTarget.dataset.key;
    openModal('Edit Tool');
    chrome.storage.local.get('toolConfig', (data) => {
      const tool = data.toolConfig?.tools?.[editingKey];
      if (tool) {
        document.getElementById('toolName').value = tool.name;
        document.getElementById('toolMode').value = tool.mode;
        loadUrlInputs(tool.urls);
      } else {
        throw new Error('No tool found for the given key:', editingKey);
      }
    });
  };

  const handleDelete = (e) => {
    const key = e.target.dataset.key;
    chrome.storage.local.get('toolConfig', (data) => {
      const config = data.toolConfig;
      delete config.tools[key];
      config.tools = Object.fromEntries(Object.entries(config.tools).filter(([_, value]) => value !== null));
      chrome.storage.local.set({ toolConfig: config }, () => {
        showNotification(`Tool removed successfully`, 'success');
        loadTools();
      });
    });
  };

  const loadUrlInputs = (urls) => {
    const urlContainer = document.getElementById('urlContainer');
    urlContainer.innerHTML = '';
    urls.forEach(url => addUrlInput(url.name, url.link));
  };

  const addUrlInput = (name = '', link = '') => {
    const urlContainer = document.getElementById('urlContainer');
    const urlGroup = document.createElement('div');
    urlGroup.className = 'url-entry';
    urlGroup.innerHTML = `
      <input type="text" class="url-name" value="${name}" placeholder="Link name">
      <input type="text" class="url-link" value="${link}" placeholder="Link URL">
      <button class="remove-url-btn"><i class="fas fa-trash-alt"></i>Remove URL</button>
    `;
    urlContainer.appendChild(urlGroup);

    urlGroup.querySelector('.remove-url-btn').addEventListener('click', () => urlGroup.remove());
  };

  // Modal Functions
  const openModal = (title) => {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('toolName').value = '';
    document.getElementById('toolMode').value = 'single';
    document.getElementById('urlContainer').innerHTML = '';
    addUrlInput();
    document.getElementById('toolModal').style.display = 'block';
  };

  const closeModal = () => {
    document.getElementById('toolModal').style.display = 'none';
  };

  // Reset and Save Functions
  const resetToDefault = () => {
    chrome.storage.local.remove('toolConfig', () => {
      fetch('../config/toolConfig.json')
        .then(response => response.json())
        .then(defaultConfig => {
          chrome.storage.local.set({ toolConfig: defaultConfig }, () => {
            showNotification(`Tool reset successful`, 'success')
            loadTools();
          });
        })
        .catch(error => showNotification(`Tool reset failed: ${error}`, 'error'));
    });
  };

  const showNotification = (message, type = 'success') => {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Add the Font Awesome icon dynamically
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle';
    icon.style.marginRight = '8px'; // Add spacing between the icon and the text

    // Append the icon and message to the notification
    notification.appendChild(icon);
    notification.appendChild(document.createTextNode(message));

    container.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const saveTool = () => {
    const toolName = document.getElementById('toolName').value.trim();
    const toolMode = document.getElementById('toolMode').value;
    const urlEntries = document.querySelectorAll('.url-entry');
    const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/; // Regex for URL validation

    if (!toolName) {
      showNotification('Tool not saved: Tool name is required', 'error');
      return;
    }

    const urls = Array.from(urlEntries).map(entry => {
      const name = entry.querySelector('.url-name').value.trim();
      const link = entry.querySelector('.url-link').value.trim();

      // Check for blank fields
      if (!name || !link) {
        showNotification('Tool not saved: All fields for each tool entry must be filled out', 'error');
        return;
      }
      return { name, link };
    });

    if (urls.length === 0) {
      showNotification(`You must provide details of at least one tool resource - Name and URL.`, 'error');
      return;
    }

    for (var i = 0; i < urls.length; i++) {
      if (urlPattern.test(urls[i].link) === false) {
        showNotification(`Validation failed: Invalid URL detected. The URL provided '${urls[i].link}' is not valid.`, 'error');
        return;
      }
      if (!urls[i].name || !urls[i].link) {
        showNotification(`Validation failed: Blank resource fields detected.`, 'error');
        return;
      }
    }

    chrome.storage.local.get('toolConfig', (data) => {
      let config = data.toolConfig || { tools: {} };
      if (!config.tools || typeof config.tools !== 'object') {
        config.tools = {};  // Ensure tools is always an object
      }

      const toolData = { name: toolName, mode: toolMode, urls: urls };

      if (editingKey) {
        config.tools[editingKey] = toolData;
      } else {
        const newToolKey = `tool_${Date.now()}`;
        // console.log(`Creating new tool with key: ${newToolKey}`);
        config.tools = { ...config.tools, [newToolKey]: toolData };  // Merge new tool without overwriting others
      }

      chrome.storage.local.set({ toolConfig: config }, () => {
        showNotification(editingKey ? 'Tool updated successfully' : 'Tool saved successfully', 'success');
        loadTools();
        closeModal();
      });
    });
  };

  const exportConfig = () => {
    chrome.storage.local.get('toolConfig', (data) => {
      const config = data.toolConfig || { tools: {} };

      // Convert the configuration to a JSON string
      const jsonString = JSON.stringify(config, null, 2);

      // Prompt the user for a file name
      const fileName = window.prompt('Enter a file name for the export:', 'toolConfig.json');
      if (!fileName) {
        showNotification('Export canceled: No file name provided', 'error');
        return;
      }

      // Ensure the file name ends with .json
      const sanitizedFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;

      // Create a Blob and a temporary download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = sanitizedFileName; // Use the user-provided file name
      a.click();

      // Clean up the URL object
      URL.revokeObjectURL(url);

      showNotification('Configuration exported successfully', 'success');
    });
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) {
        showNotification('No file selected', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);

          // Validate the imported configuration
          if (!validateConfig(importedConfig)) {
            throw new Error('Invalid configuration format');
          }

          // Save the imported configuration to local storage
          chrome.storage.local.set({ toolConfig: importedConfig }, () => {
            showNotification('Configuration imported successfully', 'success');
            loadTools(); // Reload the tools to reflect the imported configuration
          });
        } catch (error) {
          showNotification(`Import failed: ${error.message}`, 'error');
        }
      };

      reader.readAsText(file);
    });

    input.click();
  };

  const validateConfig = (config) => {
    // Check if the root object has a "tools" property
    if (!config || typeof config !== 'object' || !config.tools || typeof config.tools !== 'object') {
      return false;
    }

    // Validate each tool in the "tools" object
    for (const key in config.tools) {
      const tool = config.tools[key];

      // Check if the tool has "mode", "name", and "urls" properties
      if (
        !tool ||
        typeof tool !== 'object' ||
        !['single', 'multi'].includes(tool.mode) || // Ensure "mode" is either "single" or "multi"
        typeof tool.name !== 'string' ||
        !Array.isArray(tool.urls)
      ) {
        return false;
      }

      // Validate each URL entry in the "urls" array
      for (const url of tool.urls) {
        if (
          !url ||
          typeof url !== 'object' ||
          typeof url.link !== 'string' ||
          typeof url.name !== 'string'
        ) {
          return false;
        }
      }
    }

    return true; // If all checks pass, the config is valid
  };

  // Button Event Listeners
  document.getElementById('resetBtn').addEventListener('click', resetToDefault);
  document.getElementById('addUrlBtn').addEventListener('click', () => addUrlInput());
  document.getElementById('saveToolBtn').addEventListener('click', saveTool);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('addToolBtn').addEventListener('click', () => {
    editingKey = null;
    openModal('Add New Tool');
  });
  document.getElementById('exportConfigBtn').addEventListener('click', exportConfig);
  document.getElementById('importConfigBtn').addEventListener('click', importConfig);

  // Initial Load
  loadTools();
});
