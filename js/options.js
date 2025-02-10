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
      <td>${tool.urls.map(url => `<a href="${url.link}" target="_blank">${url.name}</a>`).join('<br>')}</td>
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
        console.error('No tool found for the given key:', editingKey);
      }
    });
  };

  const handleDelete = (e) => {
    const key = e.target.dataset.key;
    chrome.storage.local.get('toolConfig', (data) => {
      const config = data.toolConfig;
      delete config.tools[key];
      config.tools = Object.fromEntries(Object.entries(config.tools).filter(([_, value]) => value !== null));
      chrome.storage.local.set({ toolConfig: config }, loadTools);
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
      <button class="remove-url-btn"><i class="fa-plus"></i>Remove URL</button>
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
            console.log('Local storage reset to default.');
            loadTools();
          });
        })
        .catch(error => console.error('Error loading default config:', error));
    });
  };

  const saveTool = () => {
    const toolName = document.getElementById('toolName').value.trim();
    const toolMode = document.getElementById('toolMode').value;
    const urlEntries = document.querySelectorAll('.url-entry');

    if (!toolName) {
      alert('Tool name is required.');
      return;
    }

    const urls = Array.from(urlEntries).map(entry => ({
      name: entry.querySelector('.url-name').value.trim(),
      link: entry.querySelector('.url-link').value.trim()
    })).filter(url => url.name && url.link);

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
        console.log(`Creating new tool with key: ${newToolKey}`);
        config.tools = { ...config.tools, [newToolKey]: toolData };  // Merge new tool without overwriting others
      }

      chrome.storage.local.set({ toolConfig: config }, () => {
        console.log('Tool saved successfully.');
        loadTools();
        closeModal();
      });
    });
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

  // Initial Load
  loadTools();
});
