$(document).ready(function() {
    
    // 1. Initialize Split.js
    Split(['#sidebar', '#middle-pane', '#right-pane'], {
        sizes: [20, 80, 40],
        minSize: [150, 200, 200],
        gutterSize: 5,
    });

    const basePath = $('body').data('base-url');
    const hasVault = $('body').data('has-vault');
    let activeEditorId = 'editor-middle';

    // ------------------------------------------
    // STATE MANAGEMENT (Preserve Open Files)
    // ------------------------------------------

    /**
     * Core function to load a file into a specific editor pane
     */
    function loadFileIntoPane(filePath, editorId) {
        const $textarea = $('#' + editorId);
        const $container = $textarea.closest('.editor-container');

        $.get(basePath + '/api/read', { file: filePath }, function(res) {
            const data = JSON.parse(res);
            
            if(data.status === 'success') {
                // 1. Update UI
                $textarea.val(data.content);
                $textarea.data('filepath', filePath);
                $container.find('.file-label').text(filePath);
                $container.find('.close-file-btn').show();
                
                // 2. Render Preview
                updatePreview($textarea);

                // 3. Highlight in Tree (if tree is ready)
                highlightTreeFile(filePath);

                // 4. Persist to LocalStorage
                localStorage.setItem('simplo_open_' + editorId, filePath);
            } else {
                // If file not found (maybe deleted), clear storage
                console.log("Could not load: " + filePath);
                // localStorage.removeItem('simplo_open_' + editorId); // Optional: keep it or clear it
            }
        });
    }

    /**
     * Restore state on page load
     */
    function restoreState() {
        const savedMiddle = localStorage.getItem('simplo_open_editor-middle');
        const savedRight = localStorage.getItem('simplo_open_editor-right');

        if (savedMiddle) {
            loadFileIntoPane(savedMiddle, 'editor-middle');
        }
        if (savedRight) {
            loadFileIntoPane(savedRight, 'editor-right');
        }
    }

    function highlightTreeFile(path) {
        // Remove existing highlights
        // We don't remove all highlights blindly because two panes might have different files open.
        // But for simplicity in this tree view, let's highlight the one most recently interacted with 
        // or just ensure the node exists.
        
        const $node = $(`.file-node[data-path="${path}"]`);
        if($node.length) {
            $node.parents('.folder-children').show();
            $node.parents('.folder-node').addClass('folder-open');
            // We won't force color change here to avoid conflict if two different files are open
        }
    }

    // ------------------------------------------
    // KEYBOARD SHORTCUTS
    // ------------------------------------------
    $(document).on('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault(); 
            const $focused = $('textarea.editor-area:focus');
            const $target = $focused.length ? $focused : $('#' + activeEditorId);
            saveFile($target);
        }
    });

    // ------------------------------------------
    // VAULT & SETTINGS LOGIC
    // ------------------------------------------
    if (!hasVault) {
        $('#vault-modal').show();
        $('#cancel-vault-btn').hide();
    } else {
        // If vault exists, restore state immediately
        restoreState();
    }

    $('#settings-btn').click(function() {
        $('#vault-modal').fadeIn(200);
        $('#cancel-vault-btn').show();
    });

    $('#save-vault-btn').click(function() {
        const path = $('#vault-path').val();
        $.post(basePath + '/api/set-vault', { path: path }, function(res) {
            const data = JSON.parse(res);
            if(data.status === 'success') {
                location.reload();
            } else {
                alert(data.message);
            }
        });
    });

    $('#cancel-vault-btn').click(function() {
        $('#vault-modal').fadeOut(200);
    });

    // ------------------------------------------
    // CORE EDITOR LOGIC
    // ------------------------------------------

    $('.editor-container').on('click', function() {
        $('.editor-container').removeClass('active-pane');
        $(this).addClass('active-pane');
        activeEditorId = $(this).find('textarea').attr('id');
    });

    function loadTree() {
        if(!hasVault) return;
        $.get(basePath + '/api/tree', function(res) {
            const files = JSON.parse(res);
            $('#file-tree').html('<ul class="tree-root">' + renderTreeRecursive(files) + '</ul>');
            
            // Re-highlight open files after tree loads
            const savedMiddle = localStorage.getItem('simplo_open_editor-middle');
            const savedRight = localStorage.getItem('simplo_open_editor-right');
            if(savedMiddle) highlightTreeFile(savedMiddle);
            if(savedRight) highlightTreeFile(savedRight);
        });
    }

    function renderTreeRecursive(nodes) {
        let html = '';
        nodes.forEach(node => {
            if(node.type === 'folder') {
                html += `
                    <li class="tree-item folder-node">
                        <span class="folder-label">📁 ${node.text}</span>
                        <ul class="folder-children">
                            ${renderTreeRecursive(node.children)}
                        </ul>
                    </li>`;
            } else {
                html += `
                    <li class="tree-item file-node" data-path="${node.path}">
                        📄 <span class="fname">${node.text}</span>
                    </li>`;
            }
        });
        return html;
    }

    if($('#file-tree').length) loadTree();

    $(document).on('click', '.folder-label', function(e) {
        e.stopPropagation();
        $(this).parent().toggleClass('folder-open');
    });

    // Search Filtering
    $('#search-input').on('keyup', function() {
        const term = $(this).val().toLowerCase();
        if (term === '') {
            $('.folder-node').removeClass('folder-open search-match');
            $('.file-node').removeClass('search-hidden search-match');
            return;
        }
        $('.file-node').addClass('search-hidden');
        $('.folder-node').removeClass('folder-open');
        $('.file-node').each(function() {
            const text = $(this).find('.fname').text().toLowerCase();
            if (text.indexOf(term) > -1) {
                $(this).removeClass('search-hidden').addClass('search-match');
                $(this).parents('.folder-node').addClass('folder-open');
                $(this).parents('.folder-children').show();
            }
        });
    });

    // New File
    $('#new-file-btn').click(function() {
        const name = prompt("Enter new file name (e.g. notes.md):");
        if (name) {
            $.post(basePath + '/api/create', { name: name }, function(res) {
                const data = JSON.parse(res);
                if(data.status === 'success') loadTree();
                else alert(data.message);
            });
        }
    });

    // OPEN FILE (Click on Tree)
    $(document).on('click', '.file-node', function(e) {
        e.stopPropagation();
        const filePath = $(this).data('path');
        
        // Highlight logic for click
        $('.file-node').css('color', '');
        $(this).css('color', '#fff');

        // Load into currently active pane
        loadFileIntoPane(filePath, activeEditorId);
    });

    // CLOSE FILE
    $('.close-file-btn').click(function() {
        const $container = $(this).closest('.editor-container');
        const $textarea = $container.find('.editor-area');
        const editorId = $textarea.attr('id');

        // Clear UI
        $textarea.val('');
        $textarea.data('filepath', '');
        $container.find('.preview-area').html('');
        $container.find('.file-label').text('No File Selected');
        $(this).hide();

        // Remove from LocalStorage
        localStorage.removeItem('simplo_open_' + editorId);
    });

    // AUTO SAVE
    let typingTimer;
    $('textarea.editor-area').on('keyup', function() {
        const $this = $(this);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => saveFile($this), 1000);
        updatePreview($this);
    });

    function saveFile($textarea) {
        const filePath = $textarea.data('filepath');
        if(!filePath) return;
        
        const $status = $textarea.closest('.editor-container').find('.save-status');
        $status.text('Saving...');
        $status.css('color', '#ffff00');
        
        $.post(basePath + '/api/save', { file: filePath, content: $textarea.val() }, function(res) {
            const data = JSON.parse(res);
            if(data.status === 'success') {
                $status.text('Saved');
                $status.css('color', '#666'); 
                setTimeout(() => $status.text(''), 2000);
            } else {
                $status.text('Error Saving');
                $status.css('color', 'red');
            }
        });
    }

    // PREVIEW TOGGLE
    $('.toggle-preview').click(function() {
        const $container = $(this).closest('.editor-container');
        const $editor = $container.find('.editor-area');
        const $preview = $container.find('.preview-area');
        
        if($editor.is(':visible')) {
            updatePreview($editor);
            $editor.hide();
            $preview.show();
            $(this).text('Edit');
        } else {
            $preview.hide();
            $editor.show();
            $(this).text('Preview');
        }
    });

    function updatePreview($textarea) {
        const val = $textarea.val();
        const $container = $textarea.closest('.editor-container');
        const html = marked.parse(val || '');
        $container.find('.preview-area').html(html);
    }

    // PDF EXPORT
    $('.export-pdf').click(function() {
        const $container = $(this).closest('.editor-container');
        const $textarea = $container.find('.editor-area');
        
        // We render a temporary invisible div to print
        const content = marked.parse($textarea.val());
        const element = document.createElement('div');
        element.innerHTML = content;
        
        // Basic PDF styling
        element.style.color = "black"; 
        element.style.padding = "20px";

        const opt = {
            margin:       1,
            filename:     ($textarea.data('filepath') || 'document') + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    });
});