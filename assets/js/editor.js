$(document).ready(function() {
    
    // --- Configuration ---
    const basePath = $('body').data('base-url');
    const hasVault = $('body').data('has-vault');
    
    // --- State Management ---
    let appState = {
        panes: []
    };

    let mainSplit = null;
    let contentSplit = null;
    
    // Track where to open files. Default to null, will set on render.
    let lastActivePaneId = null; 

    // --- Initialization ---

    function init() {
        if (!hasVault) {
            $('#vault-modal').show();
            $('#cancel-vault-btn').hide();
        } else {
            loadStateFromStorage();
            if (appState.panes.length === 0) {
                addPaneState(); 
            }
            
            // Layout Split
            mainSplit = Split(['#sidebar', '#editors-wrapper'], {
                sizes: [15, 85],
                minSize: [150, 300], 
                gutterSize: 5
            });

            renderAllPanes();
            loadTree();
        }
    }

    // --- Active Pane Logic ---

    // Helper to set active pane visually and logically
    function setActivePane(paneId) {
        lastActivePaneId = paneId;
        $('.editor-pane').removeClass('active-focus');
        $(`#${paneId}`).addClass('active-focus');
    }

    // --- State Logic ---

    function loadStateFromStorage() {
        const stored = localStorage.getItem('markpal_editor_state');
        if (stored) {
            try { appState = JSON.parse(stored); } catch (e) {}
        }
    }

    function saveState() {
        localStorage.setItem('markpal_editor_state', JSON.stringify(appState));
    }

    function addPaneState() {
        const id = 'pane_' + Date.now();
        appState.panes.push({ id: id, tabs: [], activeTab: null });
        saveState();
        return id;
    }

    function removePaneState(paneId) {
        appState.panes = appState.panes.filter(p => p.id !== paneId);
        saveState();
    }

    function getPane(paneId) {
        return appState.panes.find(p => p.id === paneId);
    }

    // --- Rendering Logic ---

    function renderAllPanes() {
        const $wrapper = $('#editors-wrapper');
        
        if(contentSplit) { contentSplit.destroy(); contentSplit = null; }

        // DOM Sync
        appState.panes.forEach(pane => {
            if ($(`#${pane.id}`).length === 0) $wrapper.append(generatePaneHTML(pane));
        });
        $wrapper.children('.editor-pane').each(function() {
            const id = $(this).attr('id');
            if (!appState.panes.find(p => p.id === id)) $(this).remove();
        });

        // Content Sync
        appState.panes.forEach(pane => {
            renderTabs(pane.id);
            if(pane.activeTab) loadFileContent(pane.id, pane.activeTab);
            else showEmptyState(pane.id);
        });

        // Set default active pane if none selected
        if (!lastActivePaneId && appState.panes.length > 0) {
            setActivePane(appState.panes[0].id);
        }

        // Split JS
        const paneIds = appState.panes.map(p => `#${p.id}`);
        if (paneIds.length > 0) {
            const size = 100 / paneIds.length;
            contentSplit = Split(paneIds, {
                sizes: new Array(paneIds.length).fill(size),
                minSize: 200, gutterSize: 5
            });
        }
    }

    function generatePaneHTML(pane) {
        return `
        <div id="${pane.id}" class="editor-pane" data-pane-id="${pane.id}">
            <div class="tab-bar">
                <button class="pane-close-trigger" title="Close Panel">×</button>
            </div>
            <div class="editor-content-wrapper">
                <div class="pane-empty-state">No file open</div>
                <textarea class="editor-area" style="display:none;" spellcheck="false"></textarea>
                <div class="preview-area"></div>
                <div class="save-status"></div>
            </div>
        </div>`;
    }

    function renderTabs(paneId) {
        const pane = getPane(paneId);
        const $tabBar = $(`#${paneId} .tab-bar`);
        $tabBar.find('.tab').remove(); // Clear tabs

        pane.tabs.forEach(filePath => {
            const isActive = filePath === pane.activeTab;
            const tabName = filePath.split('/').pop().split('\\').pop(); 
            
            const tabHtml = `
                <div class="tab ${isActive ? 'active' : ''}" data-path="${filePath}">
                    <span class="tab-name" title="${filePath}">${tabName}</span>
                    <button class="tab-icon-btn tab-menu-trigger">⋮</button>
                    <button class="tab-icon-btn tab-close-btn">×</button>
                </div>`;
            $tabBar.find('.pane-close-trigger').before(tabHtml);
        });
    }

    function showEmptyState(paneId) {
        const $pane = $(`#${paneId}`);
        $pane.find('.editor-area, .preview-area').hide();
        $pane.find('.pane-empty-state').show();
        $pane.find('.save-status').text('');
    }

    // --- File Operations ---

    window.openFileInActivePane = function(filePath) {
        // Use the last touched pane, or fallback to the first one available
        let targetId = lastActivePaneId;
        
        // Validation: Ensure the pane actually still exists
        if (!targetId || !getPane(targetId)) {
            if(appState.panes.length > 0) targetId = appState.panes[0].id;
            else return; // No panes exist
        }

        const pane = getPane(targetId);
        
        if (!pane.tabs.includes(filePath)) {
            pane.tabs.push(filePath);
        }
        pane.activeTab = filePath;
        
        saveState();
        renderTabs(targetId);
        loadFileContent(targetId, filePath);
        
        // Ensure visual focus
        setActivePane(targetId);
    };

    function loadFileContent(paneId, filePath) {
        const $pane = $(`#${paneId}`);
        const $textarea = $pane.find('.editor-area');
        
        if ($textarea.data('filepath') === filePath && $textarea.val()) {
            $pane.find('.pane-empty-state').hide();
            $textarea.show();
            return;
        }

        $pane.find('.pane-empty-state').hide();
        $pane.find('.preview-area').hide();
        $textarea.show();

        $.get(basePath + '/api/read', { file: filePath }, function(res) {
            const data = JSON.parse(res);
            if(data.status === 'success') {
                $textarea.val(data.content);
                $textarea.data('filepath', filePath);
            } else {
                $textarea.val("Error loading file.");
            }
        });
    }

    function closeTab(paneId, filePath) {
        const pane = getPane(paneId);
        pane.tabs = pane.tabs.filter(t => t !== filePath);
        if (pane.activeTab === filePath) {
            pane.activeTab = pane.tabs.length > 0 ? pane.tabs[pane.tabs.length - 1] : null;
        }
        saveState();
        renderTabs(paneId);
        if (pane.activeTab) loadFileContent(paneId, pane.activeTab);
        else showEmptyState(paneId);
    }

    // --- Interaction Listeners ---

    // 1. Track Active Pane (MouseDown to catch clicks anywhere)
    $(document).on('mousedown', '.editor-pane', function() {
        const id = $(this).attr('id');
        setActivePane(id);
    });

    // 2. Tree Click
    $(document).on('click', '.file-node', function() {
        const path = $(this).data('path');
        $('.file-node').css('color', ''); $(this).css('color', '#fff');
        window.openFileInActivePane(path);
    });

    // 3. Tab Menu (Three Dots) - GLOBAL MENU LOGIC
    $(document).on('click', '.tab-menu-trigger', function(e) {
        e.stopPropagation();
        
        const $btn = $(this);
        const $tab = $btn.closest('.tab');
        const paneId = $btn.closest('.editor-pane').attr('id');
        const filePath = $tab.data('path');
        
        // Store context in the global menu
        const $menu = $('#global-tab-menu');
        $menu.data('target-pane', paneId);
        $menu.data('target-file', filePath); // Though file path implicitly active in pane usually

        // Calculate Position
        const offset = $btn.offset();
        const top = offset.top + $btn.outerHeight() + 5;
        const left = offset.left - 100; // Shift left so it doesn't go off screen

        // Show Menu
        $menu.css({ top: top, left: left }).addClass('show').show();
        
        // Set this pane as active since we interacted with it
        setActivePane(paneId);
    });

    // Hide menu on click elsewhere
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#global-tab-menu').length) {
            $('#global-tab-menu').hide();
        }
    });

    // Menu Actions
    $('#global-tab-menu .menu-item').click(function() {
        const $menu = $('#global-tab-menu');
        const paneId = $menu.data('target-pane');
        const $pane = $(`#${paneId}`);
        const action = $(this).attr('class').split(' ').find(c => c.startsWith('action-'));

        $menu.hide();

        if(action === 'action-preview') togglePreview($pane);
        if(action === 'action-pdf') exportPDF($pane);
        if(action === 'action-html') exportHTML($pane);
    });

    // 4. Tab Switching
    $(document).on('click', '.tab', function(e) {
        if ($(e.target).closest('button').length) return; // Ignore button clicks
        const paneId = $(this).closest('.editor-pane').attr('id');
        const path = $(this).data('path');
        
        const pane = getPane(paneId);
        pane.activeTab = path;
        saveState();
        renderTabs(paneId);
        loadFileContent(paneId, path);
        setActivePane(paneId);
    });

    $(document).on('click', '.tab-close-btn', function(e) {
        e.stopPropagation();
        closeTab($(this).closest('.editor-pane').attr('id'), $(this).closest('.tab').data('path'));
    });

    // 5. Sidebar & Pane Management
    $('#split-view-btn').click(() => { addPaneState(); renderAllPanes(); });
    
    $(document).on('click', '.pane-close-trigger', function() {
        if (appState.panes.length <= 1) { alert("Cannot close last pane."); return; }
        removePaneState($(this).closest('.editor-pane').attr('id'));
        renderAllPanes();
    });

    $('#settings-btn').click(() => { $('#vault-modal').show(); $('#cancel-vault-btn').show(); });
    $('#cancel-vault-btn').click(() => $('#vault-modal').hide());
    $('#save-vault-btn').click(() => {
        $.post(basePath + '/api/set-vault', { path: $('#vault-path').val() }, (res) => {
            if(JSON.parse(res).status === 'success') location.reload();
        });
    });

    // Tree/Search Logic (Standard)
    function loadTree() {
        $.get(basePath + '/api/tree').done((res) => {
            try { $('#file-tree').html('<ul class="tree-root">' + renderTreeRecursive(JSON.parse(res)) + '</ul>'); } catch(e){}
        });
    }
    function renderTreeRecursive(nodes) {
        let html = '';
        nodes.forEach(n => {
            if(n.type==='folder') html+=`<li class="tree-item folder-node"><span class="folder-label">📁 ${n.text}</span><ul class="folder-children">${renderTreeRecursive(n.children)}</ul></li>`;
            else html+=`<li class="tree-item file-node" data-path="${n.path}">📄 ${n.text}</li>`;
        });
        return html;
    }
    $(document).on('click', '.folder-label', function(e){ e.stopPropagation(); $(this).parent().toggleClass('folder-open'); });
    $('#search-input').on('keyup', function() {
        const t = $(this).val().toLowerCase();
        if(!t) { $('.search-hidden, .folder-open').removeClass('search-hidden folder-open'); return; }
        $('.file-node').addClass('search-hidden');
        $('.file-node').each(function(){ if($(this).text().toLowerCase().includes(t)) $(this).removeClass('search-hidden').parents('.folder-node').addClass('folder-open').parents('.folder-children').show(); });
    });
    $('#new-file-btn').click(() => {
        const n = prompt("Filename:"); if(n) $.post(basePath+'/api/create', {name:n}, (r)=> { if(JSON.parse(r).status==='success') loadTree(); });
    });

    function performSave($textarea) {
        const path = $textarea.data('filepath');
        if(!path) return;

        const $status = $textarea.siblings('.save-status');
        
        // Visual Feedback
        $status.text('Saving...').css('color', '#ffff00'); // Yellow

        $.post(basePath + '/api/save', { file: path, content: $textarea.val() }, function(res) {
            // Success Feedback
            $status.text('Saved').css('color', '#666');
            setTimeout(() => $status.text(''), 2000);
        }).fail(function() {
            // Error Feedback
            $status.text('Error').css('color', '#ff4444');
        });
    }

    // Auto Save (Debounced)
    let typingTimer;
    $(document).on('keyup', '.editor-area', function() {
        const $this = $(this);
        
        // Update Preview immediately while typing
        const $preview = $this.siblings('.preview-area');
        if($preview.is(':visible')) {
            $preview.html(marked.parse($this.val() || ''));
        }
        
        // Reset Timer
        clearTimeout(typingTimer);
        
        // Wait 1 second after typing stops to save
        typingTimer = setTimeout(() => {
            performSave($this);
        }, 1000);
    });

    // Manual Save (Ctrl + S)
    $(document).on('keydown', function(e) {
        // Check if Ctrl (or Cmd on Mac) + S is pressed
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault(); // Stop browser's "Save Page As" dialog

            // Determine which file to save:
            // Priority 1: The textarea currently being typed in (focused)
            // Priority 2: The textarea in the last active pane
            let $target = $('textarea.editor-area:focus');
            
            if ($target.length === 0 && lastActivePaneId) {
                $target = $(`#${lastActivePaneId} .editor-area`);
            }

            // Only save if we found a textarea and it has a file open
            if ($target.length > 0 && $target.data('filepath')) {
                performSave($target);
            }
        }
    });

    // Helpers
    function togglePreview($p) {
        const $e = $p.find('.editor-area'), $pr = $p.find('.preview-area');
        if($e.is(':visible')) { $pr.html(marked.parse($e.val()||'')).show(); $e.hide(); } else { $pr.hide(); $e.show(); }
    }
    
    function exportPDF($p) {
        // 1. Find the textarea within the passed pane ($p)
        const $textarea = $p.find('.editor-area');
        const rawContent = $textarea.val();

        if (!rawContent) {
            alert("File is empty.");
            return;
        }
        
        // 2. Parse Markdown to HTML
        const content = marked.parse(rawContent);

        // 3. Create a detached DOM element (Logic from your working snippet)
        const element = document.createElement('div');
        element.innerHTML = content;
        
        // 4. Force styling to ensure visibility (Black text on White bg)
        // This prevents the Dark Theme from making the PDF blank/unreadable
        element.style.color = "black"; 
        element.style.backgroundColor = "white";
        element.style.padding = "20px";
        element.style.fontFamily = "Helvetica, Arial, sans-serif";
        element.style.fontSize = "12pt";

        // 5. Determine Filename
        let filename = 'document';
        const filepath = $textarea.data('filepath');
        if (filepath) {
            // Extract just the filename from the path
            filename = filepath.split('/').pop().split('\\').pop();
        }

        // 6. PDF Options
        const opt = {
            margin:       0.5,
            filename:     filename + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // 7. Generate
        html2pdf().set(opt).from(element).save();
    }

    function exportHTML($p) {
        const c = marked.parse($p.find('.editor-area').val()||'');
        const f = ($p.find('.editor-area').data('filepath')||'doc').split('/').pop().replace('.md','.html');
        const l = document.createElement("a");
        l.href = URL.createObjectURL(new Blob([`<!DOCTYPE html><html><head><title>${f}</title></head><body>${c}</body></html>`],{type:"text/html"}));
        l.download = f; l.click();
    }

    init();
});