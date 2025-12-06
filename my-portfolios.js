// My Portfolios Page - Load and display user's portfolios

document.addEventListener('DOMContentLoaded', async () => {
    await loadPortfolios();
    setupEventListeners();

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

async function loadPortfolios() {
    const grid = document.getElementById('portfolioGrid');
    const emptyState = document.getElementById('emptyState');

    try {
        const response = await fetch('/api/portfolios');

        if (!response.ok) {
            throw new Error('Failed to load portfolios');
        }

        const data = await response.json();
        const portfolios = data.portfolios || [];

        // Clear loading state
        grid.innerHTML = '';

        if (portfolios.length === 0) {
            // Show empty state
            emptyState.style.display = 'flex';
            grid.style.display = 'none';
        } else {
            // Hide empty state and show grid
            emptyState.style.display = 'none';
            grid.style.display = 'grid';

            // Add "Create New" card first
            const newCard = createNewPortfolioCard();
            grid.appendChild(newCard);

            // Render portfolio cards
            portfolios.forEach(portfolio => {
                const card = createPortfolioCard(portfolio);
                grid.appendChild(card);
            });

        }
    } catch (error) {
        console.error('Error loading portfolios:', error);
        grid.innerHTML = `
            <div class="pf-error">
                <p>Failed to load portfolios. Please refresh the page.</p>
            </div>
        `;
    }
}

function createPortfolioCard(portfolio) {
    const card = document.createElement('article');
    card.className = 'pf-card';
    card.dataset.portfolioId = portfolio.id;

    const lastEdited = formatTimeAgo(portfolio.updated_at);
    const templateLabel = formatTemplateName(portfolio.template);

    card.innerHTML = `
        <div class="pf-card-thumb template-${portfolio.template}">
            <div class="pf-card-template-badge">${templateLabel}</div>
        </div>
        <div class="pf-card-meta">
            <div class="pf-card-title">${escapeHtml(portfolio.name)}</div>
            <div class="pf-card-sub">Last edited ${lastEdited}</div>
        </div>
        <div class="pf-card-actions">
            <button class="pf-card-action-btn" data-action="edit" title="Edit">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="pf-card-action-btn" data-action="duplicate" title="Duplicate">
                <span class="material-symbols-outlined">content_copy</span>
            </button>
            <button class="pf-card-action-btn" data-action="delete" title="Delete">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    `;

    // Click card to open/edit
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking action buttons
        if (!e.target.closest('.pf-card-action-btn')) {
            window.location.href = `create-portfolio.html?id=${portfolio.id}`;
        }
    });

    // Action buttons
    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `create-portfolio.html?id=${portfolio.id}`;
    });

    card.querySelector('[data-action="duplicate"]').addEventListener('click', (e) => {
        e.stopPropagation();
        duplicatePortfolio(portfolio.id);
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePortfolio(portfolio.id, portfolio.name);
    });

    return card;
}

function createNewPortfolioCard() {
    const card = document.createElement('article');
    card.className = 'pf-card pf-card-new';
    card.innerHTML = `
        <div class="pf-card-new-inner">
            <span class="material-symbols-outlined">add</span>
            <span>Create new</span>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = 'create-portfolio.html';
    });

    return card;
}

function setupEventListeners() {
    // "New portfolio" button in header
    const newButton = document.querySelector('.pf-btn-primary');
    if (newButton) {
        newButton.addEventListener('click', () => {
            window.location.href = 'create-portfolio.html';
        });
    }

    // Template cards
    document.querySelectorAll('.pf-template-card').forEach(card => {
        card.addEventListener('click', () => {
            const template = card.getAttribute('data-template');
            if (template) {
                window.location.href = `create-portfolio.html?template=${template}`;
            } else {
                window.location.href = 'create-portfolio.html';
            }
        });
    });
}

async function duplicatePortfolio(portfolioId) {
    if (!confirm('Create a copy of this portfolio?')) return;

    try {
        // Load the portfolio
        const response = await fetch(`/api/portfolio/${portfolioId}`);
        if (!response.ok) throw new Error('Failed to load portfolio');

        const portfolio = await response.json();

        // Create a copy with a new name
        const copyName = `${portfolio.name} (Copy)`;
        const newPortfolio = {
            name: copyName,
            template: portfolio.template,
            components: portfolio.components
        };

        // Save the copy
        const saveResponse = await fetch('/api/save-portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPortfolio)
        });

        if (saveResponse.ok) {
            // Reload the portfolios
            await loadPortfolios();
        } else {
            alert('Failed to duplicate portfolio. Please try again.');
        }
    } catch (error) {
        console.error('Error duplicating portfolio:', error);
        alert('An error occurred. Please try again.');
    }
}

async function deletePortfolio(portfolioId, portfolioName) {
    if (!confirm(`Are you sure you want to delete "${portfolioName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/portfolio/${portfolioId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Reload the portfolios
            await loadPortfolios();
        } else {
            alert('Failed to delete portfolio. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting portfolio:', error);
        alert('An error occurred. Please try again.');
    }
}

// Utility functions
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

function formatTemplateName(template) {
    const names = {
        'minimal': 'Minimal',
        'modern': 'Modern',
        'creative': 'Creative'
    };
    return names[template] || template;
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
