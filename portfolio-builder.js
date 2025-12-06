// ============================================================================
// UTILITY CLASSES - Enhancement Features
// ============================================================================

// Date Formatter - Handles MM/DD/YYYY format with optional day
const DateFormatter = {
    parse(dateString) {
        if (!dateString) return { month: '', day: '', year: '' };

        const parts = dateString.split('/');
        if (parts.length === 2) {
            // MM/YYYY format (no day)
            return { month: parts[0], day: '', year: parts[1] };
        } else if (parts.length === 3) {
            // MM/DD/YYYY format
            return { month: parts[0], day: parts[1], year: parts[2] };
        }
        return { month: '', day: '', year: '' };
    },

    format(dateString) {
        if (!dateString) return '';

        const { month, day, year } = this.parse(dateString);
        if (!month || !year) return '';

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(month) - 1;
        const monthName = monthNames[monthIndex] || '';

        if (day) {
            return `${monthName} ${parseInt(day)} ${year}`;
        } else {
            return `${monthName} ${year}`;
        }
    },

    build(year, month, day) {
        if (!year || !month) return '';

        // Pad with zeros
        const mm = month.padStart(2, '0');
        const dd = day ? day.padStart(2, '0') : '';

        if (dd) {
            return `${mm}/${dd}/${year}`;
        } else {
            return `${mm}/${year}`;
        }
    }
};

// Scroll Animator - Handles fade-in animations on scroll
const ScrollAnimator = {
    observer: null,

    init() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    },

    observe(elements) {
        if (!this.observer) this.init();
        elements.forEach(el => {
            el.classList.remove('animate-fade-in');
            this.observer.observe(el);
        });
    }
};

// Rich Text Editor - Handles text formatting with toolbar
const RichTextEditor = {
    createToolbar() {
        return `
            <div class="rich-text-toolbar">
                <button type="button" class="toolbar-btn" data-command="bold" title="Bold">
                    <i data-lucide="bold"></i>
                </button>
                <button type="button" class="toolbar-btn" data-command="italic" title="Italic">
                    <i data-lucide="italic"></i>
                </button>
                <button type="button" class="toolbar-btn" data-command="underline" title="Underline">
                    <i data-lucide="underline"></i>
                </button>
                <span class="toolbar-separator"></span>
                <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
                    <i data-lucide="list"></i>
                </button>
                <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
                    <i data-lucide="list-ordered"></i>
                </button>
                <span class="toolbar-separator"></span>
                <button type="button" class="toolbar-btn" data-command="link" title="Insert Link">
                    <i data-lucide="link"></i>
                </button>
            </div>
        `;
    },

    init(element, onChange) {
        element.contentEditable = true;
        element.addEventListener('input', () => {
            onChange(element.innerHTML);
        });
        element.addEventListener('blur', () => {
            onChange(element.innerHTML);
        });
    },

    execCommand(command) {
        document.execCommand(command, false, null);
    },

    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    }
};

// Image Uploader - Handles file upload and preview
const ImageUploader = {
    async handleFile(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('Please select an image file'));
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('Image size must be less than 5MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    },

    createUploadArea(fieldId, currentImage) {
        if (currentImage) {
            return `
                <div class="image-upload-area has-image">
                    <img src="${currentImage}" alt="Preview" class="image-preview" />
                    <div class="image-overlay">
                        <button type="button" class="btn-change-image">
                            <i data-lucide="upload"></i>
                            <span>Change</span>
                        </button>
                        <button type="button" class="btn-remove-image">
                            <i data-lucide="trash-2"></i>
                            <span>Remove</span>
                        </button>
                    </div>
                    <input type="file" class="image-file-input" accept="image/*" style="display: none;" />
                </div>
            `;
        } else {
            return `
                <div class="image-upload-area">
                    <div class="upload-placeholder">
                        <i data-lucide="upload-cloud"></i>
                        <p>Click to upload or drag and drop</p>
                        <span class="upload-hint">PNG, JPG, GIF up to 5MB</span>
                    </div>
                    <input type="file" class="image-file-input" accept="image/*" style="display: none;" />
                </div>
            `;
        }
    }
};

// Drag and Drop Manager - Handles component drag and drop
const DragDropManager = {
    draggedElement: null,
    draggedData: null,
    placeholder: null,
    autoScrollInterval: null,

    init() {
        this.createPlaceholder();
    },

    createPlaceholder() {
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'drag-placeholder';
        this.placeholder.innerHTML = '<div class="placeholder-line"></div>';
    },

    handlePaletteDragStart(e, componentType, defaultContent) {
        this.draggedData = {
            type: 'palette',
            componentType: componentType,
            defaultContent: defaultContent
        };
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', componentType);
    },

    handleComponentDragStart(e, componentId, index) {
        this.draggedElement = e.target.closest('.component-wrapper');
        this.draggedData = {
            type: 'component',
            componentId: componentId,
            index: index
        };

        this.draggedElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', componentId);
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = this.draggedData?.type === 'palette' ? 'copy' : 'move';

        const preview = document.getElementById('portfolioPreview');
        const afterElement = this.getDragAfterElement(preview, e.clientY);

        if (afterElement == null) {
            preview.appendChild(this.placeholder);
        } else {
            preview.insertBefore(this.placeholder, afterElement);
        }

        // Auto-scroll
        this.handleAutoScroll(e, preview);
    },

    handleDrop(e, callback) {
        e.preventDefault();

        if (this.placeholder.parentNode) {
            this.placeholder.remove();
        }

        const dropIndex = this.getDropIndex();

        if (this.draggedData && callback) {
            callback(this.draggedData, dropIndex);
        }

        this.handleDragEnd();
    },

    handleDragEnd() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }

        if (this.placeholder.parentNode) {
            this.placeholder.remove();
        }

        this.clearAutoScroll();
        this.draggedData = null;
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.component-wrapper:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    getDropIndex() {
        const preview = document.getElementById('portfolioPreview');
        const children = [...preview.children];
        const placeholderIndex = children.indexOf(this.placeholder);
        return placeholderIndex >= 0 ? placeholderIndex : children.length;
    },

    handleAutoScroll(e, container) {
        const scrollZone = 50;
        const scrollSpeed = 5;
        const rect = container.getBoundingClientRect();

        this.clearAutoScroll();

        if (e.clientY < rect.top + scrollZone) {
            this.autoScrollInterval = setInterval(() => {
                container.scrollTop -= scrollSpeed;
            }, 16);
        } else if (e.clientY > rect.bottom - scrollZone) {
            this.autoScrollInterval = setInterval(() => {
                container.scrollTop += scrollSpeed;
            }, 16);
        }
    },

    clearAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    }
};

