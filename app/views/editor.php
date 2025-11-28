<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bhupal's &bull; Markdown Editor</title>
    <link rel="stylesheet" href="<?php echo asset('css/editor.css'); ?>">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%230d1117%22/><path d=%22M14 20 l16 12 l-16 12%22 stroke=%22%2300ff41%22 stroke-width=%226%22 fill=%22none%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/><rect x=%2238%22 y=%2246%22 width=%2216%22 height=%226%22 fill=%22%2300ff41%22/></svg>">  
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/split.js/1.6.0/split.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body data-base-url="<?php echo base_url(); ?>" data-has-vault="<?php echo $vault ? 'true' : 'false'; ?>">

    <!-- Vault Settings Modal -->
    <div id="vault-modal" class="modal-overlay" style="display:none;">
        <div class="modal-content">
            <h2 style="margin-top:0">Vault Settings</h2>
            <p>Enter absolute server path:</p>
            <input type="text" id="vault-path" style="width:95%; margin-bottom:10px;" placeholder="/var/www/html/notes" value="<?php echo htmlspecialchars($vault ?? ''); ?>">
            <div style="text-align:right;">
                <button id="cancel-vault-btn" style="background:#555; display:none;">Cancel</button>
                <button id="save-vault-btn">Set Path</button>
            </div>
        </div>
    </div>

    <div class="app-container">
        <!-- Sidebar -->
        <div id="sidebar">
            <div class="sidebar-header">
                <h3>Explorer</h3>
                <button id="settings-btn" title="Settings" style="background:none; font-size:16px;">⚙️</button>
            </div>
            
            <div class="sidebar-controls">
                <input type="text" id="search-input" style="width: 100%;" placeholder="Search...">
            </div>
            <div class="sidebar-controls" style="justify-content: space-between;">
                 <button id="new-file-btn" title="New File" style="font-size:12px;">+ File</button>
                 <button id="split-view-btn" title="Add Editor Pane" style="font-size:12px; background:#005c99;">+ Split View</button>
            </div>

            <div id="file-tree"></div>
        </div>

        <!-- Dynamic Editors Container -->
        <div id="editors-wrapper">
            <!-- Panes will be injected here by JS -->
        </div>
    </div>

     <div id="global-tab-menu">
        <div class="menu-item action-preview"><span>👁️</span> Toggle Preview</div>
        <div class="menu-item action-pdf"><span>📄</span> Export PDF</div>
        <div class="menu-item action-html"><span>🌐</span> Export HTML</div>
    </div>

    <script src="<?php echo asset('js/editor.js'); ?>"></script>
</body>
</html>