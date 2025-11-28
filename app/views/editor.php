<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bhupal's &bull; Markdown Editor</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%230d1117%22/><path d=%22M14 20 l16 12 l-16 12%22 stroke=%22%2300ff41%22 stroke-width=%226%22 fill=%22none%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/><rect x=%2238%22 y=%2246%22 width=%2216%22 height=%226%22 fill=%22%2300ff41%22/></svg>">
    <link rel="stylesheet" href="<?php echo asset('css/editor.css'); ?>">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/split.js/1.6.0/split.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<!-- Pass vault status to JS -->

<body data-base-url="<?php echo base_url(); ?>" data-has-vault="<?php echo $vault ? 'true' : 'false'; ?>">

    <!-- Vault Modal (Always present, toggled via JS) -->
    <div id="vault-modal" class="modal-overlay" style="display:none;">
        <div class="modal-content">
            <h2 style="margin-top:0">Vault Settings</h2>
            <p>Enter absolute server path to your markdown files:</p>
            <input type="text" id="vault-path" placeholder="/var/www/html/my-notes" value="<?php echo htmlspecialchars($vault ?? ''); ?>">

            <div class="modal-actions">
                <button id="save-vault-btn">Set Path</button>
                <button id="cancel-vault-btn" style="background:#555; display:none;">Cancel</button>
            </div>
        </div>
    </div>

    <div class="app-container">
        <!-- LEFT: File Tree -->
        <div id="sidebar">
            <div class="sidebar-header">
                <h3>Explorer</h3>
                <!-- Settings Icon -->
                <button id="settings-btn" title="Change Vault Path">⚙️</button>
            </div>

            <div class="sidebar-controls">
                <input type="text" id="search-input" placeholder="Search files...">
                <button id="new-file-btn" title="New File">+</button>
            </div>

            <div id="file-tree"></div>
        </div>

        <!-- MIDDLE: Editor 1 -->
        <div id="middle-pane" class="editor-container active-pane">
            <div class="pane-header">
                <div class="actions">
                    <span class="file-label">No File Selected</span>
                    <button class="close-file-btn" style="display:none;" title="Close File">×</button>
                </div>
                <span class="save-status"></span>
                <div class="actions">
                    <button class="toggle-preview">Preview</button>
                    <button class="export-pdf">PDF</button>
                </div>
            </div>
            <textarea id="editor-middle" class="editor-area" spellcheck="false"></textarea>
            <div id="preview-middle" class="preview-area"></div>
        </div>

        <!-- RIGHT: Editor 2 -->
        <div id="right-pane" class="editor-container">
            <div class="pane-header">

                <div class="actions">
                    <span class="file-label">No File Selected</span>
                    <button class="close-file-btn" style="display:none;" title="Close File">×</button>
                </div>
                <span class="save-status"></span>
                <div class="actions">
                    <button class="toggle-preview">Preview</button>
                    <button class="export-pdf">PDF</button>
                </div>
            </div>
            <textarea id="editor-right" class="editor-area" spellcheck="false"></textarea>
            <div id="preview-right" class="preview-area"></div>
        </div>
    </div>

    <script src="<?php echo asset('js/editor.js'); ?>"></script>
</body>

</html>