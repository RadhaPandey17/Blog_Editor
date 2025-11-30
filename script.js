/* ============================================
   MODERN BLOG EDITOR - JAVASCRIPT
   ============================================ */

// ============================================
// MARKDOWN TO HTML CONVERTER
// ============================================
function markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown;
    const lines = html.split('\n');
    const processedLines = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let inList = false;
    let listType = null;
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Handle code blocks
        if (trimmedLine.startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                processedLines.push('<pre><code>' + escapeHtml(codeBlockContent.join('\n')) + '</code></pre>');
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                // Start code block
                if (inList) {
                    // Close list before code block
                    const listTag = listType === 'ul' ? 'ul' : 'ol';
                    processedLines.push('<' + listTag + '>');
                    listItems.forEach(item => {
                        processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                    });
                    processedLines.push('</' + listTag + '>');
                    inList = false;
                    listItems = [];
                }
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Handle headers
        if (trimmedLine.match(/^### /)) {
            if (inList) {
                const listTag = listType === 'ul' ? 'ul' : 'ol';
                processedLines.push('<' + listTag + '>');
                listItems.forEach(item => {
                    processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                });
                processedLines.push('</' + listTag + '>');
                inList = false;
                listItems = [];
            }
            processedLines.push('<h3>' + processInlineMarkdown(trimmedLine.substring(4)) + '</h3>');
            continue;
        }
        if (trimmedLine.match(/^## /)) {
            if (inList) {
                const listTag = listType === 'ul' ? 'ul' : 'ol';
                processedLines.push('<' + listTag + '>');
                listItems.forEach(item => {
                    processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                });
                processedLines.push('</' + listTag + '>');
                inList = false;
                listItems = [];
            }
            processedLines.push('<h2>' + processInlineMarkdown(trimmedLine.substring(3)) + '</h2>');
            continue;
        }
        if (trimmedLine.match(/^# /)) {
            if (inList) {
                const listTag = listType === 'ul' ? 'ul' : 'ol';
                processedLines.push('<' + listTag + '>');
                listItems.forEach(item => {
                    processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                });
                processedLines.push('</' + listTag + '>');
                inList = false;
                listItems = [];
            }
            processedLines.push('<h1>' + processInlineMarkdown(trimmedLine.substring(2)) + '</h1>');
            continue;
        }

        // Handle horizontal rules
        if (trimmedLine === '---' || trimmedLine === '***') {
            if (inList) {
                const listTag = listType === 'ul' ? 'ul' : 'ol';
                processedLines.push('<' + listTag + '>');
                listItems.forEach(item => {
                    processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                });
                processedLines.push('</' + listTag + '>');
                inList = false;
                listItems = [];
            }
            processedLines.push('<hr>');
            continue;
        }

        // Handle blockquotes
        if (trimmedLine.match(/^> /)) {
            if (inList) {
                const listTag = listType === 'ul' ? 'ul' : 'ol';
                processedLines.push('<' + listTag + '>');
                listItems.forEach(item => {
                    processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                });
                processedLines.push('</' + listTag + '>');
                inList = false;
                listItems = [];
            }
            processedLines.push('<blockquote>' + processInlineMarkdown(trimmedLine.substring(2)) + '</blockquote>');
            continue;
        }

        // Handle lists
        const ulMatch = trimmedLine.match(/^[\*\-\+] (.*)$/);
        const olMatch = trimmedLine.match(/^\d+\. (.*)$/);

        if (ulMatch || olMatch) {
            const currentListType = ulMatch ? 'ul' : 'ol';
            const content = ulMatch ? ulMatch[1] : olMatch[1];

            if (inList && listType !== currentListType) {
                // Different list type, close previous list
                const listTag = listType === 'ul' ? 'ul' : 'ol';
                processedLines.push('<' + listTag + '>');
                listItems.forEach(item => {
                    processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                });
                processedLines.push('</' + listTag + '>');
                listItems = [];
            }

            if (!inList) {
                listType = currentListType;
                inList = true;
            }

            listItems.push(content);
            continue;
        } else {
            // Not a list item, close list if open
            if (inList) {
                const listTag = listType === 'ul' ? 'ul' : 'ol';
                processedLines.push('<' + listTag + '>');
                listItems.forEach(item => {
                    processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
                });
                processedLines.push('</' + listTag + '>');
                inList = false;
                listItems = [];
            }
        }

        // Regular paragraph
        if (trimmedLine) {
            processedLines.push(trimmedLine);
        } else {
            processedLines.push('');
        }
    }

    // Close any open list
    if (inList) {
        const listTag = listType === 'ul' ? 'ul' : 'ol';
        processedLines.push('<' + listTag + '>');
        listItems.forEach(item => {
            processedLines.push('<li>' + processInlineMarkdown(item) + '</li>');
        });
        processedLines.push('</' + listTag + '>');
    }

    html = processedLines.join('\n');

    // Convert paragraphs
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(para => {
        para = para.trim();
        if (!para) return '';
        if (para.match(/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|p)/)) {
            return para;
        }
        // Convert single line breaks to <br> within paragraphs
        para = para.replace(/\n/g, '<br>');
        return '<p>' + processInlineMarkdown(para) + '</p>';
    }).filter(p => p).join('\n');

    return html;
}

// Process inline markdown (bold, italic, links, images, code)
function processInlineMarkdown(text) {
    if (!text) return '';
    
    // Images first (before links)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />');
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
    
    // Code (inline)
    text = text.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/gim, '<strong>$1</strong>');
    
    // Italic (after bold to avoid conflicts)
    text = text.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/gim, '<em>$1</em>');
    text = text.replace(/(?<!_)_([^_]+?)_(?!_)/gim, '<em>$1</em>');
    
    return text;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Calculate word count
function getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Calculate character count
function getCharacterCount(text) {
    return text ? text.length : 0;
}

// Calculate reading time
function getReadingTime(wordCount) {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
}

// Update stats (word count, character count, reading time)
function updateStats() {
    const content = document.getElementById('markdownEditor').value;
    const wordCount = getWordCount(content);
    const charCount = getCharacterCount(content);
    const readingTime = getReadingTime(wordCount);

    const wordCountEl = document.getElementById('wordCount');
    const charCountEl = document.getElementById('charCount');
    const readingTimeEl = document.getElementById('readingTime');

    if (wordCountEl) wordCountEl.textContent = wordCount;
    if (charCountEl) charCountEl.textContent = charCount;
    if (readingTimeEl) readingTimeEl.textContent = readingTime > 0 ? `${readingTime} min` : '< 1 min';
}

// ============================================
// AUTOSAVE FUNCTIONALITY
// ============================================
function autosave() {
    const title = document.getElementById('titleInput')?.value || '';
    const content = document.getElementById('markdownEditor')?.value || '';
    const coverImage = document.getElementById('coverImageInput')?.value || '';
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';

    localStorage.setItem('blogTitle', title);
    localStorage.setItem('blogContent', content);
    localStorage.setItem('blogCoverImage', coverImage);
    localStorage.setItem('blogTheme', theme);
}

// Load saved data
function loadSavedData() {
    const title = localStorage.getItem('blogTitle') || '';
    const content = localStorage.getItem('blogContent') || '';
    const coverImage = localStorage.getItem('blogCoverImage') || '';
    const theme = localStorage.getItem('blogTheme') || 'light';

    const titleInput = document.getElementById('titleInput');
    const markdownEditor = document.getElementById('markdownEditor');
    const coverImageInput = document.getElementById('coverImageInput');
    const themeToggle = document.getElementById('themeToggle');

    if (titleInput) titleInput.value = title;
    if (markdownEditor) markdownEditor.value = content;
    if (coverImageInput) coverImageInput.value = coverImage;

    if (theme === 'dark') {
        document.body.classList.add('dark');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            if (icon) icon.textContent = '☀️';
        }
    } else {
        document.body.classList.remove('dark');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            if (icon) icon.textContent = '🌙';
        }
    }

    updatePreview();
    updateStats();
}

// ============================================
// PREVIEW UPDATE
// ============================================
function updatePreview() {
    const titleInput = document.getElementById('titleInput');
    const markdownEditor = document.getElementById('markdownEditor');
    const coverImageInput = document.getElementById('coverImageInput');
    const previewContent = document.getElementById('previewContent');

    if (!previewContent) return;

    const title = titleInput?.value || '';
    const content = markdownEditor?.value || '';
    const coverImage = coverImageInput?.value || '';

    if (!title && !content && !coverImage) {
        previewContent.innerHTML = '<div class="preview-placeholder"><p>Your preview will appear here as you type...</p></div>';
        return;
    }

    let html = '';

    if (title) {
        html += `<h1>${escapeHtml(title)}</h1>`;
    }

    if (coverImage && coverImage.trim() !== '') {
        html += `<div class="cover-image-container"><img src="${escapeHtml(coverImage)}" alt="Cover image" class="cover-image" onerror="this.parentElement.style.display='none'" /></div>`;
    }

    if (content) {
        html += markdownToHtml(content);
    }

    previewContent.innerHTML = html || '<div class="preview-placeholder"><p>Your preview will appear here as you type...</p></div>';
    previewContent.classList.add('fade-in');
}

