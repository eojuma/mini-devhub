// ========================================
// STATE MANAGEMENT (Array to store resources)
// ========================================

// State array - this is where all our resources live
// Think of this as the "source of truth" for our application
let resourcesState = [];

// ========================================
// DOM ELEMENTS (Cache frequently used elements)
// ========================================

// Get references to HTML elements so we don't have to query them every time
const form = document.getElementById('resourceForm');
const titleInput = document.getElementById('title');
const linkInput = document.getElementById('link');
const fileInput = document.getElementById('fileUpload');
const categorySelect = document.getElementById('category');
const filterCategorySelect = document.getElementById('filterCategory');
const searchInput = document.getElementById('searchInput');
const resourcesContainer = document.getElementById('resourcesContainer');

// Get all radio buttons for difficulty
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');

// ========================================
// INITIALIZATION (Load saved data on page load)
// ========================================

// This runs when the page first loads
function init() {
    // Try to load existing resources from localStorage
    loadFromLocalStorage();
    
    // Populate the category filter dropdown
    populateCategoryFilter();
    
    // Render the UI with current state
    render();
    
    // Set up event listeners
    setupEventListeners();
}

// ========================================
// EVENT LISTENERS (Form submission, filters, etc.)
// ========================================

function setupEventListeners() {
    // Form submit listener - prevents default browser behavior
    form.addEventListener('submit', handleFormSubmit);
    
    // Filter listeners
    filterCategorySelect.addEventListener('change', handleFilterChange);
    searchInput.addEventListener('input', handleFilterChange);
}

// ========================================
// FORM HANDLER (Prevent default, create object, push to array)
// ========================================

function handleFormSubmit(event) {
    // PREVENT DEFAULT: Stops the page from refreshing
    // This is crucial for single-page app behavior
    event.preventDefault();
    
    // Get the selected difficulty value from radio buttons
    let selectedDifficulty = 'Beginner'; // Default value
    for (let i = 0; i < difficultyRadios.length; i++) {
        if (difficultyRadios[i].checked) {
            selectedDifficulty = difficultyRadios[i].value;
            break; // Exit loop once found
        }
    }
    
    // CREATE OBJECT: Build a new resource object
    // This is a JavaScript object with key-value pairs
    const newResource = {
        id: Date.now(),                    // Unique ID using timestamp
        title: titleInput.value,           // From title input
        link: linkInput.value,              // From URL input
        category: categorySelect.value,    // From category dropdown
        difficulty: selectedDifficulty,    // From radio buttons
        createdAt: new Date().toISOString(), // Current timestamp
        fileData: null                     // Will be set if file uploaded
    };
    
    // Check if a file was uploaded
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // FileReader is async - needs to wait for file to be read
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Add file data to the resource object
            newResource.fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result  // Base64 encoded file content
            };
            
            // PUSH TO ARRAY: Add the new resource to our state array
            resourcesState.push(newResource);
            
            // Save to localStorage for persistence
            saveToLocalStorage();
            
            // RENDER: Update the UI
            render();
            
            // Reset the form
            resetForm();
        };
        
        reader.readAsDataURL(file); // Convert file to Base64
    } else {
        // No file, just push the resource
        resourcesState.push(newResource);
        saveToLocalStorage();
        render();
        resetForm();
    }
}

// ========================================
// RESET FORM (Clear all inputs after submission)
// ========================================

function resetForm() {
    form.reset(); // Built-in form reset method
    
    // Manually reset radio button to default (form.reset doesn't always work)
    difficultyRadios[0].checked = true;
}

// ========================================
// FILTER HANDLER (Respond to filter changes)
// ========================================

function handleFilterChange() {
    // Re-render with new filter values
    render();
}

// ========================================
// RENDER FUNCTION (DOM creation - most important!)
// ========================================

