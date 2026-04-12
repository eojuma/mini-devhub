// ========================================
// STATE MANAGEMENT (Array to store resources)
// ========================================

// State array - this is where all our resources live
let resourcesState = [];

// Track if we're editing an existing resource
let editingResourceId = null;

// ========================================
// DOM ELEMENTS
// ========================================

const form = document.getElementById('resourceForm');
const titleInput = document.getElementById('title');
const linkInput = document.getElementById('link');
const fileInput = document.getElementById('fileUpload');
const categorySelect = document.getElementById('category');
const filterCategorySelect = document.getElementById('filterCategory');
const searchInput = document.getElementById('searchInput');
const resourcesContainer = document.getElementById('resourcesContainer');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const formSubmitButton = document.querySelector('#resourceForm button');

// ========================================
// INITIALIZATION
// ========================================

function init() {
    loadFromLocalStorage();
    populateCategoryFilter();
    render();
    setupEventListeners();
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    filterCategorySelect.addEventListener('change', handleFilterChange);
    searchInput.addEventListener('input', handleFilterChange);
}

// ========================================
// FORM HANDLER (Create & Update)
// ========================================

function handleFormSubmit(event) {
    event.preventDefault();
    
    let selectedDifficulty = 'Beginner';
    for (let i = 0; i < difficultyRadios.length; i++) {
        if (difficultyRadios[i].checked) {
            selectedDifficulty = difficultyRadios[i].value;
            break;
        }
    }
    
    const newResource = {
        id: editingResourceId || Date.now(), // Use existing ID if editing
        title: titleInput.value,
        link: linkInput.value,
        category: categorySelect.value,
        difficulty: selectedDifficulty,
        updatedAt: new Date().toISOString(),
        fileData: null
    };
    
    // Keep original createdAt if editing, otherwise add new
    if (!editingResourceId) {
        newResource.createdAt = new Date().toISOString();
    } else {
        // Find original resource to preserve createdAt
        const original = resourcesState.find(r => r.id === editingResourceId);
        if (original) {
            newResource.createdAt = original.createdAt;
            // Keep existing file if no new file is uploaded
            if (fileInput.files.length === 0 && original.fileData) {
                newResource.fileData = original.fileData;
            }
        }
    }
    
    // Handle file upload
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            newResource.fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            };
            saveOrUpdateResource(newResource);
        };
        
        reader.readAsDataURL(file);
    } else {
        saveOrUpdateResource(newResource);
    }
}

function saveOrUpdateResource(resource) {
    if (editingResourceId) {
        // UPDATE: Replace the existing resource
        const index = resourcesState.findIndex(r => r.id === editingResourceId);
        if (index !== -1) {
            resourcesState[index] = resource;
        }
        editingResourceId = null;
        formSubmitButton.textContent = 'Add Resource'; // Reset button text
    } else {
        // CREATE: Add new resource
        resourcesState.push(resource);
    }
    
    saveToLocalStorage();
    render();
    resetForm();
}

// ========================================
// EDIT RESOURCE (Load resource data into form)
// ========================================

