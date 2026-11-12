/**
 * Unified file service for MOCCE.
 * Seamlessly uses native OS file dialogs and file system when running inside Tauri,
 * with standard browser Blob/download fallbacks when running on the web.
 */

export function isTauri(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
}

export interface SaveFileResult {
  success: boolean;
  path?: string;
  cancelled?: boolean;
  error?: string;
}

export interface OpenFileResult {
  success: boolean;
  content?: string;
  filename?: string;
  path?: string;
  cancelled?: boolean;
  error?: string;
}

/**
 * Save CCXML content to a file.
 * In Tauri: opens a native Save File dialog and writes directly to disk.
 * In Browser: triggers a browser file download.
 */
export async function saveCcxmlFile(
  content: string,
  suggestedFilename: string = 'callflow.ccxml'
): Promise<SaveFileResult> {
  if (isTauri()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const selectedPath = await save({
        defaultPath: suggestedFilename,
        filters: [
          {
            name: 'CCXML Document (*.ccxml, *.xml)',
            extensions: ['ccxml', 'xml']
          }
        ]
      });

      if (!selectedPath) {
        return { success: false, cancelled: true };
      }

      await writeTextFile(selectedPath, content);
      return { success: true, path: selectedPath };
    } catch (err: any) {
      console.error('Tauri save failed:', err);
      return { success: false, error: err?.message || 'Failed to save file' };
    }
  }

  // Browser fallback
  try {
    const blob = new Blob([content], { type: 'application/ccxml+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, path: suggestedFilename };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Browser download failed' };
  }
}

/**
 * Open a CCXML file from disk.
 * In Tauri: opens a native Open File dialog and reads directly from disk.
 * In Browser: triggers a hidden file input picker.
 */
export async function openCcxmlFile(): Promise<OpenFileResult> {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');

      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'CCXML Document (*.ccxml, *.xml)',
            extensions: ['ccxml', 'xml']
          }
        ]
      });

      if (!selected || typeof selected !== 'string') {
        return { success: false, cancelled: true };
      }

      const content = await readTextFile(selected);
      const filename = selected.split(/[/\\\\]/).pop() || selected;

      return {
        success: true,
        content,
        filename,
        path: selected
      };
    } catch (err: any) {
      console.error('Tauri open failed:', err);
      return { success: false, error: err?.message || 'Failed to open file' };
    }
  }

  // Browser file picker fallback
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ccxml,.xml';
    input.style.display = 'none';

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) {
        resolve({ success: false, cancelled: true });
        return;
      }

      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        resolve({
          success: true,
          content: (event.target?.result as string) || '',
          filename: file.name
        });
      };

      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file' });
      };

      reader.readAsText(file);
    };

    input.oncancel = () => {
      resolve({ success: false, cancelled: true });
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}