// ============================================
// TOOLBAR FUNCTIONS
// ============================================
function insertMarkdown(markdown) {
    const textarea = document.getElementById('markdownEditor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let insertText = '';
    switch(markdown) {
        case 'bold':
            insertText = selectedText ? `**${selectedText}**` : '**bold text**';
            break;
        case 'italic':
            insertText = selectedText ? `*${selectedText}*` : '*italic text*';
            break;
        case 'h1':
            insertText = selectedText ? `# ${selectedText}` : '# Heading 1';
            break;
        case 'h2':
            insertText = selectedText ? `## ${selectedText}` : '## Heading 2';
            break;
        case 'code':
            insertText = selectedText ? `\`${selectedText}\`` : '`code`';
            break;
        default:
            return;
    }

    const newText = text.substring(0, start) + insertText + text.substring(end);
    textarea.value = newText;
    textarea.focus();
    
    // Set cursor position
    const newPosition = start + insertText.length;
    textarea.setSelectionRange(newPosition, newPosition);

    updatePreview();
    updateStats();
    autosave();
}

// ============================================
// COPY TO CLIPBOARD
// ============================================
async function copyToClipboard() {
    const content = document.getElementById('markdownEditor')?.value || '';
    if (!content) {
        showNotification('Nothing to copy!', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(content);
        showNotification('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Copied to clipboard!', 'success');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-primary);
        backdrop-filter: blur(20px);
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: var(--shadow-strong);
        border: 1px solid var(--border-color);
        z-index: 10000;
        animation: fadeIn 0.3s ease;
        font-weight: 600;
        color: var(--text-primary);
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================
function downloadMarkdown() {
    const title = document.getElementById('titleInput')?.value || 'Untitled';
    const content = document.getElementById('markdownEditor')?.value || '';
    const coverImage = document.getElementById('coverImageInput')?.value || '';

    let markdown = '';
    if (title) {
        markdown += `# ${title}\n\n`;
    }
    if (coverImage) {
        markdown += `![Cover Image](${coverImage})\n\n`;
    }
    markdown += content;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Markdown file downloaded!', 'success');
}

function downloadText() {
    const title = document.getElementById('titleInput')?.value || 'Untitled';
    const content = document.getElementById('markdownEditor')?.value || '';
    const coverImage = document.getElementById('coverImageInput')?.value || '';

    let text = '';
    if (title) {
        text += `${title}\n\n`;
    }
    if (coverImage) {
        text += `Cover Image: ${coverImage}\n\n`;
    }
    text += content;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Text file downloaded!', 'success');
}

// ============================================
// THEME TOGGLE
// ============================================
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('.theme-icon');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    }
    autosave();
}

// ============================================
// RESIZABLE PANEL
// ============================================
function initResizablePanel() {
    const container = document.querySelector('.editor-container');
    const resizer = document.querySelector('.resizer');
    const editorPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');

    if (!container || !resizer || !editorPanel || !previewPanel) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = editorPanel.offsetWidth;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const width = startWidth + (e.clientX - startX);
        const containerWidth = container.offsetWidth;
        const minWidth = 200;
        const maxWidth = containerWidth - minWidth - 4;

        if (width >= minWidth && width <= maxWidth) {
            editorPanel.style.width = width + 'px';
            previewPanel.style.flex = '1';
        }
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResize);
    }

    // Touch support for mobile
    resizer.addEventListener('touchstart', (e) => {
        isResizing = true;
        startX = e.touches[0].clientX;
        startWidth = editorPanel.offsetWidth;
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', stopResize);
        e.preventDefault();
    });

    function handleTouchMove(e) {
        if (!isResizing) return;
        const width = startWidth + (e.touches[0].clientX - startX);
        const containerWidth = container.offsetWidth;
        const minWidth = 200;
        const maxWidth = containerWidth - minWidth - 4;

        if (width >= minWidth && width <= maxWidth) {
            editorPanel.style.width = width + 'px';
            previewPanel.style.flex = '1';
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the editor page
    if (document.getElementById('titleInput')) {
        loadSavedData();

        // Event listeners
        const titleInput = document.getElementById('titleInput');
        const markdownEditor = document.getElementById('markdownEditor');
        const coverImageInput = document.getElementById('coverImageInput');
        const themeToggle = document.getElementById('themeToggle');
        const publishBtn = document.getElementById('publishBtn');
        const downloadMd = document.getElementById('downloadMd');
        const downloadTxt = document.getElementById('downloadTxt');
        const copyBtn = document.getElementById('copyBtn');

        if (titleInput) {
            titleInput.addEventListener('input', function() {
                updatePreview();
                updateStats();
                autosave();
            });
        }

        if (markdownEditor) {
            markdownEditor.addEventListener('input', function() {
                updatePreview();
                updateStats();
                autosave();
            });
        }

        if (coverImageInput) {
            coverImageInput.addEventListener('input', function() {
                updatePreview();
                autosave();
            });
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        if (publishBtn) {
            publishBtn.addEventListener('click', function() {
                autosave();
                window.location.href = 'publish.html';
            });
        }

        if (downloadMd) {
            downloadMd.addEventListener('click', downloadMarkdown);
        }

        if (downloadTxt) {
            downloadTxt.addEventListener('click', downloadText);
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', copyToClipboard);
        }

        // Toolbar buttons
        const toolbarButtons = document.querySelectorAll('.toolbar-btn');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                if (action) {
                    insertMarkdown(action);
                }
            });
        });

        // Initialize resizable panel
        initResizablePanel();

        // Autosave on page unload
        window.addEventListener('beforeunload', autosave);

        // Periodic autosave (every 30 seconds)
        setInterval(autosave, 30000);
    }
});

