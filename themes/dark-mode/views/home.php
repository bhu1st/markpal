<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Simplo DARK MODE</title>
    <style>
        body { background-color: #1a1a1a; color: #f0f0f0; font-family: sans-serif; margin: 40px; }
        #container { border: 1px solid #555; padding: 10px;}
        h1 { color: #00aaff; border-bottom-color: #555; }
        code { background-color: #333; border-color: #555; color: #00ffcc; padding: 12px 10px; display: block; margin: 14px 0; }
        
    </style>
     <!-- This will correctly resolve to themes/dark-mode/css/theme.css -->
    <link rel="stylesheet" href="<?php echo asset('css/theme.css'); ?>">
    <!-- Let's assume global.js only exists in public/js/global.js -->
    <!-- The helper will not find it in the theme and will fall back to the public path -->
    <script src="<?php echo asset('js/global.js'); ?>"></script>
</head>

<body>
    <div id="container">
        <h1>Welcome to Simplo (Dark Mode Theme!)</h1>

        <div id="body">
            <p>This page is being rendered from the 'dark-mode' theme.</p>
            <p>If you would like to edit this page you'll find it located at:</p>
            <code>themes/dark-mode/views/home.php</code>
            
            <p>The original data from the controller is still here:</p>
            <?php
            echo "<pre>";
            print_r($data);
            echo "</pre>";
            ?>
        </div>
    </div>
</body>
</html>