function editResource(id) {
    const resource = resourcesState.find(r => r.id === id);
    if (!resource) return;
    
    // Set editing mode
    editingResourceId = id;
    
    // Fill form with existing data
    titleInput.value = resource.title;
    linkInput.value = resource.link || '';
    categorySelect.value = resource.category;
    
    // Set difficulty radio button
    for (let i = 0; i < difficultyRadios.length; i++) {
        if (difficultyRadios[i].value === resource.difficulty) {
            difficultyRadios[i].checked = true;
            break;
        }
    }
    
    // Clear file input (user can optionally upload a new file)
    fileInput.value = '';
    
    // Change button text to indicate edit mode
    formSubmitButton.textContent = 'Update Resource';
    
    // Scroll to form
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// RESET FORM
// ========================================

function resetForm() {
    form.reset();
    difficultyRadios[0].checked = true;
    editingResourceId = null;
    formSubmitButton.textContent = 'Add Resource';
}

// ========================================
// FILTER HANDLER
// ========================================

function handleFilterChange() {
    render();
}

// ========================================
// RENDER FUNCTION (with Edit button)
// ========================================

function render() {
    const selectedCategory = filterCategorySelect.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    let filteredResources = resourcesState;
    
    if (selectedCategory !== 'all') {
        filteredResources = filteredResources.filter(function(resource) {
            return resource.category === selectedCategory;
        });
    }
    
    if (searchTerm !== '') {
        filteredResources = filteredResources.filter(function(resource) {
            return resource.title.toLowerCase().includes(searchTerm);
        });
    }
    
    resourcesContainer.innerHTML = '';
    
    if (filteredResources.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = '<p>📚 No resources yet. Add your first resource above!</p>';
        resourcesContainer.appendChild(emptyDiv);
        return;
    }
    
    for (let i = 0; i < filteredResources.length; i++) {
        const resource = filteredResources[i];
        
        const card = document.createElement('div');
        card.className = 'resource-card';
        
        const title = document.createElement('h3');
        title.textContent = resource.title;
        
        const categorySpan = document.createElement('span');
        categorySpan.className = 'category';
        categorySpan.textContent = `📁 ${resource.category} | ⭐ ${resource.difficulty}`;
        
        card.appendChild(title);
        card.appendChild(categorySpan);
        
        // Add link button if URL exists
        if (resource.link && resource.link !== '') {
            const linkBtn = document.createElement('a');
            linkBtn.href = resource.link;
            linkBtn.target = '_blank';
            linkBtn.textContent = '🔗 Open Link';
            card.appendChild(linkBtn);
        }
        
        // Add file info if file exists
        if (resource.fileData && resource.fileData.data) {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-info';
            
            const fileName = document.createElement('span');
            fileName.textContent = `📄 ${resource.fileData.name}`;
            
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = '⬇️ Download';
            
            (function(resourceId) {
                downloadBtn.onclick = function() {
                    downloadFile(resourceId);
                };
            })(resource.id);
            
            fileDiv.appendChild(fileName);
            fileDiv.appendChild(downloadBtn);
            card.appendChild(fileDiv);
        }
        
        // EDIT BUTTON (NEW)
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '✏️ Edit';
        (function(resourceId) {
            editBtn.onclick = function() {
                editResource(resourceId);
            };
        })(resource.id);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️ Remove';
        
        (function(resourceId) {
            deleteBtn.onclick = function() {
                deleteResource(resourceId);
            };
        })(resource.id);
        
        card.appendChild(editBtn);
        card.appendChild(deleteBtn);
        
        resourcesContainer.appendChild(card);
    }
}

// ========================================
// POPULATE CATEGORY FILTER
// ========================================

function populateCategoryFilter() {
    const categoriesSet = new Set();
    
    for (let i = 0; i < resourcesState.length; i++) {
        categoriesSet.add(resourcesState[i].category);
    }
    
    const categories = Array.from(categoriesSet).sort();
    
    filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    for (let i = 0; i < categories.length; i++) {
        const option = document.createElement('option');
        option.value = categories[i];
        option.textContent = categories[i];
        filterCategorySelect.appendChild(option);
    }
}

// ========================================
// DELETE RESOURCE
// ========================================

function deleteResource(id) {
    if (confirm('Are you sure you want to delete this resource?')) {
        const newState = resourcesState.filter(function(resource) {
            return resource.id !== id;
        });
        
        resourcesState = newState;
        saveToLocalStorage();
        populateCategoryFilter();
        render();
        
        // If we were editing this resource, cancel edit mode
        if (editingResourceId === id) {
            resetForm();
        }
    }
}

// ========================================
// DOWNLOAD FILE
// ========================================

function downloadFile(id) {
    const resource = resourcesState.find(function(res) {
        return res.id === id;
    });
    
    if (resource && resource.fileData && resource.fileData.data) {
        const link = document.createElement('a');
        link.href = resource.fileData.data;
        link.download = resource.fileData.name;
        link.click();
    }
}

// ========================================
// LOCAL STORAGE
// ========================================

function saveToLocalStorage() {
    const jsonString = JSON.stringify(resourcesState);
    localStorage.setItem('devhub_resources', jsonString);
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('devhub_resources');
    
    if (savedData) {
        resourcesState = JSON.parse(savedData);
    } else {
        resourcesState = [
            {
                id: 1,
                title: "MDN Web Docs",
                link: "https://developer.mozilla.org",
                category: "HTML",
                difficulty: "Beginner",
                createdAt: new Date().toISOString(),
                fileData: null
            },
            {
                id: 2,
                title: "JavaScript.info",
                link: "https://javascript.info",
                category: "JavaScript",
                difficulty: "Intermediate",
                createdAt: new Date().toISOString(),
                fileData: null
            }
        ];
        saveToLocalStorage();
    }
}

// ========================================
// START THE APPLICATION
// ========================================

init();