function render() {
    // STEP 1: Get filter values
    const selectedCategory = filterCategorySelect.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    // STEP 2: FILTER the state array (LOOP concept)
    // This uses the filter() method - a modern array loop
    let filteredResources = resourcesState;
    
    // Filter by category (if not 'all')
    if (selectedCategory !== 'all') {
        filteredResources = filteredResources.filter(function(resource) {
            return resource.category === selectedCategory;
        });
    }
    
    // Filter by search term (if not empty)
    if (searchTerm !== '') {
        filteredResources = filteredResources.filter(function(resource) {
            return resource.title.toLowerCase().includes(searchTerm);
        });
    }
    
    // STEP 3: Clear the container (remove all existing DOM elements)
    // This is a classic pattern: clear and rebuild
    resourcesContainer.innerHTML = '';
    
    // STEP 4: Check if we have any resources to display
    if (filteredResources.length === 0) {
        // Show empty state message
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = '<p>📚 No resources yet. Add your first resource above!</p>';
        resourcesContainer.appendChild(emptyDiv);
        return;
    }
    
    // STEP 5: LOOP through the filtered array and create DOM elements
    // TRADITIONAL FOR LOOP (great for learning)
    for (let i = 0; i < filteredResources.length; i++) {
        const resource = filteredResources[i];
        
        // Create card container
        const card = document.createElement('div');
        card.className = 'resource-card';
        
        // Create title element
        const title = document.createElement('h3');
        title.textContent = resource.title;
        
        // Create category element
        const categorySpan = document.createElement('span');
        categorySpan.className = 'category';
        categorySpan.textContent = `📁 ${resource.category} | ⭐ ${resource.difficulty}`;
        
        // Append title and category to card
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
            
            // Create closure to capture resource ID
            // This is a common pattern for event handlers in loops
            (function(resourceId) {
                downloadBtn.onclick = function() {
                    downloadFile(resourceId);
                };
            })(resource.id);
            
            fileDiv.appendChild(fileName);
            fileDiv.appendChild(downloadBtn);
            card.appendChild(fileDiv);
        }
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️ Remove';
        
        // Add click handler for delete
        (function(resourceId) {
            deleteBtn.onclick = function() {
                deleteResource(resourceId);
            };
        })(resource.id);
        
        card.appendChild(deleteBtn);
        
        // Finally, add the card to the container
        resourcesContainer.appendChild(card);
    }
    
    // Alternative: FOR...OF LOOP (modern, cleaner syntax)
    // for (const resource of filteredResources) {
    //     // Same DOM creation logic
    // }
    
    // Alternative: FOREACH LOOP (functional programming style)
    // filteredResources.forEach(function(resource) {
    //     // Same DOM creation logic
    // });
}

// ========================================
// POPULATE CATEGORY FILTER (Dynamic dropdown)
// ========================================

function populateCategoryFilter() {
    // Use Set to get unique categories (Set automatically removes duplicates)
    const categoriesSet = new Set();
    
    // LOOP through resources to collect all categories
    for (let i = 0; i < resourcesState.length; i++) {
        categoriesSet.add(resourcesState[i].category);
    }
    
    // Convert Set back to Array and sort alphabetically
    const categories = Array.from(categoriesSet).sort();
    
    // Clear existing options (keep the "All Categories" option)
    filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    // Add each category as an option
    for (let i = 0; i < categories.length; i++) {
        const option = document.createElement('option');
        option.value = categories[i];
        option.textContent = categories[i];
        filterCategorySelect.appendChild(option);
    }
}

// ========================================
// DELETE RESOURCE (Remove from array and re-render)
// ========================================

function deleteResource(id) {
    // FILTER METHOD: Create new array without the deleted item
    // This is a common pattern - filter out the item we don't want
    const newState = resourcesState.filter(function(resource) {
        return resource.id !== id;
    });
    
    // Replace the old array with the new one
    resourcesState = newState;
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update the category filter dropdown
    populateCategoryFilter();
    
    // Re-render the UI
    render();
}

// ========================================
// DOWNLOAD FILE (Extract and download from stored file)
// ========================================

function downloadFile(id) {
    // FIND METHOD: Find the resource with matching ID
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
// LOCAL STORAGE (Persist data across page reloads)
// ========================================

function saveToLocalStorage() {
    // localStorage only stores strings, so we need to stringify our array
    const jsonString = JSON.stringify(resourcesState);
    localStorage.setItem('devhub_resources', jsonString);
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('devhub_resources');
    
    if (savedData) {
        // Parse the JSON string back into an array of objects
        resourcesState = JSON.parse(savedData);
    } else {
        // Initialize with some sample data for demonstration
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

// Initialize everything when the page loads
init();