// Project Detail Modal - Shows expanded project details
const ProjectDetailModal = {
    show(project, onRender) {
        const modal = document.createElement('div');
        modal.className = 'project-detail-modal';
        modal.innerHTML = this.createModalContent(project);

        document.body.appendChild(modal);

        // Close handlers
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        const close = () => {
            modal.classList.add('closing');
            setTimeout(() => modal.remove(), 300);
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', close);

        // Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Trigger animation
        setTimeout(() => modal.classList.add('active'), 10);

        if (onRender) onRender();
    },

    createModalContent(project) {
        const { title, description, image, tags, role, timeline,
            fullDescription, challenges, outcomes, additionalImages, detailsLink } = project.content;

        const allImages = [image, ...(additionalImages || [])].filter(img => img);

        return `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close">
                    <i data-lucide="x"></i>
                </button>
                
                <div class="modal-header">
                    <h2>${this.escapeHtml(title)}</h2>
                    ${tags && tags.length > 0 ? `
                        <div class="modal-tags">
                            ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                ${allImages.length > 0 ? `
                    <div class="modal-gallery">
                        ${allImages.map(img => `
                            <img src="${this.escapeHtml(img)}" alt="${this.escapeHtml(title)}" />
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="modal-body">
                    ${role || timeline ? `
                        <div class="modal-meta">
                            ${role ? `<div class="meta-item"><strong>Role:</strong> ${this.escapeHtml(role)}</div>` : ''}
                            ${timeline ? `<div class="meta-item"><strong>Timeline:</strong> ${this.escapeHtml(timeline)}</div>` : ''}
                        </div>
                    ` : ''}
                    
                    ${fullDescription ? `
                        <div class="modal-section">
                            <h3>About This Project</h3>
                            <div class="modal-text">${fullDescription}</div>
                        </div>
                    ` : `
                        <div class="modal-section">
                            <div class="modal-text">${this.escapeHtml(description)}</div>
                        </div>
                    `}
                    
                    ${challenges ? `
                        <div class="modal-section">
                            <h3>Challenges</h3>
                            <div class="modal-text">${challenges}</div>
                        </div>
                    ` : ''}
                    
                    ${outcomes ? `
                        <div class="modal-section">
                            <h3>Outcomes & Impact</h3>
                            <div class="modal-text">${outcomes}</div>
                        </div>
                    ` : ''}
                    
                    ${detailsLink ? `
                        <div class="modal-actions">
                            <a href="${this.escapeHtml(detailsLink)}" target="_blank" class="btn-primary">
                                View Live Project
                                <i data-lucide="external-link"></i>
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const PortfolioBuilder = {
    // Current state
    selectedTemplate: null,
    portfolioData: null,
    isPreviewMode: false,
    selectedComponentId: null,
    showPalette: false,

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.initializeLucideIcons();
        DragDropManager.init();
        ScrollAnimator.init();

        // Store referrer for back navigation
        const referrer = document.referrer;
        if (referrer && referrer.includes(window.location.origin)) {
            sessionStorage.setItem('portfolioBuilderReferrer', referrer);
        }

        // Check if editing existing portfolio
        this.checkForExistingPortfolio();
    },

    // Check URL for portfolio ID and load if present
    async checkForExistingPortfolio() {
        const urlParams = new URLSearchParams(window.location.search);
        const portfolioId = urlParams.get('id');
        const templateParam = urlParams.get('template');

        if (portfolioId) {
            await this.loadExistingPortfolio(portfolioId);
        } else if (templateParam) {
            // Auto-select template from URL parameter
            this.selectTemplate(templateParam);
        }
    },

    // Load existing portfolio by ID
    async loadExistingPortfolio(portfolioId) {
        try {
            const response = await fetch(`/api/portfolio/${portfolioId}`);

            if (!response.ok) {
                throw new Error('Failed to load portfolio');
            }

            const portfolio = await response.json();

            // Set up portfolio data with ID for updates
            this.portfolioData = {
                id: portfolio.id,
                name: portfolio.name,
                template: portfolio.template,
                components: portfolio.components
            };

            this.selectedTemplate = portfolio.template;

            // Hide template selector, show builder
            document.getElementById('templateSelector').style.display = 'none';
            document.getElementById('portfolioBuilder').style.display = 'flex';

            // Update template label
            document.getElementById('templateLabel').textContent = `(${portfolio.template} template)`;

            // Hide navbar and adjust layout
            document.body.classList.add('builder-mode');

            // Auto-collapse sidebar
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('is-collapsed')) {
                sidebar.classList.add('is-collapsed');
                document.body.classList.add('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'true');
            }

            // Initialize builder
            this.renderComponentPalette();
            this.renderPortfolio();
            this.initializeLucideIcons();

        } catch (error) {
            console.error('Error loading portfolio:', error);
            alert('Failed to load portfolio. Please try again or create a new one.');
            window.location.href = 'my-portfolios.html';
        }
    },

    // Setup all event listeners
    setupEventListeners() {
        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const template = e.currentTarget.dataset.template;
                this.selectTemplate(template);
            });
        });

        // Builder controls
        document.getElementById('backButton')?.addEventListener('click', () => this.goBack());
        document.getElementById('addComponentButton')?.addEventListener('click', () => this.togglePalette());
        document.getElementById('previewToggle')?.addEventListener('click', () => this.togglePreview());
        document.getElementById('saveButton')?.addEventListener('click', () => this.showSaveModal());
        document.getElementById('closePalette')?.addEventListener('click', () => this.togglePalette());
        document.getElementById('closeEditor')?.addEventListener('click', () => this.closeEditor());
        document.getElementById('deleteComponent')?.addEventListener('click', () => this.deleteSelectedComponent());

        // Save modal controls
        document.getElementById('closeSaveModal')?.addEventListener('click', () => this.hideSaveModal());
        document.getElementById('cancelSave')?.addEventListener('click', () => this.hideSaveModal());
        document.getElementById('confirmSave')?.addEventListener('click', () => this.savePortfolio());

        // Allow Enter key to save in modal
        document.getElementById('portfolioName')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.savePortfolio();
            }
        });
    },

    // Initialize Lucide icons
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    // ============================================================================
    // TEMPLATE SELECTION
    // ============================================================================

    selectTemplate(template) {
        this.selectedTemplate = template;
        this.portfolioData = {
            id: this.portfolioData?.id, // Preserve ID if editing
            name: this.portfolioData?.name || '',
            template: template,
            components: this.getDefaultComponents(template)
        };

        // Hide template selector, show builder
        document.getElementById('templateSelector').style.display = 'none';
        document.getElementById('portfolioBuilder').style.display = 'flex';

        // Update template label
        document.getElementById('templateLabel').textContent = `(${template} template)`;

        // Open palette by default
        this.showPalette = true;
        document.getElementById('componentPalette').style.display = 'flex';

        // Hide navbar and adjust layout
        document.body.classList.add('builder-mode');

        // Auto-collapse sidebar after template selection for more workspace
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('is-collapsed')) {
            sidebar.classList.add('is-collapsed');
            document.body.classList.add('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', 'true');
        }

        // Initialize builder
        this.renderComponentPalette();
        this.renderPortfolio();
        this.initializeLucideIcons();
    },

    goBack() {
        // If editing an existing portfolio and came from another page, go back to that page
        if (this.portfolioData?.id) {
            const referrer = sessionStorage.getItem('portfolioBuilderReferrer');
            if (referrer && (referrer.includes('my-portfolios.html') || referrer.includes('dashboard.html'))) {
                sessionStorage.removeItem('portfolioBuilderReferrer');
                window.location.href = referrer;
                return;
            }
        }

        // Otherwise, go back to template selection
        this.selectedTemplate = null;
        this.portfolioData = null;
        this.selectedComponentId = null;

        document.getElementById('portfolioBuilder').style.display = 'none';
        document.getElementById('templateSelector').style.display = 'block';

        // Show navbar again
        document.body.classList.remove('builder-mode');

        this.initializeLucideIcons();
    },

    // ============================================================================
    // DEFAULT COMPONENT DATA
    // ============================================================================

    getDefaultComponents(template) {
        if (template === 'minimal') {
            return [
                {
                    id: '1',
                    type: 'hero',
                    content: {
                        name: 'Alex Morgan',
                        title: 'Full Stack Developer',
                        bio: 'Building elegant solutions to complex problems. Specialized in React, Node.js, and cloud technologies.'
                    }
                },
                {
                    id: '2',
                    type: 'about',
                    content: {
                        heading: 'About Me',
                        text: 'I\'m a passionate developer with 5+ years of experience in web development. I love creating user-friendly applications that solve real-world problems.'
                    }
                },
                {
                    id: '3',
                    type: 'header',
                    content: { text: 'Projects' }
                },
                {
                    id: '4',
                    type: 'project',
                    content: {
                        title: 'E-Commerce Platform',
                        description: 'A full-featured e-commerce platform built with React and Node.js. Features include real-time inventory management, payment processing, and analytics dashboard.',
                        tags: ['React', 'Node.js', 'MongoDB', 'Stripe'],
                        image: 'https://images.unsplash.com/photo-1660810731526-0720827cbd38?w=800',
                        detailsLink: ''
                    }
                },
                {
                    id: '5',
                    type: 'project',
                    content: {
                        title: 'Task Management App',
                        description: 'A collaborative task management application with real-time updates, team collaboration features, and integrations with popular productivity tools.',
                        tags: ['Vue.js', 'Express', 'Socket.io', 'Redis'],
                        image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
                        detailsLink: ''
                    }
                },
                {
                    id: '6',
                    type: 'header',
                    content: { text: 'Experience' }
                },
                {
                    id: '7',
                    type: 'experience',
                    content: {
                        company: 'Tech Solutions Inc.',
                        position: 'Senior Full Stack Developer',
                        startDate: '06/2021',
                        endDate: '',
                        current: true,
                        description: 'Lead development of microservices architecture. Mentor junior developers and conduct code reviews. Implemented CI/CD pipelines and improved deployment processes.'
                    }
                },
                {
                    id: '8',
                    type: 'experience',
                    content: {
                        company: 'StartUp Ventures',
                        position: 'Full Stack Developer',
                        startDate: '03/2019',
                        endDate: '05/2021',
                        current: false,
                        description: 'Developed and maintained multiple client-facing web applications. Collaborated with designers and product managers to deliver high-quality features on tight deadlines.'
                    }
                }
            ];
        } else if (template === 'modern') {
            return [
                {
                    id: '1',
                    type: 'hero',
                    content: {
                        name: 'Jordan Lee',
                        title: 'Creative Developer & Designer',
                        bio: 'Crafting beautiful digital experiences at the intersection of design and technology.'
                    }
                },
                {
                    id: '2',
                    type: 'header',
                    content: { text: 'Featured Projects' }
                },
                {
                    id: '3',
                    type: 'project',
                    content: {
                        title: 'SaaS Analytics Dashboard',
                        description: 'A comprehensive analytics platform for SaaS companies with real-time metrics, customizable reports, and data visualization. Handles millions of events per day with sub-second query performance.',
                        tags: ['React', 'Next.js', 'Tailwind CSS', 'PostgreSQL'],
                        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
                        detailsLink: ''
                    }
                },
                {
                    id: '4',
                    type: 'project',
                    content: {
                        title: 'Brand Identity Platform',
                        description: 'A comprehensive design system and brand management platform for enterprise clients. Streamlines the design-to-development workflow with automated asset generation.',
                        tags: ['TypeScript', 'React', 'Figma API', 'AWS'],
                        image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',
                        detailsLink: ''
                    }
                },
                {
                    id: '5',
                    type: 'header',
                    content: { text: 'Experience' }
                },
                {
                    id: '6',
                    type: 'experience',
                    content: {
                        company: 'Creative Digital Studio',
                        position: 'Lead Creative Developer',
                        startDate: '01/2022',
                        endDate: '',
                        current: true,
                        description: 'Leading a team of developers and designers to create award-winning digital experiences for Fortune 500 clients. Focus on innovative web technologies and user-centered design.'
                    }
                },
                {
                    id: '7',
                    type: 'experience',
                    content: {
                        company: 'Design Lab Agency',
                        position: 'Front-End Developer',
                        startDate: '02/2020',
                        endDate: '12/2021',
                        current: false,
                        description: 'Built responsive websites and web applications for various clients. Collaborated closely with design team to ensure pixel-perfect implementations and smooth animations.'
                    }
                },
                {
                    id: '8',
                    type: 'about',
                    content: {
                        heading: 'About Me',
                        text: 'I\'m a creative developer who loves bridging the gap between design and development. With a background in both visual design and software engineering, I create digital products that are both beautiful and functional.'
                    }
                }
            ];
        } else if (template === 'creative') {
            return [
                {
                    id: '1',
                    type: 'hero',
                    content: {
                        name: 'Sam Rivers',
                        title: 'Digital Artist & Developer',
                        bio: 'Creating unique digital experiences that blur the line between art and code.'
                    }
                },
                {
                    id: '2',
                    type: 'header',
                    content: { text: 'Portfolio' }
                },
                {
                    id: '3',
                    type: 'project',
                    content: {
                        title: 'Interactive Art Installation',
                        description: 'A web-based interactive art piece that responds to user input in real-time. Featured in multiple digital art exhibitions and garnered over 50,000 unique interactions.',
                        tags: ['Three.js', 'WebGL', 'Canvas API', 'GLSL'],
                        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
                        detailsLink: ''
                    }
                },
                {
                    id: '4',
                    type: 'project',
                    content: {
                        title: 'Generative Art Platform',
                        description: 'An algorithmic art platform that creates unique digital artwork using AI and procedural generation. Users can mint their creations as NFTs and explore endless creative possibilities.',
                        tags: ['p5.js', 'TensorFlow.js', 'Web3', 'Ethereum'],
                        image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800',
                        detailsLink: ''
                    }
                },
                {
                    id: '5',
                    type: 'header',
                    content: { text: 'Experience' }
                },
                {
                    id: '6',
                    type: 'experience',
                    content: {
                        company: 'Immersive Art Collective',
                        position: 'Creative Technologist',
                        startDate: '09/2021',
                        endDate: '',
                        current: true,
                        description: 'Creating cutting-edge digital art installations and interactive experiences. Combining creative coding, generative design, and emerging technologies to push the boundaries of digital art.'
                    }
                },
                {
                    id: '7',
                    type: 'experience',
                    content: {
                        company: 'Digital Studio X',
                        position: 'Interactive Developer',
                        startDate: '06/2019',
                        endDate: '08/2021',
                        current: false,
                        description: 'Developed interactive websites and digital experiences for brands and artists. Specialized in creative coding, WebGL, and experimental user interfaces.'
                    }
                }
            ];
        }
        return [];
    },

    // ============================================================================
    // COMPONENT PALETTE
    // ============================================================================

    componentTypes: [
        {
            type: 'hero',
            icon: 'user-circle',
            label: 'Title',
            description: 'Name, Title, and Bio',
            defaultContent: {
                name: 'Your Name',
                title: 'Your Title',
                bio: 'Write a brief bio about yourself...'
            }
        },
        {
            type: 'header',
            icon: 'heading',
            label: 'Header',
            description: 'Section heading',
            defaultContent: { text: 'New Section' }
        },
        {
            type: 'text',
            icon: 'type',
            label: 'Text Block',
            description: 'Paragraph or rich text',
            defaultContent: { text: 'Enter your text here...' }
        },
        {
            type: 'image',
            icon: 'image',
            label: 'Image',
            description: 'Single image with caption',
            defaultContent: { url: '', caption: '', width: 'full', alignment: 'center' }
        },
        {
            type: 'about',
            icon: 'user',
            label: 'About Section',
            description: 'Introduction and bio',
            defaultContent: { heading: 'About Me', text: 'Write about yourself...' }
        },
        {
            type: 'project',
            icon: 'folder-git-2',
            label: 'Project',
            description: 'Single project showcase',
            defaultContent: {
                title: 'Project Title',
                description: 'Project description',
                tags: [],
                image: '',
                additionalImages: []
            }
        },
        {
            type: 'certification',
            icon: 'award',
            label: 'Certification',
            description: 'Certificate or credential',
            defaultContent: {
                name: 'Certification Name',
                issuer: 'Issuing Organization',
                date: new Date().toISOString().split('T')[0],
                credentialLink: '',
                image: ''
            }
        },
        {
            type: 'experience',
            icon: 'briefcase',
            label: 'Work Experience',
            description: 'Job or internship',
            defaultContent: {
                company: 'Company Name',
                position: 'Position',
                startDate: '',
                endDate: '',
                description: 'Describe your role and achievements...',
                current: false
            }
        },
        {
            type: 'education',
            icon: 'graduation-cap',
            label: 'Education',
            description: 'School or degree',
            defaultContent: {
                school: 'School Name',
                degree: 'Bachelor of Science in Computer Science',
                startDate: '',
                endDate: '',
                description: 'Describe your studies and achievements...',
                current: false
            }
        },
        {
            type: 'divider',
            icon: 'minus',
            label: 'Divider Line',
            description: 'Section separator',
            defaultContent: {
                style: 'solid',
                thickness: 'medium',
                color: '#d1d5db'
            }
        }
    ],

    togglePalette() {
        this.showPalette = !this.showPalette;
        const palette = document.getElementById('componentPalette');
        palette.style.display = this.showPalette ? 'flex' : 'none';
    },

    renderComponentPalette() {
        const paletteContent = document.querySelector('.palette-content');
        paletteContent.innerHTML = this.componentTypes.map(item => `
      <button class="palette-item" data-component-type="${item.type}" draggable="true">
        <div class="palette-item-icon">
          <i data-lucide="${item.icon}"></i>
        </div>
        <div class="palette-item-content">
          <h3>${item.label}</h3>
          <p>${item.description}</p>
        </div>
        <div class="palette-item-action">
          <i data-lucide="plus-circle"></i>
        </div>
      </button>
    `).join('');

        // Add click listeners to palette items
        document.querySelectorAll('.palette-item').forEach(item => {
            const type = item.dataset.componentType;
            const componentTemplate = this.componentTypes.find(c => c.type === type);

            // Click to add
            item.addEventListener('click', (e) => {
                this.addComponent(type);
            });

            // Drag to add
            item.addEventListener('dragstart', (e) => {
                DragDropManager.handlePaletteDragStart(
                    e,
                    type,
                    componentTemplate.defaultContent
                );
            });
        });

        this.initializeLucideIcons();
    },

    // ============================================================================
    // COMPONENT MANAGEMENT
    // ============================================================================

    addComponent(type) {
        const componentTemplate = this.componentTypes.find(c => c.type === type);
        if (!componentTemplate) return;

        const newComponent = {
            id: Date.now().toString(),
            type: type,
            content: JSON.parse(JSON.stringify(componentTemplate.defaultContent))
        };

        this.portfolioData.components.push(newComponent);
        this.renderPortfolio();
    },

    addComponentAtIndex(type, index) {
        const componentTemplate = this.componentTypes.find(c => c.type === type);
        if (!componentTemplate) return;

        const newComponent = {
            id: Date.now().toString(),
            type: type,
            content: JSON.parse(JSON.stringify(componentTemplate.defaultContent))
        };

        // Insert at specific index
        this.portfolioData.components.splice(index, 0, newComponent);
        this.renderPortfolio();
    },

    updateComponent(id, content) {
        const component = this.portfolioData.components.find(c => c.id === id);
        if (component) {
            component.content = content;
            this.renderPortfolio();
        }
    },

    deleteSelectedComponent() {
        if (!this.selectedComponentId) return;

        this.portfolioData.components = this.portfolioData.components.filter(
            c => c.id !== this.selectedComponentId
        );
        this.selectedComponentId = null;
        this.closeEditor();
        this.renderPortfolio();
    },

    moveComponent(fromIndex, toIndex) {
        const components = this.portfolioData.components;
        const [movedComponent] = components.splice(fromIndex, 1);
        components.splice(toIndex, 0, movedComponent);
        this.renderPortfolio();
    },

    initializeImageUpload(container, component, field) {
        const currentImage = component.content[field] || '';
        container.innerHTML = ImageUploader.createUploadArea(null, currentImage);

        const fileInput = container.querySelector('.image-file-input');
        const uploadArea = container.querySelector('.image-upload-area');

        // Click to browse (for empty state)
        uploadArea.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-remove-image, .btn-change-image')) {
                fileInput.click();
            }
        });

        // Change button click
        const changeBtn = container.querySelector('.btn-change-image');
        if (changeBtn) {
            changeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        // File selection
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const dataUrl = await ImageUploader.handleFile(file);
                    const updatedContent = { ...component.content, [field]: dataUrl };
                    this.updateComponent(component.id, updatedContent);
                    this.renderEditor(component);
                } catch (error) {
                    alert(error.message);
                }
                fileInput.value = ''; // Reset input
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (file) {
                try {
                    const dataUrl = await ImageUploader.handleFile(file);
                    const updatedContent = { ...component.content, [field]: dataUrl };
                    this.updateComponent(component.id, updatedContent);
                    this.renderEditor(component);
                } catch (error) {
                    alert(error.message);
                }
            }
        });

        // Remove image
        const removeBtn = container.querySelector('.btn-remove-image');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const updatedContent = { ...component.content, [field]: '' };
                this.updateComponent(component.id, updatedContent);
                this.renderEditor(component);
            });
        }

        this.initializeLucideIcons();
    },

    initializeAdditionalImages(container, component) {
        const images = component.content.additionalImages || [];

        const render = () => {
            container.innerHTML = `
                <div class="additional-images-list">
                    ${images.map((img, index) => `
                        <div class="additional-image-item">
                            <div class="additional-image-preview">
                                <img src="${img}" alt="Additional ${index + 1}" class="additional-image-thumb" />
                            </div>
                            <button type="button" class="btn-remove-additional-image" data-index="${index}">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-add-additional-image">
                    <i data-lucide="plus"></i>
                    <span>Upload Image</span>
                    <input type="file" class="additional-image-file-input" accept="image/*" style="display: none;" />
                </button>
            `;

            // Remove image
            container.querySelectorAll('.btn-remove-additional-image').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    images.splice(index, 1);
                    const updatedContent = { ...component.content, additionalImages: images };
                    this.updateComponent(component.id, updatedContent);
                    render();
                });
            });

            // Add new image via upload
            const addBtn = container.querySelector('.btn-add-additional-image');
            const fileInput = container.querySelector('.additional-image-file-input');

            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                fileInput.click();
            });

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const dataUrl = await ImageUploader.handleFile(file);
                        images.push(dataUrl);
                        const updatedContent = { ...component.content, additionalImages: images };
                        this.updateComponent(component.id, updatedContent);
                        render();
                    } catch (error) {
                        alert(error.message);
                    }
                    fileInput.value = ''; // Reset input
                }
            });

            this.initializeLucideIcons();
        };

        render();
    },

    initializeDateInput(container, component, field, initialValue) {
        const parsed = DateFormatter.parse(initialValue);

        container.innerHTML = `
            <div class="date-input-group">
                <input type="text" class="date-input-field" data-part="month" 
                       placeholder="MM" maxlength="2" value="${parsed.month}" />
                <span class="date-separator">/</span>
                <input type="text" class="date-input-field optional" data-part="day" 
                       placeholder="DD" maxlength="2" value="${parsed.day}" />
                <span class="date-separator">/</span>
                <input type="text" class="date-input-field year" data-part="year" 
                       placeholder="YYYY" maxlength="4" value="${parsed.year}" />
            </div>
        `;

        const inputs = container.querySelectorAll('.date-input-field');
        const update = () => {
            const month = container.querySelector('[data-part="month"]').value;
            const day = container.querySelector('[data-part="day"]').value;
            const year = container.querySelector('[data-part="year"]').value;

            const dateStr = DateFormatter.build(year, month, day);
            const updatedContent = { ...component.content, [field]: dateStr };
            this.updateComponent(component.id, updatedContent);
        };

        inputs.forEach(input => {
            // Only allow numbers
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
                update();
            });

            // Auto-advance to next field
            input.addEventListener('input', (e) => {
                if (e.target.value.length === parseInt(e.target.maxLength)) {
                    const nextInput = e.target.parentElement.querySelector(
                        `input[data-part="${e.target.dataset.part}"] ~ input, input[data-part="${e.target.dataset.part}"] ~ span ~ input`
                    );
                    if (nextInput) nextInput.focus();
                }
            });
        });
    },    // ============================================================================
    // PORTFOLIO RENDERING
    // ============================================================================

    renderPortfolio() {
        const preview = document.getElementById('portfolioPreview');
        const template = this.selectedTemplate;

        preview.innerHTML = `
      <div class="portfolio-wrapper template-${template}">
        ${this.portfolioData.components.map((component, index) =>
            this.renderComponent(component, index)
        ).join('')}
      </div>
    `;

        // Add click listeners for edit mode
        if (!this.isPreviewMode) {
            // Add drop zone for drag and drop
            preview.addEventListener('dragover', (e) => {
                DragDropManager.handleDragOver(e);
            });

            preview.addEventListener('drop', (e) => {
                DragDropManager.handleDrop(e, (dragData, dropIndex) => {
                    if (dragData.type === 'palette') {
                        // Add new component at position
                        this.addComponentAtIndex(dragData.componentType, dropIndex);
                    } else if (dragData.type === 'component') {
                        // Reorder existing component
                        this.moveComponent(dragData.index, dropIndex);
                    }
                });
            });

            document.querySelectorAll('.component-wrapper').forEach((el, index) => {
                // Click to select
                el.addEventListener('click', (e) => {
                    if (!e.target.closest('.component-move-button')) {
                        const componentId = el.dataset.componentId;
                        this.selectComponent(componentId);
                    }
                });

                // Drag events
                el.addEventListener('dragstart', (e) => {
                    const componentId = el.dataset.componentId;
                    DragDropManager.handleComponentDragStart(e, componentId, index);
                });

                el.addEventListener('dragend', () => {
                    DragDropManager.handleDragEnd();
                });

                // Move up/down buttons
                el.querySelector('.move-up')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (index > 0) this.moveComponent(index, index - 1);
                });

                el.querySelector('.move-down')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (index < this.portfolioData.components.length - 1) {
                        this.moveComponent(index, index + 1);
                    }
                });
            });
        } else {
            // Preview mode - add scroll animations
            const wrappers = document.querySelectorAll('.component-wrapper');
            ScrollAnimator.observe(wrappers);
        }

        this.initializeLucideIcons();
    },

    renderComponent(component, index) {
        const isSelected = component.id === this.selectedComponentId;
        const isEditMode = !this.isPreviewMode;
        const isFirst = index === 0;
        const isLast = index === this.portfolioData.components.length - 1;

        let componentHtml = '';

        switch (component.type) {
            case 'hero':
                componentHtml = this.renderHero(component);
                break;
            case 'header':
                componentHtml = this.renderHeader(component);
                break;
            case 'text':
                componentHtml = this.renderText(component);
                break;
            case 'about':
                componentHtml = this.renderAbout(component);
                break;
            case 'project':
                componentHtml = this.renderProject(component);
                break;
            case 'experience':
                componentHtml = this.renderExperience(component);
                break;
            case 'certification':
                componentHtml = this.renderCertification(component);
                break;
            case 'education':
                componentHtml = this.renderEducation(component);
                break;
            case 'image':
                componentHtml = this.renderImage(component);
                break;
            case 'divider':
                componentHtml = this.renderDivider(component);
                break;
            default:
                componentHtml = '<div>Unknown component type</div>';
        }

        if (isEditMode) {
            return `
        <div class="component-wrapper ${isSelected ? 'selected' : ''}" 
             data-component-id="${component.id}" 
             data-index="${index}"
             draggable="true">
          <div class="component-controls">
            <div class="component-label">${component.type}</div>
            <div class="component-move-buttons">
              <button class="component-move-button move-up" ${isFirst ? 'disabled' : ''}>
                <i data-lucide="chevron-up"></i>
              </button>
              <button class="component-move-button move-down" ${isLast ? 'disabled' : ''}>
                <i data-lucide="chevron-down"></i>
              </button>
            </div>
          </div>
          ${componentHtml}
        </div>
      `;
        }

        return componentHtml;
    },

    // ============================================================================
    // COMPONENT RENDERERS
    // ============================================================================

    renderHero(component) {
        const { name, title, bio } = component.content;
        return `
      <div class="component-hero">
        <h1 class="hero-name">${name}</h1>
        <p class="hero-title">${title}</p>
        <p class="hero-bio">${bio}</p>
      </div>
    `;
    },

    renderHeader(component) {
        const { text } = component.content;
        return `
      <div class="component-header">
        <h2>${text}</h2>
      </div>
    `;
    },

    renderText(component) {
        const { text } = component.content;
        return `
      <div class="component-text">
        <p>${text}</p>
      </div>
    `;
    },

    renderAbout(component) {
        const { heading, text } = component.content;
        return `
      <div class="component-about">
        <h3>${heading}</h3>
        <p>${text}</p>
      </div>
    `;
    },

    renderProject(component) {
        const { title, description, tags, image, detailsLink } = component.content;

        return `
      <div class="component-project">
        ${image ? `<img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(title)}" class="project-image" />` : ''}
        <div class="project-content">
          <h3>${title}</h3>
          <p>${description}</p>
          ${tags && tags.length > 0 ? `
            <div class="project-tags">
              ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
          ${detailsLink ? `<a href="${this.escapeHtml(detailsLink)}" target="_blank" class="project-link">View Project →</a>` : ''}
        </div>
      </div>
    `;
    }, renderExperience(component) {
        const { company, position, startDate, endDate, current, description } = component.content;
        const endDateText = current ? 'Present' : (endDate ? this.formatDate(endDate) : '');
        return `
      <div class="component-experience">
        <div class="experience-header">
          <div>
            <h3>${company}</h3>
            <p class="experience-position">${position}</p>
          </div>
          <div class="experience-dates">
            ${startDate ? this.formatDate(startDate) : ''} - ${endDateText}
          </div>
        </div>
        <p class="experience-description">${description}</p>
      </div>
    `;
    },

    renderCertification(component) {
        const { name, issuer, date, expirationDate, credentialLink, image } = component.content;
        return `
      <div class="component-certification">
        ${image ? `<img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(name)}" class="cert-image" />` : ''}
        <div class="cert-content">
          <h3>${name}</h3>
          <p class="cert-issuer">${issuer}</p>
          <p class="cert-date">Issued: ${date ? this.formatDate(date) : ''}</p>
          ${expirationDate ? `<p class="cert-expiration">Expires: ${this.formatDate(expirationDate)}</p>` : ''}
          ${credentialLink ? `<a href="${this.escapeHtml(credentialLink)}" target="_blank" class="cert-link">View Credential →</a>` : ''}
        </div>
      </div>
    `;
    },

    renderEducation(component) {
        const { school, degree, startDate, endDate, current, description } = component.content;
        const endDateText = current ? 'Present' : (endDate ? this.formatDate(endDate) : '');
        return `
      <div class="component-education">
        <div class="education-header">
          <div>
            <h3>${school}</h3>
            <p class="education-degree">${degree}</p>
          </div>
          <div class="education-dates">
            ${startDate ? this.formatDate(startDate) : ''} - ${endDateText}
          </div>
        </div>
        ${description ? `<p class="education-description">${description}</p>` : ''}
      </div>
    `;
    },

    renderImage(component) {
        const { url, caption, width, alignment } = component.content;
        return `
      <div class="component-image align-${alignment || 'center'}">
        <div class="image-container width-${width || 'full'}">
          ${url ? `<img src="${this.escapeHtml(url)}" alt="${this.escapeHtml(caption || '')}" />` : '<div class="image-placeholder">No image selected</div>'}
          ${caption ? `<p class="image-caption">${caption}</p>` : ''}
        </div>
      </div>
    `;
    },

    renderDivider(component) {
        const { style, thickness, color } = component.content;
        return `
      <div class="component-divider">
        <hr class="divider-line style-${style || 'solid'} thickness-${thickness || 'medium'}" style="border-color: ${color || '#d1d5db'};" />
      </div>
    `;
    },

    // ============================================================================
    // COMPONENT EDITOR
    // ============================================================================

    selectComponent(componentId) {
        this.selectedComponentId = componentId;
        const component = this.portfolioData.components.find(c => c.id === componentId);

        if (component) {
            this.renderEditor(component);
            document.getElementById('componentEditor').style.display = 'flex';
        }

        this.renderPortfolio();
    },

    closeEditor() {
        this.selectedComponentId = null;
        document.getElementById('componentEditor').style.display = 'none';
        this.renderPortfolio();
    },

    renderEditor(component) {
        const editorContent = document.querySelector('.editor-content');
        let fieldsHtml = '';

        switch (component.type) {
            case 'hero':
                fieldsHtml = `
          <div class="editor-field">
            <label>Name</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="name">${component.content.name}</div>
          </div>
          <div class="editor-field">
            <label>Title</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="title">${component.content.title}</div>
          </div>
          <div class="editor-field">
            <label>Bio</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="bio">${component.content.bio}</div>
          </div>
        `;
                break;

            case 'header':
                fieldsHtml = `
          <div class="editor-field">
            <label>Heading Text</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="text">${component.content.text}</div>
          </div>
        `;
                break;

            case 'text':
                fieldsHtml = `
          <div class="editor-field">
            <label>Text Content</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="text">${component.content.text}</div>
          </div>
        `;
                break;

            case 'about':
                fieldsHtml = `
          <div class="editor-field">
            <label>Heading</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="heading">${component.content.heading}</div>
          </div>
          <div class="editor-field">
            <label>Text</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="text">${component.content.text}</div>
          </div>
        `;
                break;

            case 'project':
                const content = component.content;
                fieldsHtml = `
          <div class="editor-field">
            <label>Title</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="title">${content.title}</div>
          </div>
          
          <div class="editor-field">
            <label>Description</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="description">${content.description}</div>
          </div>
          
          <div class="editor-field">
            <label>Project Image</label>
            <div class="image-upload-container" data-field="image"></div>
          </div>
          
          <div class="editor-field">
            <label>Tags (comma-separated)</label>
            <input type="text" class="editor-input" data-field="tags" value="${this.escapeHtml((content.tags || []).join(', '))}" />
          </div>
          
          <div class="editor-field">
            <label>Project Link (optional)</label>
            <input type="text" class="editor-input" data-field="detailsLink" value="${this.escapeHtml(content.detailsLink || '')}" />
          </div>
          
          <div class="editor-field">
            <label>Additional Images (Gallery)</label>
            <div class="additional-images-container" data-field="additionalImages"></div>
          </div>
        `;
                break;

            case 'experience':
                fieldsHtml = `
          <div class="editor-field">
            <label>Company</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="company">${component.content.company}</div>
          </div>
          <div class="editor-field">
            <label>Position</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="position">${component.content.position}</div>
          </div>
          <div class="editor-field">
            <label>
              <input type="checkbox" class="editor-checkbox" data-field="current" ${component.content.current ? 'checked' : ''} />
              I currently work here
            </label>
          </div>
          <div class="editor-field">
            <label class="date-input-label">
              Start Date
              <span class="optional-indicator">(day is optional)</span>
            </label>
            <div class="custom-date-input" data-field="startDate" data-value="${component.content.startDate || ''}"></div>
          </div>
          <div class="editor-field" id="endDateField" style="display: ${component.content.current ? 'none' : 'block'}">
            <label class="date-input-label">
              End Date
              <span class="optional-indicator">(day is optional)</span>
            </label>
            <div class="custom-date-input" data-field="endDate" data-value="${component.content.endDate || ''}"></div>
          </div>
          <div class="editor-field">
            <label>Description</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="description">${component.content.description}</div>
          </div>
        `;
                break;

            case 'certification':
                fieldsHtml = `
          <div class="editor-field">
            <label>Certification Name</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="name">${component.content.name}</div>
          </div>
          <div class="editor-field">
            <label>Issuing Organization</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="issuer">${component.content.issuer}</div>
          </div>
          <div class="editor-field">
            <label class="date-input-label">
              Issue Date
              <span class="optional-indicator">(day is optional)</span>
            </label>
            <div class="custom-date-input" data-field="date" data-value="${component.content.date || ''}"></div>
          </div>
          <div class="editor-field">
            <label class="date-input-label">
              Expiration Date (optional)
              <span class="optional-indicator">(day is optional)</span>
            </label>
            <div class="custom-date-input" data-field="expirationDate" data-value="${component.content.expirationDate || ''}"></div>
          </div>
          <div class="editor-field">
            <label>Credential Link (optional)</label>
            <input type="text" class="editor-input" data-field="credentialLink" value="${this.escapeHtml(component.content.credentialLink || '')}" />
          </div>
          <div class="editor-field">
            <label>Badge Image (optional)</label>
            <div class="image-upload-container" data-field="image"></div>
          </div>
        `;
                break;

            case 'education':
                fieldsHtml = `
          <div class="editor-field">
            <label>School/University</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="school">${component.content.school}</div>
          </div>
          <div class="editor-field">
            <label>Degree</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="degree">${component.content.degree}</div>
          </div>
          <div class="editor-field">
            <label>
              <input type="checkbox" class="editor-checkbox" data-field="current" ${component.content.current ? 'checked' : ''} />
              I currently study here
            </label>
          </div>
          <div class="editor-field">
            <label class="date-input-label">
              Start Date
              <span class="optional-indicator">(day is optional)</span>
            </label>
            <div class="custom-date-input" data-field="startDate" data-value="${component.content.startDate || ''}"></div>
          </div>
          <div class="editor-field" id="endDateField" style="display: ${component.content.current ? 'none' : 'block'}">
            <label class="date-input-label">
              End Date
              <span class="optional-indicator">(day is optional)</span>
            </label>
            <div class="custom-date-input" data-field="endDate" data-value="${component.content.endDate || ''}"></div>
          </div>
          <div class="editor-field">
            <label>Description (optional)</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="description">${component.content.description || ''}</div>
          </div>
        `;
                break;

            case 'image':
                fieldsHtml = `
          <div class="editor-field">
            <label>Image</label>
            <div class="image-upload-container" data-field="url"></div>
          </div>
          <div class="editor-field">
            <label>Caption (optional)</label>
            ${RichTextEditor.createToolbar()}
            <div class="rich-text-editable" data-field="caption">${component.content.caption || ''}</div>
          </div>
          <div class="editor-field">
            <label>Width</label>
            <select class="editor-select" data-field="width">
              <option value="small" ${component.content.width === 'small' ? 'selected' : ''}>Small (33%)</option>
              <option value="medium" ${component.content.width === 'medium' ? 'selected' : ''}>Medium (50%)</option>
              <option value="large" ${component.content.width === 'large' ? 'selected' : ''}>Large (75%)</option>
              <option value="full" ${component.content.width === 'full' || !component.content.width ? 'selected' : ''}>Full (100%)</option>
            </select>
          </div>
          <div class="editor-field">
            <label>Alignment</label>
            <select class="editor-select" data-field="alignment">
              <option value="left" ${component.content.alignment === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${component.content.alignment === 'center' || !component.content.alignment ? 'selected' : ''}>Center</option>
              <option value="right" ${component.content.alignment === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;
                break;

            case 'divider':
                fieldsHtml = `
          <div class="editor-field">
            <label>Style</label>
            <select class="editor-select" data-field="style">
              <option value="solid" ${component.content.style === 'solid' || !component.content.style ? 'selected' : ''}>Solid</option>
              <option value="dashed" ${component.content.style === 'dashed' ? 'selected' : ''}>Dashed</option>
              <option value="dotted" ${component.content.style === 'dotted' ? 'selected' : ''}>Dotted</option>
            </select>
          </div>
          <div class="editor-field">
            <label>Thickness</label>
            <select class="editor-select" data-field="thickness">
              <option value="thin" ${component.content.thickness === 'thin' ? 'selected' : ''}>Thin</option>
              <option value="medium" ${component.content.thickness === 'medium' || !component.content.thickness ? 'selected' : ''}>Medium</option>
              <option value="thick" ${component.content.thickness === 'thick' ? 'selected' : ''}>Thick</option>
            </select>
          </div>
          <div class="editor-field">
            <label>Color</label>
            <input type="color" class="editor-input" data-field="color" value="${component.content.color || '#d1d5db'}" />
          </div>
        `;
                break;

            default:
                fieldsHtml = '<p>No editor available for this component type.</p>';
        }

        editorContent.innerHTML = fieldsHtml;

        // Initialize Rich Text Editors
        editorContent.querySelectorAll('.rich-text-editable').forEach(editor => {
            const field = editor.dataset.field;
            RichTextEditor.init(editor, (html) => {
                const updatedContent = { ...component.content, [field]: html };
                this.updateComponent(component.id, updatedContent);
            });
        });

        // Initialize Rich Text Toolbars
        editorContent.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;

                if (command === 'link') {
                    RichTextEditor.insertLink();
                } else {
                    RichTextEditor.execCommand(command);
                }
            });
        });

        // Initialize Image Upload
        const imageContainer = editorContent.querySelector('.image-upload-container[data-field="image"]');
        if (imageContainer) {
            this.initializeImageUpload(imageContainer, component, 'image');
        }

        // Initialize Additional Images
        const additionalImagesContainer = editorContent.querySelector('.additional-images-container');
        if (additionalImagesContainer) {
            this.initializeAdditionalImages(additionalImagesContainer, component);
        }

        // Initialize Custom Date Inputs
        editorContent.querySelectorAll('.custom-date-input').forEach(dateInput => {
            const field = dateInput.dataset.field;
            const value = dateInput.dataset.value;
            this.initializeDateInput(dateInput, component, field, value);
        });

        // Initialize Image Uploads for all image fields
        editorContent.querySelectorAll('.image-upload-container').forEach(container => {
            const field = container.dataset.field;
            this.initializeImageUpload(container, component, field);
        });

        // Add change listeners to all inputs
        editorContent.querySelectorAll('.editor-input, .editor-textarea, .editor-select').forEach(input => {
            input.addEventListener('input', (e) => {
                const field = e.target.dataset.field;
                let value = e.target.value;

                // Handle tags special case (convert comma-separated string to array)
                if (field === 'tags') {
                    value = value.split(',').map(tag => tag.trim()).filter(tag => tag);
                }

                const updatedContent = { ...component.content, [field]: value };
                this.updateComponent(component.id, updatedContent);
            });
        });

        // Handle checkboxes separately
        editorContent.querySelectorAll('.editor-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const field = e.target.dataset.field;
                const value = e.target.checked;

                // Toggle end date field visibility
                if (field === 'current') {
                    const endDateField = document.getElementById('endDateField');
                    if (endDateField) {
                        endDateField.style.display = value ? 'none' : 'block';
                    }
                }

                const updatedContent = { ...component.content, [field]: value };
                this.updateComponent(component.id, updatedContent);
            });
        });

        this.initializeLucideIcons();
    },

    // ============================================================================
    // PREVIEW MODE
    // ============================================================================

    togglePreview() {
        this.isPreviewMode = !this.isPreviewMode;

        // Update button
        const icon = document.getElementById('previewIcon');
        const text = document.getElementById('previewText');

        if (this.isPreviewMode) {
            icon.setAttribute('data-lucide', 'eye-off');
            text.textContent = 'Edit Mode';
            document.getElementById('componentPalette').style.display = 'none';
            document.getElementById('componentEditor').style.display = 'none';
            this.showPalette = false;
            this.selectedComponentId = null;
        } else {
            icon.setAttribute('data-lucide', 'eye');
            text.textContent = 'Preview';
        }

        this.renderPortfolio();
        this.initializeLucideIcons();
    },

    // ============================================================================
    // SAVE FUNCTIONALITY
    // ============================================================================

    showSaveModal() {
        const modal = document.getElementById('savePortfolioModal');
        const nameInput = document.getElementById('portfolioName');

        // Pre-fill with existing name if available
        nameInput.value = this.portfolioData.name || '';

        modal.style.display = 'flex';
        nameInput.focus();

        // Initialize Lucide icons in modal
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    hideSaveModal() {
        const modal = document.getElementById('savePortfolioModal');
        modal.style.display = 'none';
    },

    async savePortfolio() {
        const nameInput = document.getElementById('portfolioName');
        const portfolioName = nameInput.value.trim();

        if (!portfolioName) {
            alert('Please enter a portfolio name.');
            nameInput.focus();
            return;
        }

        // Update portfolio data with name
        this.portfolioData.name = portfolioName;

        try {
            const response = await fetch('/api/save-portfolio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.portfolioData)
            });

            const result = await response.json();

            if (response.ok) {
                // Update portfolio ID if it was a new creation
                if (result.id && !this.portfolioData.id) {
                    this.portfolioData.id = result.id;
                    // Update URL to include portfolio ID (without page reload)
                    window.history.replaceState({}, '', `create-portfolio.html?id=${result.id}`);
                }

                this.hideSaveModal();
                this.showNotification('Portfolio saved successfully!', 'success');
            } else {
                alert(result.error || 'Failed to save portfolio. Please try again.');
            }
        } catch (error) {
            console.error('Error saving portfolio:', error);
            alert('An error occurred while saving. Please try again.');
        }
    },

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Initialize icon
        if (window.lucide) {
            lucide.createIcons();
        }

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    formatDate(dateString) {
        return DateFormatter.format(dateString);
    },
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    PortfolioBuilder.init();
});
